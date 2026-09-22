export type TemplatePhase = "new" | "plan" | "tasks";

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
] as const;

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
