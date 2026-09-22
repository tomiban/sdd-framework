import { constants } from "node:fs";
import { access, appendFile, copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";

import {
  agentsCitedLine,
  agentsRuleAddedLine,
  appendError,
  conflictError,
  constitutionEmptyWarn,
  createError,
  createFileError,
  createdLine,
  existsLine,
  fileConflictError,
  fileCreatedLine,
  fileExistsLine,
  initTitle,
  readError,
  successMessage,
  usageError,
  writeError,
} from "./messages.js";
import { detectInitState, fileStatus, type ElementState } from "./state.js";
import { flattenStructure, SDD_STRUCTURE } from "./structure.js";
import { AGENTS_RULE_SOURCE, resolveTemplateSource, templatesFor } from "./templates.js";

export interface InitOptions {
  /** Directorio sobre el que operar (el cwd del usuario). */
  readonly root: string;
  /** Args que quedan tras el comando (`sdd init <esto>`); vacíos para init limpio. */
  readonly args: readonly string[];
  /** Override del template de constitución para tests del fallo de copia (QA A11). */
  readonly templatePath?: URL;
}

export type InitResult =
  | { readonly ok: true; readonly lines: readonly string[]; readonly exitCode: 0 }
  | { readonly ok: false; readonly message: string; readonly exitCode: 1 };

const CONSTITUTION_PATH = "docs/constitution.md";
const AGENTS_PATH = "AGENTS.md";
/** Cuenta como cita cualquier mención de `constitution.md` (QA A3). */
const CITES_PATTERN = /constitution\.md/i;

type ConstitutionStatus = "created" | "exists" | "empty";
/** 006: `absent` desaparece — init siempre deja `AGENTS.md`. */
type AgentsStatus = "created" | "cited" | "appended";
/**
 * Ejecuta `sdd init` (RF-1…RF-11 de la spec 001; RF-1…RF-8 de la spec 005,
 * que sustituye los bloques de salida de los RF-5/RF-6). Precondiciones en el
 * orden de QA A1 (005): 1) argumentos; 2) conflictos de directorio (001) y de
 * archivo (005); 3) escritura del cwd solo si hay algo que crear o añadir;
 * 4) directorios; 5) constitución (con rollback); 6) regla de `AGENTS.md`;
 * 7) líneas exactas.
 */
export async function initialize(options: InitOptions): Promise<InitResult> {
  if (options.args.length > 0) {
    return { ok: false, message: usageError(), exitCode: 1 };
  }

  // RF-2 / RF-9 (QA A2/001: la detección recorre toda la estructura).
  const state = await detectInitState(options.root);

  const conflict = state.elements.find((element) => element.status === "conflict");
  if (conflict) {
    return { ok: false, message: conflictError(conflict.path), exitCode: 1 };
  }

  // RF-3 / RF-5 (005): conflictos de archivo (QA A10).
  const constitutionAbs = join(options.root, CONSTITUTION_PATH);
  const agentsAbs = join(options.root, AGENTS_PATH);

  const constitutionFile = await fileStatus(constitutionAbs);
  if (constitutionFile === "conflict") {
    return { ok: false, message: fileConflictError(CONSTITUTION_PATH), exitCode: 1 };
  }
  const agentsFile = await fileStatus(agentsAbs);
  if (agentsFile === "conflict") {
    return { ok: false, message: fileConflictError(AGENTS_PATH), exitCode: 1 };
  }

  let constitutionText = "";
  if (constitutionFile === "exists") {
    // Archivo ilegible → error con ruta, jamás stack trace (borde de lectura).
    try {
      constitutionText = await readFile(constitutionAbs, "utf8");
    } catch (error) {
      return {
        ok: false,
        message: readError(CONSTITUTION_PATH, (error as Error).message),
        exitCode: 1,
      };
    }
  }
  const constitutionEmpty = constitutionFile === "exists" && constitutionText.trim() === "";

  // RF-4 / RF-5 (005): la regla se añade una sola vez (QA A3, NFR-5).
  let agentsText = "";
  if (agentsFile === "exists") {
    try {
      agentsText = await readFile(agentsAbs, "utf8");
    } catch (error) {
      return {
        ok: false,
        message: readError(AGENTS_PATH, (error as Error).message),
        exitCode: 1,
      };
    }
  }
  const needAgentsRule = agentsFile === "exists" && !CITES_PATTERN.test(agentsText);

  const missing = new Set(
    state.elements.filter((element) => element.status === "missing").map((element) => element.path),
  );
  const needConstitution = constitutionFile === "missing";
  const needAgents = agentsFile === "missing";

  // RF-8 (QA A5/001, ampliado: también si hay que copiar o añadir).
  if (missing.size > 0 || needConstitution || needAgents || needAgentsRule) {
    try {
      await access(options.root, constants.W_OK);
    } catch {
      return { ok: false, message: writeError(), exitCode: 1 };
    }
  }

  // RF-3 / RF-4 (001, D6: best-effort por elemento, sin rollback — QA A7).
  const created = new Set<string>();
  for (const element of flattenStructure()) {
    if (!missing.has(element.path)) {
      continue;
    }
    try {
      await mkdir(join(options.root, element.path));
      created.add(element.path);
    } catch (error) {
      return {
        ok: false,
        message: createError(element.path, (error as Error).message),
        exitCode: 1,
      };
    }
  }

  // RF-1 (005/006): plantillas de init faltantes (constitución #3), con rollback
  // por archivo (QA A11/005, QA A6/006).
  const copyNeeded = new Map<string, boolean>([
    [CONSTITUTION_PATH, needConstitution],
    [AGENTS_PATH, needAgents],
  ]);
  for (const entry of templatesFor("init")) {
    if (!copyNeeded.get(entry.dest)) {
      continue;
    }
    const dest = join(options.root, entry.dest);
    try {
      const source = options.templatePath ?? resolveTemplateSource(entry.source);
      await copyFile(source, dest);
    } catch (error) {
      // Rollback del archivo parcial recién creado.
      try {
        await rm(dest, { force: true });
      } catch {
        // Rollback best-effort: se reporta el error original.
      }
      return {
        ok: false,
        message: createFileError(entry.dest, (error as Error).message),
        exitCode: 1,
      };
    }
  }

  // RF-2 (005): regla aditiva en AGENTS.md existente sin cita (CL-6/005, CL-5/006).
  if (needAgentsRule) {
    try {
      const rule = await readFile(resolveTemplateSource(AGENTS_RULE_SOURCE), "utf8");
      const prefix = agentsText !== "" && !agentsText.endsWith("\n") ? "\n" : "";
      await appendFile(agentsAbs, `${prefix}${rule}`);
    } catch (error) {
      return {
        ok: false,
        message: appendError(AGENTS_PATH, (error as Error).message),
        exitCode: 1,
      };
    }
  }

  const constitutionStatus: ConstitutionStatus = needConstitution
    ? "created"
    : constitutionEmpty
      ? "empty"
      : "exists";
  const agentsStatus: AgentsStatus =
    agentsFile === "missing" ? "created" : needAgentsRule ? "appended" : "cited";

  // RF-6 (005): bloques exactos que sustituyen a los de la 001 (QA A7/A9).
  return {
    ok: true,
    lines: buildLines(state.elements, created, constitutionStatus, agentsStatus),
    exitCode: 0,
  };
}

function buildLines(
  elements: readonly ElementState[],
  created: ReadonlySet<string>,
  constitution: ConstitutionStatus,
  agents: AgentsStatus,
): string[] {
  const rootNames = new Set(SDD_STRUCTURE.map((node) => node.name));
  const createdAny =
    created.size > 0 || constitution === "created" || agents === "created" || agents === "appended";
  const lines: string[] = [initTitle(), ""];

  if (createdAny) {
    for (const element of elements) {
      lines.push(
        created.has(element.path) ? createdLine(element.path) : existsLine(element.path),
      );
    }
  } else {
    for (const element of elements) {
      if (rootNames.has(element.name)) {
        lines.push(existsLine(element.path));
      }
    }
  }

  // QA A7: líneas de archivo al final; primero constitución, luego AGENTS.
  lines.push(
    constitution === "created"
      ? fileCreatedLine(CONSTITUTION_PATH)
      : constitution === "empty"
        ? constitutionEmptyWarn()
        : fileExistsLine(CONSTITUTION_PATH),
  );
  if (agents === "created") {
    lines.push(fileCreatedLine(AGENTS_PATH));
  } else if (agents === "cited") {
    lines.push(agentsCitedLine());
  } else {
    lines.push(agentsRuleAddedLine());
  }

  lines.push("", successMessage(createdAny));
  return lines;
}
