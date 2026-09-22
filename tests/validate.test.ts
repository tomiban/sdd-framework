import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { validateSpec, type VerifyRunner } from "../src/lib/validate.js";

const SPEC_TEXT = [
  "# Spec 002 — x",
  "## Contexto y objetivo",
  "## Usuarios / actores",
  "## Historias de usuario",
  "## Requisitos funcionales (EARS)",
  "## Requisitos no funcionales",
  "## Casos límite",
  "## Fuera de alcance",
  "## Criterios de finalización",
  "- **RF-1** — a",
  "- **RF-2** — b",
].join("\n");

const PLAN_TEXT = "plan con citas RF-1 RF-2 y mención a la constitución";
const TASKS_TEXT = ["## T1 — a", "**RF:** RF-1 · RF-2", "- [x] uno"].join("\n");

const okRunner: VerifyRunner = async () => 0;

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "sdd-validate-"));
  await mkdir(join(root, "specs/002-x"), { recursive: true });
  await mkdir(join(root, "docs"), { recursive: true });
  await writeFile(join(root, "specs/002-x/spec.md"), SPEC_TEXT);
  await writeFile(join(root, "specs/002-x/plan.md"), PLAN_TEXT);
  await writeFile(join(root, "specs/002-x/tasks.md"), TASKS_TEXT);
  await writeFile(join(root, "docs/constitution.md"), "1. Constitución del proyecto");
  await writeFile(join(root, "sdd.json"), '{"verify":["uno","dos"]}');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("validateSpec (spec 004)", () => {
  it("LISTO: bloque exacto del RF-11 y exit 0 (CL-10)", async () => {
    const result = await validateSpec({ root, args: ["002"], runner: okRunner });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        "Validando spec 002-x…",
        "",
        "✓ Artefactos: spec.md, plan.md, tasks.md",
        "✓ Estructura: todas las secciones de la plantilla",
        "✓ Trazabilidad: todos los RF cubiertos en plan.md y tasks.md",
        "✓ Tareas: 1/1 completadas",
        "✓ Constitución: docs/constitution.md (citada en spec/plan/tasks)",
        "✓ Verdes: 2/2 comandos",
        "",
        "Spec 002-x: LISTO",
      ],
    });
  });

  it("NO LISTO combinado: plan ausente, RF sin cubrir, tarea pendiente, sección y constitución, verdes fallidos (criterio #2)", async () => {
    await rm(join(root, "specs/002-x/plan.md"));
    await writeFile(
      join(root, "specs/002-x/spec.md"),
      SPEC_TEXT.replace("## Casos límite\n", ""),
    );
    await writeFile(
      join(root, "specs/002-x/tasks.md"),
      ["## T1 — a", "**RF:** RF-1", "- [x] uno", "## T2 — b", "- [ ] dos"].join("\n"),
    );
    await rm(join(root, "docs/constitution.md"));
    const failingRunner: VerifyRunner = async (command) => (command === "uno" ? 0 : 1);

    const result = await validateSpec({ root, args: ["002"], runner: failingRunner });

    expect(result).toEqual({
      ok: true,
      exitCode: 1,
      lines: [
        "Validando spec 002-x…",
        "",
        "✗ Artefactos: falta plan.md",
        "✗ Estructura: sin secciones: Casos límite",
        "✗ Trazabilidad: sin cubrir en plan.md: RF-1, RF-2 · sin cubrir en tasks.md: RF-2",
        "✗ Tareas: 1/2 completadas (pendientes: T2)",
        "✗ Constitución: falta docs/constitution.md",
        "✗ Verdes: 1/2 comandos — dos (exit 1)",
        "",
        "Spec 002-x: NO LISTO",
      ],
    });
  });

  it("CL-11: sin spec.md → «requiere spec.md» en estructura y trazabilidad", async () => {
    await rm(join(root, "specs/002-x/spec.md"));

    const result = await validateSpec({ root, args: ["002"], runner: okRunner });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.exitCode).toBe(1);
      expect(result.lines).toContain("✗ Artefactos: falta spec.md");
      expect(result.lines).toContain("✗ Estructura: requiere spec.md");
      expect(result.lines).toContain("✗ Trazabilidad: requiere spec.md");
    }
  });

  it("CL-4: tasks.md ausente → «requiere tasks.md»", async () => {
    await rm(join(root, "specs/002-x/tasks.md"));

    const result = await validateSpec({ root, args: ["002"], runner: okRunner });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.exitCode).toBe(1);
      expect(result.lines).toContain("✗ Artefactos: falta tasks.md");
      expect(result.lines).toContain("✗ Tareas: requiere tasks.md");
    }
  });

  it("CL-7: tasks sin «Hecho cuando» y sin tareas", async () => {
    await writeFile(join(root, "specs/002-x/tasks.md"), "## T1 — a\nsin marcables");
    const sinCheckboxes = await validateSpec({ root, args: ["002"], runner: okRunner });
    expect(sinCheckboxes.ok && sinCheckboxes.lines).toContain(
      "✗ Tareas: sin «Hecho cuando» en tasks.md",
    );

    await writeFile(join(root, "specs/002-x/tasks.md"), "solo texto");
    const sinTareas = await validateSpec({ root, args: ["002"], runner: okRunner });
    expect(sinTareas.ok && sinTareas.lines).toContain("✗ Tareas: sin tareas en tasks.md");
  });

  it("CL-8: constitución vacía y sin citas", async () => {
    await writeFile(join(root, "docs/constitution.md"), "  ");
    await writeFile(join(root, "specs/002-x/plan.md"), "plan sin menciones");

    const result = await validateSpec({ root, args: ["002"], runner: okRunner });

    expect(result.ok && result.lines).toContain(
      "✗ Constitución: docs/constitution.md está vacío",
    );
  });

  it("CL-9: verdes con exit code y timeout, sin lanzar procesos (NFR-7)", async () => {
    const runner: VerifyRunner = async (command) => (command === "uno" ? 0 : "timeout");

    const result = await validateSpec({ root, args: ["002"], runner });

    expect(result.ok && result.lines).toContain("✗ Verdes: 1/2 comandos — dos (timeout)");
    expect(result.ok && result.exitCode).toBe(1);
  });

  it("CL-3/QA A4: sdd.json ausente o inválido → error sin informe", async () => {
    await rm(join(root, "sdd.json"));
    expect(await validateSpec({ root, args: ["002"], runner: okRunner })).toEqual({
      ok: false,
      message: "Error: falta sdd.json con los comandos de verificación.",
      exitCode: 1,
    });

    await writeFile(join(root, "sdd.json"), "{");
    expect(await validateSpec({ root, args: ["002"], runner: okRunner })).toEqual({
      ok: false,
      message: "Error: sdd.json inválido: JSON malformado",
      exitCode: 1,
    });
  });

  it("precondiciones de id y argumentos → error sin informe (RF-1, RF-2)", async () => {
    expect(await validateSpec({ root, args: [] })).toEqual({
      ok: false,
      message: "Error: falta el número de la spec.\nUso: sdd validate <NNN>",
      exitCode: 1,
    });
    expect(await validateSpec({ root, args: ["002", "003"] })).toEqual({
      ok: false,
      message: "Error: argumentos no soportados.\nUso: sdd validate <NNN>",
      exitCode: 1,
    });
    expect(await validateSpec({ root, args: ["0021"] })).toEqual({
      ok: false,
      message:
        "Error: 0021 no es un número de spec válido (1-3 dígitos, p. ej. 002).\nUso: sdd validate <NNN>",
      exitCode: 1,
    });
    expect(await validateSpec({ root, args: ["999"] })).toEqual({
      ok: false,
      message: "Error: no existe la spec 999.",
      exitCode: 1,
    });
  });

  it("spec ambigua, sin specs/ y specs/ como archivo (RF-1, RF-3, CL-1, CL-2)", async () => {
    await mkdir(join(root, "specs/002-y"));
    expect(await validateSpec({ root, args: ["002"] })).toEqual({
      ok: false,
      message: "Error: la spec 002 es ambigua: 002-x, 002-y.",
      exitCode: 1,
    });

    await rm(join(root, "specs"), { recursive: true });
    expect(await validateSpec({ root, args: ["002"] })).toEqual({
      ok: false,
      message: "Error: proyecto no inicializado. Ejecuta primero: sdd init",
      exitCode: 1,
    });

    await writeFile(join(root, "specs"), "no soy un directorio");
    expect(await validateSpec({ root, args: ["002"] })).toEqual({
      ok: false,
      message: "Error: proyecto no inicializado. Ejecuta primero: sdd init",
      exitCode: 1,
    });
  });
});
