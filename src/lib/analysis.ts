/**
 * Análisis puro de los artefactos SDD (spec 004): sin fs ni procesos
 * (constitución #4, NFR-3).
 */

const RF_TOKEN = /\bRF-(\d+)\b/g;
const RF_RANGE = /\bRF-(\d+)\s*(?:\.\.|…|[–—-])\s*RF-(\d+)\b/g;
const SECTION_HEADING = /^##\s+(.+?)\s*$/gm;
const TASK_HEADING = /^##\s+(T\d+)\b/;
const CHECKBOX = /^\s*-\s*\[([ xX])\]/;

/**
 * Referencias `RF-N` de un texto: únicas y ordenadas. Los rangos `RF-a…RF-b`
 * (también `..` o `-`) se expanden de forma inclusiva (QA A2: nuestros propios
 * artefactos citan rangos). `RF-N` no numérico se ignora.
 */
export function rfTokens(text: string): number[] {
  const found = new Set<number>();
  for (const match of text.matchAll(RF_RANGE)) {
    const start = match[1];
    const end = match[2];
    if (start === undefined || end === undefined) {
      continue;
    }
    for (let value = Number(start); value <= Number(end); value += 1) {
      found.add(value);
    }
  }
  for (const match of text.matchAll(RF_TOKEN)) {
    const value = match[1];
    if (value === undefined) {
      continue;
    }
    found.add(Number(value));
  }
  return [...found].sort((a, b) => a - b);
}

/** Sección base = encabezado `## …` sin el paréntesis final (QA A3). */
function baseHeading(heading: string): string {
  return heading.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export function sectionBases(text: string): string[] {
  const sections: string[] = [];
  for (const match of text.matchAll(SECTION_HEADING)) {
    const heading = match[1];
    if (heading === undefined) {
      continue;
    }
    sections.push(baseHeading(heading));
  }
  return sections;
}

/**
 * Secciones base de la plantilla ausentes en la spec (RF-7). La plantilla es la
 * fuente de verdad (NFR-4/constitución #3); se toleran variantes de paréntesis
 * (p. ej. «(EARS)» vs «(criterios de aceptación en EARS)», QA A3).
 */
export function missingSections(specText: string, templateText: string): string[] {
  const present = new Set(sectionBases(specText));
  return sectionBases(templateText).filter((section) => !present.has(section));
}

export interface TaskSummary {
  readonly taskIds: readonly string[];
  readonly totalCount: number;
  readonly doneCount: number;
  /** Ids (`Tn`) con algún checkbox sin marcar (QA A5). */
  readonly pendingIds: readonly string[];
  readonly hasTasks: boolean;
  readonly hasCheckboxes: boolean;
}

/** Estado de las tareas de `tasks.md` (RF-9): bloques `## Tn` ↔ checkboxes. */
export function parseTasks(tasksText: string): TaskSummary {
  const taskIds: string[] = [];
  const pending = new Set<string>();
  let current: string | null = null;
  let total = 0;
  let done = 0;
  for (const line of tasksText.split("\n")) {
    const heading = TASK_HEADING.exec(line);
    const headingId = heading?.[1];
    if (headingId !== undefined) {
      current = headingId;
      taskIds.push(headingId);
      continue;
    }
    const checkbox = CHECKBOX.exec(line);
    if (checkbox === null) {
      continue;
    }
    total += 1;
    const checked = checkbox[1] === "x" || checkbox[1] === "X";
    if (checked) {
      done += 1;
    } else if (current !== null) {
      pending.add(current);
    }
  }
  return {
    taskIds,
    totalCount: total,
    doneCount: done,
    pendingIds: [...pending],
    hasTasks: taskIds.length > 0,
    hasCheckboxes: total > 0,
  };
}

/** ¿Alguna cita de la constitución (`constitu…`, sin mayúsculas) en los artefactos? (RF-10). */
export function citesConstitution(texts: readonly string[]): boolean {
  return texts.some((text) => /constitu/i.test(text));
}
