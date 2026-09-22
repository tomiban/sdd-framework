/**
 * Mensajes visibles del CLI (constitución #6: castellano en humano).
 * Único módulo con strings de salida (QA A10): los tests comparan bloques
 * exactos contra la spec.
 */

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

export function unknownCommandError(command: string): string {
  return `Error: comando no soportado: ${command}\nUso: sdd init`;
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