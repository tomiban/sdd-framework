/**
 * Mensajes visibles del CLI (constitución #6: castellano en humano).
 * Único módulo con strings de salida (QA A10 spec 001): los tests comparan
 * bloques exactos contra la spec.
 */

// --- Mensajes compartidos entre comandos (renombrado A7, spec 003) ---

export function fileCreatedLine(path: string): string {
  return `✓ Creado ${path}`;
}

export function fileExistsLine(path: string): string {
  // A diferencia de `existsLine`, sin barra final: es un archivo (spec 005).
  return `✓ ${path} ya existe`;
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

// --- Mensajes de `sdd plan` / `sdd tasks` / `sdd validate` (specs 003-004) ---

/**
 * Fases documentales del flujo SDD. Fuente única del union; `phases.ts` lo
 * re-exporta como `Phase` (contrato plan §3).
 */
export type PhaseName = "plan" | "tasks";

/** Comandos que resuelven una spec por `<NNN>` (renombrado D1, spec 004). */
export type IdCommand = PhaseName | "validate";

export function idMissingError(command: IdCommand): string {
  return `Error: falta el número de la spec.\nUso: sdd ${command} <NNN>`;
}

export function idExtraArgsError(command: IdCommand): string {
  return `Error: argumentos no soportados.\nUso: sdd ${command} <NNN>`;
}

export function idInvalidError(command: IdCommand, id: string): string {
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

// --- Mensajes de `sdd validate <NNN>` (spec 004) ---

export function configMissing(): string {
  return "Error: falta sdd.json con los comandos de verificación.";
}

export function configInvalid(detail: string): string {
  return `Error: sdd.json inválido: ${detail}`;
}

export function validateTitle(name: string): string {
  return `Validando spec ${name}…`;
}

export function artifactsLine(missing: readonly string[]): string {
  return missing.length === 0
    ? "✓ Artefactos: spec.md, plan.md, tasks.md"
    : `✗ Artefactos: ${missing.length === 1 ? "falta" : "faltan"} ${missing.join(", ")}`;
}

export function structureRequiresSpec(): string {
  return "✗ Estructura: requiere spec.md";
}

export function structureLine(missing: readonly string[]): string {
  return missing.length === 0
    ? "✓ Estructura: todas las secciones de la plantilla"
    : `✗ Estructura: sin secciones: ${missing.join(", ")}`;
}

export function traceRequiresSpec(): string {
  return "✗ Trazabilidad: requiere spec.md";
}

export function traceLine(missingPlan: readonly number[], missingTasks: readonly number[]): string {
  const parts: string[] = [];
  if (missingPlan.length > 0) {
    parts.push(`sin cubrir en plan.md: ${missingPlan.map((rf) => `RF-${rf}`).join(", ")}`);
  }
  if (missingTasks.length > 0) {
    parts.push(`sin cubrir en tasks.md: ${missingTasks.map((rf) => `RF-${rf}`).join(", ")}`);
  }
  return parts.length === 0
    ? "✓ Trazabilidad: todos los RF cubiertos en plan.md y tasks.md"
    : `✗ Trazabilidad: ${parts.join(" · ")}`;
}

export function tasksRequiresFile(): string {
  return "✗ Tareas: requiere tasks.md";
}

export function tasksStructureLine(hasTasks: boolean): string {
  return hasTasks
    ? "✗ Tareas: sin «Hecho cuando» en tasks.md"
    : "✗ Tareas: sin tareas en tasks.md";
}

export function tasksLine(done: number, total: number, pendingIds: readonly string[]): string {
  return pendingIds.length === 0
    ? `✓ Tareas: ${done}/${total} completadas`
    : `✗ Tareas: ${done}/${total} completadas (pendientes: ${pendingIds.join(", ")})`;
}

export function constitutionMissing(): string {
  return "✗ Constitución: falta docs/constitution.md";
}

export function constitutionEmpty(): string {
  return "✗ Constitución: docs/constitution.md está vacío";
}

export function constitutionUncited(): string {
  return "✗ Constitución: docs/constitution.md (sin citas en los artefactos)";
}

export function constitutionLine(): string {
  return "✓ Constitución: docs/constitution.md (citada en spec/plan/tasks)";
}

export interface VerifyOutcome {
  readonly command: string;
  readonly outcome: number | "timeout";
}

export function verdesLine(results: readonly VerifyOutcome[]): string {
  const failed = results.filter((result) => result.outcome !== 0);
  const done = results.length - failed.length;
  if (failed.length === 0) {
    return `✓ Verdes: ${done}/${results.length} comandos`;
  }
  const details = failed.map((result) =>
    result.outcome === "timeout"
      ? `${result.command} (timeout)`
      : `${result.command} (exit ${result.outcome})`,
  );
  return `✗ Verdes: ${done}/${results.length} comandos — ${details.join(" · ")}`;
}

export function verdictLine(name: string, ready: boolean): string {
  return `Spec ${name}: ${ready ? "LISTO" : "NO LISTO"}`;
}

// --- Mensajes de `sdd init`: constitución y AGENTS.md (spec 005) ---

export function fileConflictError(path: string): string {
  return `Error: ${path} ya existe y no es un archivo.`;
}

export function constitutionEmptyWarn(): string {
  return "⚠ docs/constitution.md ya existe pero está vacío";
}

export function agentsRuleAddedLine(): string {
  return "✓ Añadida la regla de constitución a AGENTS.md";
}

export function agentsCitedLine(): string {
  return "✓ AGENTS.md ya cita docs/constitution.md";
}

export function appendError(path: string, detail: string): string {
  return `Error: no se pudo actualizar ${path}: ${detail}`;
}
