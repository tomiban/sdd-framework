/**
 * Mensajes visibles del CLI (constitución #6: castellano en humano).
 * Único módulo con strings de salida (QA A10 spec 001): los tests comparan
 * bloques exactos contra la spec.
 */

// --- Mensajes compartidos entre comandos (renombrado A7, spec 003) ---

export function fileCreatedLine(path: string): string {
  return `✓ Creado ${path}`;
}

export function notInitializedError(): string {
  return "Error: proyecto no inicializado. Ejecuta primero: sdd init";
}

export function existsError(path: string, isDirectory = true): string {
  // La colisión puede ser con un directorio o un archivo (RF-6/RF-8): la
  // barra final solo aplica a directorios (validación H4, spec 002).
  return `Error: ya existe ${isDirectory ? `${path}/` : path}.`;
}

export function createFileError(path: string, detail: string): string {
  return `Error: no se pudo crear ${path}: ${detail}`;
}

// --- Mensajes de `sdd init` (spec 001) ---

export function initTitle(): string {
  return "Inicializando SDD…"; // U+2026 literal (CL-8, D8)
}

export function createdLine(path: string): string {
  return `✓ Creado ${path}/`;
}

export function existsLine(path: string): string {
  return `✓ ${path}/ ya existe`;
}

export function successMessage(createdAny: boolean): string {
  return createdAny ? "SDD inicializado correctamente." : "SDD ya está inicializado.";
}

export function usageError(): string {
  return "Error: argumentos no soportados.\nUso: sdd init";
}

export function conflictError(path: string): string {
  return `Error: ${path}/ ya existe y no es un directorio.`;
}

export function writeError(): string {
  return "Error: no es posible escribir en el directorio actual.";
}

export function createError(path: string, detail: string): string {
  return `Error: no se pudo crear ${path}/: ${detail}`;
}

// RF-12 (spec 003): sustituye al mensaje fijado por la spec 001.
export function unknownCommandError(command: string): string {
  return `Error: comando no soportado: ${command}\nUso: sdd <comando> (init, new <slug>, plan <NNN>, tasks <NNN>)`;
}

// --- Mensajes de `sdd new <slug>` (spec 002) ---

export function newTitle(): string {
  return "Creando spec…";
}

export function newCreatedDir(path: string): string {
  return `✓ Creado ${path}/`;
}

export function newSuccess(path: string): string {
  return `Spec creada: ${path}/`;
}

export function newMissingSlug(): string {
  return "Error: falta el nombre de la spec.\nUso: sdd new <slug>";
}

export function newExtraArgs(): string {
  return "Error: argumentos no soportados.\nUso: sdd new <slug>";
}

export function newInvalidSlug(slug: string): string {
  return `Error: ${slug} no es un nombre válido (usa kebab-case, p. ej. lista-gastos).\nUso: sdd new <slug>`;
}

export function newLimit(): string {
  return "Error: límite de 999 specs alcanzado.";
}

// --- Mensajes de `sdd plan` / `sdd tasks` (spec 003) ---

/**
 * Fases documentales del flujo SDD. Fuente única del union; `phases.ts` lo
 * re-exporta como `Phase` (contrato plan §3).
 */
export type PhaseName = "plan" | "tasks";

export function phaseMissingId(command: PhaseName): string {
  return `Error: falta el número de la spec.\nUso: sdd ${command} <NNN>`;
}

export function phaseExtraArgs(command: PhaseName): string {
  return `Error: argumentos no soportados.\nUso: sdd ${command} <NNN>`;
}

export function phaseInvalidId(command: PhaseName, id: string): string {
  return `Error: ${id} no es un número de spec válido (1-3 dígitos, p. ej. 002).\nUso: sdd ${command} <NNN>`;
}

export function specNotFound(nnn: string): string {
  return `Error: no existe la spec ${nnn}.`;
}

export function specAmbiguous(nnn: string, names: readonly string[]): string {
  return `Error: la spec ${nnn} es ambigua: ${names.join(", ")}.`;
}

export function missingSpecFile(path: string): string {
  return `Error: falta ${path}. Flujo SDD: spec → plan → tareas.`;
}

export function missingPlanFile(path: string, nnn: string): string {
  return `Error: falta ${path}. Ejecuta primero: sdd plan ${nnn}`;
}

export function phaseTitle(phase: PhaseName): string {
  return phase === "plan" ? "Creando plan…" : "Creando tareas…";
}

export function phaseSuccess(phase: PhaseName, path: string): string {
  return phase === "plan" ? `Plan creado: ${path}` : `Tareas creadas: ${path}`;
}
