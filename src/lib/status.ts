import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { parseTasks, type TaskSummary } from "./analysis.js";
import {
  agentsStatusLine,
  constitutionStatusLine,
  noSpecsLine,
  notInitializedLine,
  specStatusLine,
  statusSummary,
  statusTitle,
  statusUsageError,
  structureIncomplete,
  structureOk,
} from "./messages.js";
import { detectInitState, fileStatus } from "./state.js";
import { flattenStructure, SDD_STRUCTURE } from "./structure.js";

export interface StatusOptions {
  readonly root: string;
  /** `sdd status` no admite argumentos (RF-5). */
  readonly args: readonly string[];
}

export type StatusResult =
  | { readonly ok: true; readonly lines: readonly string[]; readonly exitCode: 0 }
  | { readonly ok: false; readonly message: string; readonly exitCode: 1 };

interface SpecRow {
  readonly dir: string;
  readonly spec: boolean;
  readonly plan: boolean;
  readonly tasks: TaskSummary | null;
}

/**
 * Una spec está «lista» (RF-4): las tres fases presentes y `tasks.md` con al
 * menos un checkbox y ninguno pendiente (QA A1). Interfaz mínima: solo exige
 * lo que usa.
 */
export function isSpecReady(row: {
  readonly spec: boolean;
  readonly plan: boolean;
  readonly tasks: {
    readonly hasCheckboxes: boolean;
    readonly pendingIds: readonly string[];
  } | null;
}): boolean {
  return (
    row.spec &&
    row.plan &&
    row.tasks !== null &&
    row.tasks.hasCheckboxes &&
    row.tasks.pendingIds.length === 0
  );
}

/**
 * Ejecuta `sdd status` (RF-1…RF-6, spec 007): informe de solo lectura del
 * estado del flujo SDD sobre el cwd (NFR-1).
 */
export async function statusReport(options: StatusOptions): Promise<StatusResult> {
  if (options.args.length > 0) {
    return { ok: false, message: statusUsageError(), exitCode: 1 };
  }

  const lines: string[] = [statusTitle(), ""];

  // Estructura desde el manifiesto (RF-2, NFR-3).
  const state = await detectInitState(options.root);
  const elements = state.elements;
  const missing = elements.filter((element) => element.status !== "exists");
  if (missing.length === 0) {
    lines.push(structureOk(SDD_STRUCTURE.map((node) => `${node.name}/`)));
  } else if (missing.length === elements.length) {
    lines.push(notInitializedLine());
  } else {
    lines.push(structureIncomplete(missing.map((element) => `${element.path}/`)));
  }

  lines.push(
    constitutionStatusLine(
      (await fileStatus(join(options.root, "docs/constitution.md"))) === "exists",
    ),
  );
  lines.push(agentsStatusLine((await fileStatus(join(options.root, "AGENTS.md"))) === "exists"));

  // Specs con sus fases (RF-3).
  lines.push("");
  const rows = await readSpecs(options.root);
  if (rows.length === 0) {
    lines.push(noSpecsLine());
  } else {
    for (const row of rows) {
      lines.push(specStatusLine(row.dir, row.spec, row.plan, row.tasks));
    }
  }

  lines.push("", statusSummary(rows.length, rows.filter(isSpecReady).length));
  return { ok: true, lines, exitCode: 0 };
}

async function readSpecs(root: string): Promise<SpecRow[]> {
  let names: string[];
  try {
    names = (await readdir(join(root, "specs"), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
  names.sort();

  const rows: SpecRow[] = [];
  for (const dir of names) {
    const base = join(root, "specs", dir);
    const spec = (await fileStatus(join(base, "spec.md"))) === "exists";
    const plan = (await fileStatus(join(base, "plan.md"))) === "exists";
    const tasksPath = join(base, "tasks.md");
    const tasks =
      (await fileStatus(tasksPath)) === "exists" ? parseTasks(await readFile(tasksPath, "utf8")) : null;
    rows.push({ dir, spec, plan, tasks });
  }
  return rows;
}
