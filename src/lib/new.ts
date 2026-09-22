import type { Dirent } from "node:fs";
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

import {
  createFileError,
  existsError,
  fileCreatedLine,
  newCreatedDir,
  newExtraArgs,
  newInvalidSlug,
  newLimit,
  newMissingSlug,
  newSuccess,
  newTitle,
  notInitializedError,
} from "./messages.js";
import { isValidSlug, nextSpecNumber, specDirName } from "./spec.js";
import { resolveTemplateSource, templatesFor } from "./templates.js";

export interface NewOptions {
  readonly root: string;
  readonly slug: string;
  /** Argumentos extra tras el slug (defensa en profundidad; el CLI los separa). */
  readonly args: readonly string[];
  /** Override del template para tests del fallo de copia (QA A8). */
  readonly templatePath?: URL;
}

export type NewResult =
  | { readonly ok: true; readonly lines: readonly string[]; readonly exitCode: 0 }
  | { readonly ok: false; readonly message: string; readonly exitCode: 1 };

/**
 * Ejecuta `sdd new <slug>` (RF-1…RF-10, spec 002). Precondiciones en el orden
 * de QA A1: 1) slug vacío → uso; 2) args extra → uso; 3) slug inválido →
 * formato; 4) `specs/` inexistente → sugerir `sdd init`; 5) destino existente →
 * «ya existe»; 6) crear/copiar con rollback (QA A5). El contenido del
 * `spec.md` se copia desde el template centralizado (constitución #3), nunca
 * desde strings del código.
 */
export async function createSpec(options: NewOptions): Promise<NewResult> {
  if (options.slug === "") {
    return { ok: false, message: newMissingSlug(), exitCode: 1 };
  }
  if (options.args.length > 0) {
    return { ok: false, message: newExtraArgs(), exitCode: 1 };
  }
  if (!isValidSlug(options.slug)) {
    return { ok: false, message: newInvalidSlug(options.slug), exitCode: 1 };
  }

  const specsDir = join(options.root, "specs");
  let dirents: readonly Dirent[];
  try {
    // Cubre RF-2 y el borde «specs/ existe como archivo» (validación H1):
    // ENOENT/ENOTDIR → sugerir `sdd init`; el resto → error con ruta.
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
  const entries = dirents.map((dirent) => dirent.name);

  // Criterio #2 de finalización: repetir el mismo slug es error «ya existe»
  // aunque el número cambie (RF-6). El slug ya está validado como
  // [a-z0-9-], así que no necesita escape para el patrón.
  const existingSpec = dirents.find((dirent) =>
    new RegExp(`^\\d{3}-${options.slug}$`).test(dirent.name),
  );
  if (existingSpec !== undefined) {
    return {
      ok: false,
      message: existsError(`specs/${existingSpec.name}`, existingSpec.isDirectory()),
      exitCode: 1,
    };
  }

  const next = nextSpecNumber(entries);
  if (!next.ok) {
    return { ok: false, message: newLimit(), exitCode: 1 };
  }

  const dirName = specDirName(next.nnn, options.slug);
  const destDir = join(specsDir, dirName);

  try {
    const destInfo = await stat(destDir);
    return {
      ok: false,
      message: existsError(`specs/${dirName}`, destInfo.isDirectory()),
      exitCode: 1,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      return {
        ok: false,
        message: createFileError(`specs/${dirName}`, (error as Error).message),
        exitCode: 1,
      };
    }
  }

  try {
    await mkdir(destDir);
  } catch (error) {
    return {
      ok: false,
      message: createFileError(`specs/${dirName}`, (error as Error).message),
      exitCode: 1,
    };
  }

  try {
    for (const entry of templatesFor("new")) {
      const source = options.templatePath ?? resolveTemplateSource(entry.source);
      await copyFile(source, join(destDir, entry.dest));
    }
  } catch (error) {
    // QA A5: rollback del directorio recién creado (vacío) y error con la ruta.
    // `recursive: true` es obligatorio: `rm` sobre un directorio sin él lanza
    // EISDIR y el directorio quedaría huérfano.
    try {
      await rm(destDir, { recursive: true, force: true });
    } catch {
      // Rollback best-effort: se reporta el error original.
    }
    return {
      ok: false,
      message: createFileError(`specs/${dirName}/spec.md`, (error as Error).message),
      exitCode: 1,
    };
  }

  const dirPath = `specs/${dirName}`;
  const filePath = `${dirPath}/spec.md`;
  return {
    ok: true,
    lines: [
      newTitle(),
      "",
      newCreatedDir(dirPath),
      fileCreatedLine(filePath),
      "",
      newSuccess(dirPath),
    ],
    exitCode: 0,
  };
}
