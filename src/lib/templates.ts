export type TemplatePhase = "new" | "plan" | "tasks" | "init";

export interface TemplateEntry {
  /** Fase del flujo SDD que copia esta entrada (QA A10, spec 003). */
  readonly phase: TemplatePhase;
  /** Ruta relativa destino dentro del directorio del scaffold. */
  readonly dest: string;
  /** Nombre del archivo fuente dentro de `templates/`. */
  readonly source: string;
}

/**
 * Manifiesto de templates (constitución #3): única fuente de qué archivos copia
 * cada fase del flujo. El contenido nunca vive como string en el código: se
 * copian los bytes del archivo.
 */
export const TEMPLATES: readonly TemplateEntry[] = [
  { phase: "new", dest: "spec.md", source: "spec.md" },
  { phase: "plan", dest: "plan.md", source: "plan.md" },
  { phase: "tasks", dest: "tasks.md", source: "tasks.md" },
  { phase: "init", dest: "docs/constitution.md", source: "constitution.md" },
  { phase: "init", dest: "AGENTS.md", source: "agents.md" },
] as const;

/**
 * Fuente de la regla que `sdd init` añade a un `AGENTS.md` existente (spec
 * 005): es contenido de **append**, no una copia de plantilla (QA A8).
 */
export const AGENTS_RULE_SOURCE = "agents-rule.md";

/** Entradas que copia cada fase: solo las suyas (QA A10). */
export function templatesFor(phase: TemplatePhase): readonly TemplateEntry[] {
  return TEMPLATES.filter((entry) => entry.phase === phase);
}

/**
 * URL absoluta de un template, relativa al paquete instalado (QA A4, spec
 * 002). `src/lib/` y `dist/lib/` están a la misma profundidad, así que
 * `../../templates/` es válido en dev, tests y build. Nunca relativa al cwd.
 */
export function resolveTemplateSource(source: string): URL {
  return new URL(`../../templates/${source}`, import.meta.url);
}
