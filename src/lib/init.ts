import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { join } from "node:path";

import {
  conflictError,
  createError,
  createdLine,
  existsLine,
  initTitle,
  successMessage,
  usageError,
  writeError,
} from "./messages.js";
import { detectInitState, type ElementState } from "./state.js";
import { flattenStructure, SDD_STRUCTURE } from "./structure.js";

export interface InitOptions {
  /** Directorio sobre el que operar (el cwd del usuario). */
  readonly root: string;
  /** Args que quedan tras el comando (`sdd init <esto>`); vacíos para init limpio. */
  readonly args: readonly string[];
}

export type InitResult =
  | { readonly ok: true; readonly lines: readonly string[]; readonly exitCode: 0 }
  | { readonly ok: false; readonly message: string; readonly exitCode: 1 };

/**
 * Ejecuta `sdd init` (RF-1…RF-11). Precondiciones en el orden de QA A3:
 * 1) argumentos no soportados → error; 2) conflicto archivo/directorio → error;
 * 3) escritura del cwd (solo si hay algo que crear) → error; 4) creación en
 * orden canónico; 5) líneas exactas de salida (modo creación vs ya inicializado).
 */
export async function initialize(options: InitOptions): Promise<InitResult> {
  if (options.args.length > 0) {
    return { ok: false, message: usageError(), exitCode: 1 };
  }

  // RF-2 / RF-9 (QA A2: la detección recorre toda la estructura).
  const state = await detectInitState(options.root);

  const conflict = state.elements.find((element) => element.status === "conflict");
  if (conflict) {
    return { ok: false, message: conflictError(conflict.path), exitCode: 1 };
  }

  const missing = new Set(
    state.elements.filter((element) => element.status === "missing").map((element) => element.path),
  );

  // RF-8 (QA A5: solo si hay algo que crear).
  if (missing.size > 0) {
    try {
      await access(options.root, constants.W_OK);
    } catch {
      return { ok: false, message: writeError(), exitCode: 1 };
    }
  }

  // RF-3 / RF-4 (D6: best-effort por elemento, sin rollback — QA A7).
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

  // RF-5 / RF-6 / RF-7 (D3: modo de salida según createdAny).
  return { ok: true, lines: buildLines(state.elements, created), exitCode: 0 };
}

function buildLines(
  elements: readonly ElementState[],
  created: ReadonlySet<string>,
): string[] {
  const rootNames = new Set(SDD_STRUCTURE.map((node) => node.name));
  const createdAny = created.size > 0;
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

  lines.push("", successMessage(createdAny));
  return lines;
}