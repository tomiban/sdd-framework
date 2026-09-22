import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isSpecReady, statusReport } from "../src/lib/status.js";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "sdd-status-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function mkdirs(...paths: string[]): Promise<void> {
  for (const path of paths) {
    await mkdir(join(root, path), { recursive: true });
  }
}

async function write(path: string, content: string): Promise<void> {
  await mkdir(join(root, path, ".."), { recursive: true });
  await writeFile(join(root, path), content);
}

/** Proyecto inicializado con constitución y AGENTS.md. */
async function setupProject(): Promise<void> {
  await mkdirs("docs", "specs", ".opencode/agents", ".opencode/commands", ".opencode/skills");
  await write("docs/constitution.md", "principios");
  await write("AGENTS.md", "ver constitution.md");
}

describe("statusReport (spec 007)", () => {
  it("proyecto con specs: bloque exacto del RF-1 (CL-5)", async () => {
    await setupProject();
    await write("specs/001-x/spec.md", "spec");
    await write("specs/001-x/plan.md", "plan");
    await write("specs/001-x/tasks.md", "## T1 — a\n- [x] uno\n- [x] dos");
    await write("specs/002-y/spec.md", "spec");

    const result = await statusReport({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        "Estado SDD…",
        "",
        "✓ Estructura: docs/ · specs/ · .opencode/",
        "✓ docs/constitution.md",
        "✓ AGENTS.md",
        "",
        "specs/001-x — spec ✓ · plan ✓ · tasks ✓ 2/2",
        "specs/002-y — spec ✓ · plan ✗ · tasks ✗",
        "",
        "2 specs · 1 lista",
      ],
    });
  });

  it("proyecto vacío: bloque CL-1 completo", async () => {
    const result = await statusReport({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        "Estado SDD…",
        "",
        "✗ Proyecto sin inicializar. Ejecuta primero: sdd init",
        "✗ falta docs/constitution.md",
        "✗ falta AGENTS.md",
        "",
        "sin specs todavía",
        "",
        "0 specs · 0 listas",
      ],
    });
  });

  it("estructura parcial: «falta»/«faltan» según cantidad (CL-2, QA A3)", async () => {
    await mkdirs("docs", "specs", ".opencode/agents", ".opencode/commands");

    const one = await statusReport({ root, args: [] });
    expect(one.ok && one.lines[2]).toBe("✗ Estructura incompleta: falta .opencode/skills/");

    await rm(root, { recursive: true });
    await mkdirs("docs");
    const many = await statusReport({ root, args: [] });
    expect(many.ok && many.lines[2]).toBe(
      "✗ Estructura incompleta: faltan specs/, .opencode/, .opencode/agents/, .opencode/commands/, .opencode/skills/",
    );
  });

  it("tareas pendientes y tasks sin checkboxes (CL-3, CL-4)", async () => {
    await setupProject();
    await write("specs/001-x/spec.md", "spec");
    await write("specs/001-x/plan.md", "plan");
    await write("specs/001-x/tasks.md", "## T1 — a\n- [x] uno\n- [ ] dos");
    await write("specs/002-y/spec.md", "spec");
    await write("specs/002-y/plan.md", "plan");
    await write("specs/002-y/tasks.md", "## T1 — a\nsin marcables");

    const result = await statusReport({ root, args: [] });

    expect(result.ok && result.lines[6]).toBe("specs/001-x — spec ✓ · plan ✓ · tasks ✓ 1/2");
    expect(result.ok && result.lines[7]).toBe("specs/002-y — spec ✓ · plan ✓ · tasks ✓ 0/0");
    expect(result.ok && result.lines[9]).toBe("2 specs · 0 listas");
  });

  it("argumentos no soportados (CL-6, RF-5)", async () => {
    expect(await statusReport({ root, args: ["foo"] })).toEqual({
      ok: false,
      message: "Error: argumentos no soportados.\nUso: sdd status",
      exitCode: 1,
    });
  });
});

describe("isSpecReady (spec 007)", () => {
  const done = { hasCheckboxes: true, pendingIds: [], doneCount: 2, totalCount: 2 };
  const pending = { hasCheckboxes: true, pendingIds: ["T1"], doneCount: 1, totalCount: 2 };
  const noChecks = { hasCheckboxes: false, pendingIds: [], doneCount: 0, totalCount: 0 };

  it("lista solo con las tres fases y sin pendientes (QA A1)", () => {
    expect(isSpecReady({ spec: true, plan: true, tasks: done })).toBe(true);
    expect(isSpecReady({ spec: true, plan: true, tasks: pending })).toBe(false);
    expect(isSpecReady({ spec: true, plan: true, tasks: noChecks })).toBe(false);
    expect(isSpecReady({ spec: true, plan: true, tasks: null })).toBe(false);
    expect(isSpecReady({ spec: true, plan: false, tasks: done })).toBe(false);
    expect(isSpecReady({ spec: false, plan: true, tasks: done })).toBe(false);
  });
});
