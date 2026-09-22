export const SPEC_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAX_SPEC_NUMBER = 999;

export function isValidSlug(slug: string): boolean {
  return SPEC_SLUG_PATTERN.test(slug);
}

export type NextSpecNumberResult =
  | { readonly ok: true; readonly nnn: string }
  | { readonly ok: false; readonly reason: "limit" };

/**
 * Calcula el siguiente número NNN (RF-5): el máximo prefijo `^\d{3}-` de los
 * directorios de `specs/` + 1, con ceros a la izquierda (001 si no hay ninguno).
 * Los nombres sin prefijo NNN se ignoran (QA A2). Error si el máximo es 999
 * (CL-6: la convención es de 3 dígitos).
 */
export function nextSpecNumber(entries: readonly string[]): NextSpecNumberResult {
  let max = 0;
  for (const entry of entries) {
    const prefix = /^(\d{3})-/.exec(entry)?.[1];
    if (prefix === undefined) {
      continue;
    }
    const value = Number(prefix);
    if (value > max) {
      max = value;
    }
  }
  if (max >= MAX_SPEC_NUMBER) {
    return { ok: false, reason: "limit" };
  }
  return { ok: true, nnn: String(max + 1).padStart(3, "0") };
}

export function specDirName(nnn: string, slug: string): string {
  return `${nnn}-${slug}`;
}