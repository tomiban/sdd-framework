import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createSpec } from "../src/lib/new.js";
import { resolveTemplateSource } from "../src/lib/templates.js";

const BAD_TEMPLATE = new URL("file:///ruta/que/no/existe/spec.md");

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "sdd-new-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

// El fixture parte desde el estado real del repo: la spec 001 (sdd init) ya
// existe, así que el primer `sdd new` numera 002 (RF-5, CL-4).
async function initSpecs(): Promise<void> {
  await mkdir(join(root, "specs"));
  await mkdir(join(root, "specs/001-sdd-init"));
}

describe("createSpec", () => {
  it("proyecto inicializado: crea dir + spec.md byte a byte igual al template, líneas RF-8 (RF-7, RF-8)", async () => {
    await initSpecs();

    const result = await createSpec({ root, slug: "lista-gastos", args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        "Creando spec…",
        "",
        "✓ Creado specs/002-lista-gastos/",
        "✓ Creado specs/002-lista-gastos/spec.md",
        "",
        "Spec creada: specs/002-lista-gastos/",
      ],
    });

    const generated = await readFile(join(root, "specs/002-lista-gastos/spec.md"), "utf8");
    const template = await readFile(resolveTemplateSource("spec.md"), "utf8");
    expect(generated).toBe(template);
  });

  it("repetir: error «ya existe» sin sobrescribir (RF-6, NFR-5)", async () => {
    await initSpecs();
    await createSpec({ root, slug: "lista-gastos", args: [] });
    const original = await readFile(join(root, "specs/002-lista-gastos/spec.md"), "utf8");

    const result = await createSpec({ root, slug: "lista-gastos", args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: ya existe specs/002-lista-gastos/.",
      exitCode: 1,
    });
    expect(await readFile(join(root, "specs/002-lista-gastos/spec.md"), "utf8")).toBe(original);
  });

  it("sin specs/: error que sugiere sdd init (RF-2)", async () => {
    const result = await createSpec({ root, slug: "gastos", args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: proyecto no inicializado. Ejecuta primero: sdd init",
      exitCode: 1,
    });
  });

  it("slug vacío y args extra: errores de uso (RF-3)", async () => {
    expect(await createSpec({ root, slug: "", args: [] })).toEqual({
      ok: false,
      message: "Error: falta el nombre de la spec.\nUso: sdd new <slug>",
      exitCode: 1,
    });
    expect(await createSpec({ root, slug: "a", args: ["b"] })).toEqual({
      ok: false,
      message: "Error: argumentos no soportados.\nUso: sdd new <slug>",
      exitCode: 1,
    });
  });

  it("slug inválido: error de formato, nada creado (RF-4)", async () => {
    await initSpecs();

    const result = await createSpec({ root, slug: "Mi-Gasto", args: [] });

    expect(result).toEqual({
      ok: false,
      message:
        "Error: Mi-Gasto no es un nombre válido (usa kebab-case, p. ej. lista-gastos).\nUso: sdd new <slug>",
      exitCode: 1,
    });
    expect(await readdir(join(root, "specs"))).toEqual(["001-sdd-init"]);
  });

  it("el slug inválido tiene prioridad sobre el proyecto no inicializado (QA A1)", async () => {
    const result = await createSpec({ root, slug: "Bad Slug", args: [] });

    expect(result).toEqual({
      ok: false,
      message:
        "Error: Bad Slug no es un nombre válido (usa kebab-case, p. ej. lista-gastos).\nUso: sdd new <slug>",
      exitCode: 1,
    });
  });

  it("dos specs seguidas numeran 002 y 003 (RF-5)", async () => {
    await initSpecs();
    await createSpec({ root, slug: "a", args: [] });

    const result = await createSpec({ root, slug: "b", args: [] });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines).toContain("✓ Creado specs/003-b/");
    }
  });

  it("límite 999: error sin crear nada (CL-6)", async () => {
    await initSpecs();
    await mkdir(join(root, "specs/999-x"));

    const result = await createSpec({ root, slug: "a", args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: límite de 999 specs alcanzado.",
      exitCode: 1,
    });
  });

  it("fallo de copia: rollback del directorio y error con ruta (RF-9, QA A5)", async () => {
    await initSpecs();

    const result = await createSpec({ root, slug: "gastos", args: [], templatePath: BAD_TEMPLATE });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain("Error: no se pudo crear specs/002-gastos/spec.md:");
      expect(result.message).toContain("ENOENT");
    }
    expect(await readdir(join(root, "specs"))).toEqual(["001-sdd-init"]);
  });

  it("specs/ existe como archivo: error de proyecto no inicializado, sin stack trace (validación H1)", async () => {
    await writeFile(join(root, "specs"), "no soy un directorio");

    const result = await createSpec({ root, slug: "gastos", args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: proyecto no inicializado. Ejecuta primero: sdd init",
      exitCode: 1,
    });
  });

  it("destino existente como archivo: error «ya existe» sin barra final, sin tocar el archivo (RF-6, validación H4)", async () => {
    await initSpecs();
    await writeFile(join(root, "specs/002-gastos"), "contenido previo");

    const result = await createSpec({ root, slug: "gastos", args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: ya existe specs/002-gastos.",
      exitCode: 1,
    });
    expect(await readFile(join(root, "specs/002-gastos"), "utf8")).toBe("contenido previo");
  });

  it.skipIf(process.getuid?.() === 0)(
    "specs/ sin permiso de escritura: error con la ruta y nada creado (CL-7, validación H5)",
    async () => {
      await initSpecs();
      await chmod(join(root, "specs"), 0o555);

      const result = await createSpec({ root, slug: "gastos", args: [] });
      await chmod(join(root, "specs"), 0o755);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.exitCode).toBe(1);
        expect(result.message).toContain("Error: no se pudo crear specs/002-gastos:");
      }
      expect(await readdir(join(root, "specs"))).toEqual(["001-sdd-init"]);
    },
  );

  it("sdd new init: slug válido sin conflicto con el comando init (CL-9, validación H7)", async () => {
    await initSpecs();

    const result = await createSpec({ root, slug: "init", args: [] });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines).toContain("✓ Creado specs/002-init/");
    }
  });
});