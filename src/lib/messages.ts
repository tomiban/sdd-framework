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

// --- Mensajes de `sdd new <slug>` (spec 002) ---

export function newTitle(): string {
  return "Creando spec…";
}

export function newCreatedDir(path: string): string {
  return `✓ Creado ${path}/`;
}

export function newCreatedFile(path: string): string {
  return `✓ Creado ${path}`;
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

export function newNotInitialized(): string {
  return "Error: proyecto no inicializado. Ejecuta primero: sdd init";
}

export function newExists(path: string, isDirectory = true): string {
  // RF-6 contempla colisión con directorio o archivo: la barra final solo
  // aplica a directorios (validación H4).
  return `Error: ya existe ${isDirectory ? `${path}/` : path}.`;
}

export function newLimit(): string {
  return "Error: límite de 999 specs alcanzado.";
}

export function newWriteError(path: string, detail: string): string {
  return `Error: no se pudo crear ${path}: ${detail}`;
}