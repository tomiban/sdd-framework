export interface TemplateEntry {
  /** Ruta relativa destino dentro del directorio del nuevo spec. */
  readonly dest: string;
  /** Nombre del archivo fuente dentro de `templates/`. */
  readonly source: string;
}

/**
 * Manifiesto de templates (constitución #3): única fuente de qué archivos se
 * copian desde `templates/` al destino. El contenido nunca vive como string en
 * el código: se copian los bytes del archivo.
 */
export const TEMPLATES: readonly TemplateEntry[] = [
  { dest: "spec.md", source: "spec.md" },
] as const;

export function findTemplate(dest: string): TemplateEntry | undefined {
  return TEMPLATES.find((entry) => entry.dest === dest);
}

/**
 * URL absoluta de un template, relativa al paquete instalado (QA A4). `src/lib/`
 * y `dist/lib/` están a la misma profundidad, así que `../../templates/` es
 * válido en dev, tests y build. Nunca se resuelve relativa al cwd del usuario.
 */
export function resolveTemplateSource(source: string): URL {
  return new URL(`../../templates/${source}`, import.meta.url);
}