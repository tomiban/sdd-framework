import type { Dirent } from "node:fs";
import { copyFile, readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

import {
  createFileError,
  existsError,
  fileCreatedLine,
  missingPlanFile,
  missingSpecFile,
  notInitializedError,
  phaseExtraArgs,
  phaseInvalidId,
  phaseMissingId,
  phaseSuccess,
  phaseTitle,
  specAmbiguous,
  specNotFound,
  type PhaseName,
} from "./messages.js";
import { findSpecDir, parseSpecId } from "./spec.js";
import { resolveTemplateSource, templatesFor } from "./templates.js";

/** Fases documentales del flujo SDD que el CLI puede crear. */
export type Phase = PhaseName;

export const PHASE_FILES: Readonly<Record<Phase, string>> = {
  plan: "plan.md",
  tasks: "tasks.md",
};

/**
 * Prerequisitos por fase (QA A4/D6): la existencia del archivo marca que la
 * fase anterior está hecha. Se comprueban en orden del flujo (spec → plan).
 */
export const PHASE_PREREQS: Readonly<Record<Phase, readonly string[]>> = {
  plan: ["spec.md"],
  tasks: ["spec.md", "plan.md"],
};

export interface PhaseOptions {
  readonly root: string;
  readonly phase: Phase;
  readonly args: readonly string[];
  /** Override del template para tests del fallo de copia (QA A8). */
  readonly templatePath?: URL;
}

export type PhaseResult =
  | { readonly ok: true; readonly lines: readonly string[]; readonly exitCode: 0 }
  | { readonly ok: false; readonly message: string; readonly exitCode: 1 };

/**
 * Ejecuta `sdd plan <NNN>` / `sdd tasks <NNN>` (RF-1…RF-11). Precondiciones
 * en el orden de QA A1: argumentos → id → `specs/` → spec única →
 * prerequisitos de fase → destino → copia con rollback del destino parcial
 * (QA A5/D7). El contenido se copia del template centralizado (constitución
 * #3), nunca desde strings del código.
 */
export async function createPhaseFile(options: PhaseOptions): Promise<PhaseResult> {
  const command = options.phase;
  const args = options.args;
  if (args.length === 0) {
    return { ok: false, message: phaseMissingId(command), exitCode: 1 };
  }
  if (args.length > 1) {
    return { ok: false, message: phaseExtraArgs(command), exitCode: 1 };
  }
  const input = args[0] ?? "";
  const nnn = parseSpecId(input);
  if (nnn === null) {
    return { ok: false, message: phaseInvalidId(command, input), exitCode: 1 };
  }

  const specsDir = join(options.root, "specs");
  let dirents: readonly Dirent[];
  try {
    // ENOENT/ENOTDIR → sugerir `sdd init` (RF-6, CL-7); resto → error con ruta.
    dirents = await readdir(specsDir, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return { ok: false, message: notInitializedError(), exitCode: 1 };
    }
    return {
      ok: false,
      message: createFileError("specs", (error as Error).message),
      exitCode: 1,
    };
  }

  const found = findSpecDir(
    dirents.map((dirent) => dirent.name),
    nnn,
  );
  if (!found.ok) {
    return {
      ok: false,
      message: found.reason === "missing" ? specNotFound(nnn) : specAmbiguous(nnn, found.matches),
      exitCode: 1,
    };
  }

  const specDir = join(specsDir, found.dir);
  const specRel = `specs/${found.dir}`;
  for (const prereq of PHASE_PREREQS[options.phase]) {
    const prereqPath = `${specRel}/${prereq}`;
    try {
      await stat(join(specDir, prereq));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        return {
          ok: false,
          message: createFileError(prereqPath, (error as Error).message),
          exitCode: 1,
        };
      }
      return {
        ok: false,
        message:
          prereq === "plan.md" ? missingPlanFile(prereqPath, nnn) : missingSpecFile(prereqPath),
        exitCode: 1,
      };
    }
  }

  const file = PHASE_FILES[options.phase];
  const dest = join(specDir, file);
  const destPath = `${specRel}/${file}`;
  try {
    const destInfo = await stat(dest);
    return {
      ok: false,
      message: existsError(destPath, destInfo.isDirectory()),
      exitCode: 1,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      return {
        ok: false,
        message: createFileError(destPath, (error as Error).message),
        exitCode: 1,
      };
    }
  }

  try {
    for (const entry of templatesFor(options.phase)) {
      const source = options.templatePath ?? resolveTemplateSource(entry.source);
      await copyFile(source, join(specDir, entry.dest));
    }
  } catch (error) {
    // QA A5/D7: rollback del archivo destino que este comando haya empezado a
    // escribir. El directorio de la spec ya existía: no se toca.
    try {
      await rm(dest, { force: true });
    } catch {
      // Rollback best-effort: se reporta el error original.
    }
    return {
      ok: false,
      message: createFileError(destPath, (error as Error).message),
      exitCode: 1,
    };
  }

  return {
    ok: true,
    lines: [
      phaseTitle(options.phase),
      "",
      fileCreatedLine(destPath),
      "",
      phaseSuccess(options.phase, destPath),
    ],
    exitCode: 0,
  };
}
