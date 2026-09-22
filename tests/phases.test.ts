import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createPhaseFile } from "../src/lib/phases.js";
import { resolveTemplateSource } from "../src/lib/templates.js";

const BAD_TEMPLATE = new URL("file:///ruta/que/no/existe/plan.md");

let root: string;

// El fixture parte de un proyecto inicializado con una spec existente:
// specs/002-x/spec.md (prerequisito del flujo spec → plan → tareas).
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "sdd-phase-"));
  await mkdir(join(root, "specs"));
  await mkdir(join(root, "specs/002-x"));
  await writeFile(join(root, "specs/002-x/spec.md"), "# spec");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("createPhaseFile", () => {
  it("plan crea plan.md byte a byte igual a la plantilla y bloque exacto RF-9 (RF-1, RF-9)", async () => {
    const result = await createPhaseFile({ root, phase: "plan", args: ["002"] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        "Creando plan…",
        "",
        "✓ Creado specs/002-x/plan.md",
        "",
        "Plan creado: specs/002-x/plan.md",
      ],
    });

    const generated = await readFile(join(root, "specs/002-x/plan.md"), "utf8");
    const template = await readFile(resolveTemplateSource("plan.md"), "utf8");
    expect(generated).toBe(template);
  });

  it("tasks crea tasks.md tras el plan y acepta el id con padding (RF-2, RF-9, CL-4)", async () => {
    await createPhaseFile({ root, phase: "plan", args: ["002"] });

    const result = await createPhaseFile({ root, phase: "tasks", args: ["2"] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        "Creando tareas…",
        "",
        "✓ Creado specs/002-x/tasks.md",
        "",
        "Tareas creadas: specs/002-x/tasks.md",
      ],
    });

    const generated = await readFile(join(root, "specs/002-x/tasks.md"), "utf8");
    const template = await readFile(resolveTemplateSource("tasks.md"), "utf8");
    expect(generated).toBe(template);
  });

  it("repetir: error «ya existe» sin barra (archivo) y sin sobrescribir (RF-8, NFR-5)", async () => {
    await createPhaseFile({ root, phase: "plan", args: ["002"] });
    const original = await readFile(join(root, "specs/002-x/plan.md"), "utf8");

    const result = await createPhaseFile({ root, phase: "plan", args: ["002"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: ya existe specs/002-x/plan.md.",
      exitCode: 1,
    });
    expect(await readFile(join(root, "specs/002-x/plan.md"), "utf8")).toBe(original);
  });

  it("destino como directorio: error «ya existe» con barra final (RF-8, CL-6)", async () => {
    await mkdir(join(root, "specs/002-x/plan.md"));

    const result = await createPhaseFile({ root, phase: "plan", args: ["002"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: ya existe specs/002-x/plan.md/.",
      exitCode: 1,
    });
  });

  it("argumentos: sin id, extras e id inválido (RF-4, RF-5, CL-1, CL-2)", async () => {
    expect(await createPhaseFile({ root, phase: "plan", args: [] })).toEqual({
      ok: false,
      message: "Error: falta el número de la spec.\nUso: sdd plan <NNN>",
      exitCode: 1,
    });
    expect(await createPhaseFile({ root, phase: "tasks", args: ["002", "003"] })).toEqual({
      ok: false,
      message: "Error: argumentos no soportados.\nUso: sdd tasks <NNN>",
      exitCode: 1,
    });
    expect(await createPhaseFile({ root, phase: "plan", args: ["0021"] })).toEqual({
      ok: false,
      message:
        "Error: 0021 no es un número de spec válido (1-3 dígitos, p. ej. 002).\nUso: sdd plan <NNN>",
      exitCode: 1,
    });
  });

  it("spec inexistente: error «no existe la spec» (RF-3, CL-10)", async () => {
    const result = await createPhaseFile({ root, phase: "plan", args: ["999"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: no existe la spec 999.",
      exitCode: 1,
    });
    // CL-10: `0` normaliza a `000`, válido pero sin spec: no se inventa nada.
    expect(await createPhaseFile({ root, phase: "plan", args: ["0"] })).toEqual({
      ok: false,
      message: "Error: no existe la spec 000.",
      exitCode: 1,
    });
  });

  it("spec ambigua: error que lista los candidatos sin elegir (RF-3, CL-3)", async () => {
    await mkdir(join(root, "specs/002-y"));

    const result = await createPhaseFile({ root, phase: "plan", args: ["002"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: la spec 002 es ambigua: 002-x, 002-y.",
      exitCode: 1,
    });
  });

  it("plan sin spec.md: error de flujo (RF-7, CL-5)", async () => {
    await rm(join(root, "specs/002-x/spec.md"));

    const result = await createPhaseFile({ root, phase: "plan", args: ["002"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: falta specs/002-x/spec.md. Flujo SDD: spec → plan → tareas.",
      exitCode: 1,
    });
  });

  it("tasks sin plan.md sugiere sdd plan; sin ninguno falla por spec.md (RF-7, CL-5)", async () => {
    expect(await createPhaseFile({ root, phase: "tasks", args: ["002"] })).toEqual({
      ok: false,
      message: "Error: falta specs/002-x/plan.md. Ejecuta primero: sdd plan 002",
      exitCode: 1,
    });

    await rm(join(root, "specs/002-x/spec.md"));
    expect(await createPhaseFile({ root, phase: "tasks", args: ["002"] })).toEqual({
      ok: false,
      message: "Error: falta specs/002-x/spec.md. Flujo SDD: spec → plan → tareas.",
      exitCode: 1,
    });
  });

  it("specs/ como archivo: error que sugiere sdd init, sin stack trace (RF-6, CL-7)", async () => {
    await rm(join(root, "specs"), { recursive: true });
    await writeFile(join(root, "specs"), "no soy un directorio");

    const result = await createPhaseFile({ root, phase: "plan", args: ["002"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: proyecto no inicializado. Ejecuta primero: sdd init",
      exitCode: 1,
    });
  });

  it("proyecto sin specs/: error que sugiere sdd init (RF-6, validación H-2)", async () => {
    await rm(join(root, "specs"), { recursive: true });

    const result = await createPhaseFile({ root, phase: "plan", args: ["002"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: proyecto no inicializado. Ejecuta primero: sdd init",
      exitCode: 1,
    });
  });

  it("fallo de copia: rollback del destino y error con ruta (RF-10, CL-9)", async () => {
    const result = await createPhaseFile({
      root,
      phase: "plan",
      args: ["002"],
      templatePath: BAD_TEMPLATE,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain("Error: no se pudo crear specs/002-x/plan.md:");
      expect(result.message).toContain("ENOENT");
    }
    expect(await readdir(join(root, "specs/002-x"))).toEqual(["spec.md"]);
  });

  it.skipIf(process.getuid?.() === 0)(
    "directorio de la spec sin permiso de escritura: error con la ruta y nada creado (CL-8, RF-10)",
    async () => {
      // La escritura va a `specs/NNN-x/`, no a `specs/`: el bloqueo se pone en
      // el directorio de la spec.
      await chmod(join(root, "specs/002-x"), 0o555);

      const result = await createPhaseFile({ root, phase: "plan", args: ["002"] });
      await chmod(join(root, "specs/002-x"), 0o755);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.exitCode).toBe(1);
        expect(result.message).toContain("Error: no se pudo crear specs/002-x/plan.md:");
      }
      expect(await readdir(join(root, "specs/002-x"))).toEqual(["spec.md"]);
    },
  );

  it("flujo completo: plan y tasks creados; repetir cualquiera falla (CL-11)", async () => {
    expect((await createPhaseFile({ root, phase: "plan", args: ["002"] })).ok).toBe(true);
    expect((await createPhaseFile({ root, phase: "tasks", args: ["002"] })).ok).toBe(true);
    expect((await createPhaseFile({ root, phase: "plan", args: ["002"] })).ok).toBe(false);
    expect((await createPhaseFile({ root, phase: "tasks", args: ["002"] })).ok).toBe(false);

    expect((await readdir(join(root, "specs/002-x"))).sort()).toEqual([
      "plan.md",
      "spec.md",
      "tasks.md",
    ]);
  });
});
