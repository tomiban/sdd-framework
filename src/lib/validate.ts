import type { Dirent } from "node:fs";
import { exec } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { citesConstitution, missingSections, parseTasks, rfTokens } from "./analysis.js";
import { readVerifyConfig } from "./config.js";
import {
  artifactsLine,
  constitutionEmpty,
  constitutionLine,
  constitutionMissing,
  constitutionUncited,
  createFileError,
  idExtraArgsError,
  idInvalidError,
  idMissingError,
  notInitializedError,
  specAmbiguous,
  specNotFound,
  structureLine,
  structureRequiresSpec,
  tasksLine,
  tasksRequiresFile,
  tasksStructureLine,
  traceLine,
  traceRequiresSpec,
  validateTitle,
  verdictLine,
  verdesLine,
  type VerifyOutcome,
} from "./messages.js";
import { findSpecDir, parseSpecId } from "./spec.js";
import { resolveTemplateSource } from "./templates.js";

/** Resultado de un comando de verificación: código de salida o `timeout`. */
export type VerifyRunner = (command: string, cwd: string) => Promise<number | "timeout">;

const VERIFY_TIMEOUT_MS = 600_000; // 10 minutos por comando (RF-5)

/** Runner por defecto (RF-5, NFR-1): `child_process`, sin dependencias. */
export function runVerifyCommand(command: string, cwd: string): Promise<number | "timeout"> {
  return new Promise((resolve) => {
    exec(command, { cwd, timeout: VERIFY_TIMEOUT_MS }, (error) => {
      if (error === null) {
        resolve(0);
        return;
      }
      if (error.killed) {
        resolve("timeout");
        return;
      }
      resolve(typeof error.code === "number" ? error.code : 1);
    });
  });
}

export interface ValidateOptions {
  readonly root: string;
  readonly args: readonly string[];
  /** Runner de verdes inyectable para tests (NFR-7). */
  readonly runner?: VerifyRunner;
}

export type ValidateResult =
  | { readonly ok: true; readonly lines: readonly string[]; readonly exitCode: 0 | 1 }
  | { readonly ok: false; readonly message: string; readonly exitCode: 1 };

const ARTIFACTS = ["spec.md", "plan.md", "tasks.md"] as const;

async function readIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

function fail(message: string): ValidateResult {
  return { ok: false, message, exitCode: 1 };
}

/**
 * Ejecuta `sdd validate <NNN>` (RF-1…RF-12, spec 004). Precondiciones en el
 * orden de QA A1 (argumentos → id → `specs/` → spec → `sdd.json`); las
 * comprobaciones del informe son hallazgos (NO LISTO), no errores (QA A6).
 * El veredicto es LISTO solo si todas las comprobaciones son ✓ (RF-11).
 */
export async function validateSpec(options: ValidateOptions): Promise<ValidateResult> {
  const args = options.args;
  if (args.length === 0) {
    return fail(idMissingError("validate"));
  }
  if (args.length > 1) {
    return fail(idExtraArgsError("validate"));
  }
  const input = args[0] ?? "";
  const nnn = parseSpecId(input);
  if (nnn === null) {
    return fail(idInvalidError("validate", input));
  }

  const specsDir = join(options.root, "specs");
  let dirents: readonly Dirent[];
  try {
    dirents = await readdir(specsDir, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return fail(notInitializedError());
    }
    return fail(createFileError("specs", (error as Error).message));
  }

  const found = findSpecDir(
    dirents.map((dirent) => dirent.name),
    nnn,
  );
  if (!found.ok) {
    return fail(found.reason === "missing" ? specNotFound(nnn) : specAmbiguous(nnn, found.matches));
  }

  const config = await readVerifyConfig(options.root);
  if (!config.ok) {
    return fail(config.message);
  }

  const specDir = join(specsDir, found.dir);
  const contents = new Map<string, string | null>();
  for (const file of ARTIFACTS) {
    contents.set(file, await readIfExists(join(specDir, file)));
  }
  const specText = contents.get("spec.md") ?? null;
  const planText = contents.get("plan.md") ?? "";
  const tasksText = contents.get("tasks.md") ?? "";

  let ready = true;
  const checks: string[] = [];

  // 1. Artefactos (RF-6)
  const missingArtifacts = ARTIFACTS.filter((file) => contents.get(file) === null);
  checks.push(artifactsLine(missingArtifacts));
  if (missingArtifacts.length > 0) {
    ready = false;
  }

  // 2. Estructura de spec.md (RF-7, QA A3)
  if (specText === null) {
    checks.push(structureRequiresSpec());
    ready = false;
  } else {
    const templateText = await readFile(resolveTemplateSource("spec.md"), "utf8");
    const missing = missingSections(specText, templateText);
    checks.push(structureLine(missing));
    if (missing.length > 0) {
      ready = false;
    }
  }

  // 3. Trazabilidad RF (RF-8, QA A2)
  if (specText === null) {
    checks.push(traceRequiresSpec());
    ready = false;
  } else {
    const specRfs = rfTokens(specText);
    const planRfs = new Set(rfTokens(planText));
    const tasksRfs = new Set(rfTokens(tasksText));
    const missingPlan = specRfs.filter((rf) => !planRfs.has(rf));
    const missingTasks = specRfs.filter((rf) => !tasksRfs.has(rf));
    checks.push(traceLine(missingPlan, missingTasks));
    if (missingPlan.length > 0 || missingTasks.length > 0) {
      ready = false;
    }
  }

  // 4. Tareas (RF-9, QA A5)
  if (contents.get("tasks.md") === null) {
    checks.push(tasksRequiresFile());
    ready = false;
  } else {
    const summary = parseTasks(tasksText);
    if (!summary.hasTasks || !summary.hasCheckboxes) {
      checks.push(tasksStructureLine(summary.hasTasks));
      ready = false;
    } else {
      checks.push(tasksLine(summary.doneCount, summary.totalCount, summary.pendingIds));
      if (summary.pendingIds.length > 0) {
        ready = false;
      }
    }
  }

  // 5. Constitución (RF-10, QA A8)
  const constitutionText = await readIfExists(join(options.root, "docs", "constitution.md"));
  if (constitutionText === null) {
    checks.push(constitutionMissing());
    ready = false;
  } else if (constitutionText.trim() === "") {
    checks.push(constitutionEmpty());
    ready = false;
  } else if (!citesConstitution([specText ?? "", planText, tasksText])) {
    checks.push(constitutionUncited());
    ready = false;
  } else {
    checks.push(constitutionLine());
  }

  // 6. Verdes (RF-5, QA A7): se ejecutan todos, aunque falle uno anterior.
  const runner = options.runner ?? runVerifyCommand;
  const outcomes: VerifyOutcome[] = [];
  for (const command of config.commands) {
    outcomes.push({ command, outcome: await runner(command, options.root) });
  }
  checks.push(verdesLine(outcomes));
  if (outcomes.some((entry) => entry.outcome !== 0)) {
    ready = false;
  }

  return {
    ok: true,
    lines: [validateTitle(found.dir), "", ...checks, "", verdictLine(found.dir, ready)],
    exitCode: ready ? 0 : 1,
  };
}
