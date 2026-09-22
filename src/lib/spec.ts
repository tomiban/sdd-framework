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

/**
 * Normaliza un id de spec a `NNN` (RF-3/RF-4, spec 003): acepta de 1 a 3
 * dígitos y rellena con ceros a la izquierda (`3` → `003`); cualquier otra
 * cosa (incluido el nombre completo `NNN-slug`) es inválido (CL-2).
 */
export function parseSpecId(input: string): string | null {
  if (!/^\d{1,3}$/.test(input)) {
    return null;
  }
  return input.padStart(3, "0");
}

export type FindSpecDirResult =
  | { readonly ok: true; readonly dir: string }
  | {
      readonly ok: false;
      readonly reason: "missing" | "ambiguous";
      readonly matches: readonly string[];
    };

/**
 * Resuelve el directorio `specs/NNN-*` (RF-3, spec 003): único → ok; ninguno →
 * missing; varios → ambiguous listándolos sin elegir ninguno (CL-3).
 */
export function findSpecDir(entries: readonly string[], nnn: string): FindSpecDirResult {
  const matches = entries.filter((entry) => entry.startsWith(`${nnn}-`)).sort();
  const first = matches[0];
  if (first === undefined) {
    return { ok: false, reason: "missing", matches };
  }
  if (matches.length > 1) {
    return { ok: false, reason: "ambiguous", matches };
  }
  return { ok: true, dir: first };
}