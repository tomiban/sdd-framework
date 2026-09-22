import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { initialize } from "../src/lib/init.js";
import { resolveTemplateSource } from "../src/lib/templates.js";

const ALL_PATHS = [
  "docs",
  "specs",
  ".opencode",
  ".opencode/agents",
  ".opencode/commands",
  ".opencode/skills",
] as const;

const RULE = "- Lee `docs/constitution.md` y la spec activa en `specs/` antes de tocar código.";
const BAD_TEMPLATE = new URL("file:///ruta/que/no/existe/constitution.md");

// Bloques exactos de la spec 005 (sustituyen a los RF-5/RF-6 de la 001).
const FIRST_RUN = [
  "Inicializando SDD…",
  "",
  "✓ Creado docs/",
  "✓ Creado specs/",
  "✓ Creado .opencode/",
  "✓ Creado .opencode/agents/",
  "✓ Creado .opencode/commands/",
  "✓ Creado .opencode/skills/",
  "✓ Creado docs/constitution.md",
  "",
  "SDD inicializado correctamente.",
];

const SECOND_RUN = [
  "Inicializando SDD…",
  "",
  "✓ docs/ ya existe",
  "✓ specs/ ya existe",
  "✓ .opencode/ ya existe",
  "✓ docs/constitution.md ya existe",
  "",
  "SDD ya está inicializado.",
];

async function expectAllDirectoriesExist(): Promise<void> {
  for (const path of ALL_PATHS) {
    const info = await stat(join(root, path));
    expect(info.isDirectory(), `${path} debería ser un directorio`).toBe(true);
  }
}

async function expectConstitutionIsTemplate(): Promise<void> {
  const generated = await readFile(join(root, "docs/constitution.md"), "utf8");
  const template = await readFile(resolveTemplateSource("constitution.md"), "utf8");
  expect(generated).toBe(template);
}

async function expectPathNotExists(path: string): Promise<void> {
  await expect(stat(join(root, path))).rejects.toMatchObject({ code: "ENOENT" });
}

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "sdd-init-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("initialize", () => {
  it("primera ejecución: crea los 6 directorios y la constitución byte a byte (RF-1, RF-6)", async () => {
    const result = await initialize({ root, args: [] });

    expect(result).toEqual({ ok: true, lines: FIRST_RUN, exitCode: 0 });
    await expectAllDirectoriesExist();
    await expectConstitutionIsTemplate();
  });

  it("segunda ejecución: no modifica nada y emite el modo ya inicializado (RF-2, RF-6, NFR-5/6)", async () => {
    await initialize({ root, args: [] });
    const before = await readFile(join(root, "docs/constitution.md"), "utf8");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({ ok: true, lines: SECOND_RUN, exitCode: 0 });
    expect(await readFile(join(root, "docs/constitution.md"), "utf8")).toBe(before);
  });

  it("AGENTS.md sin cita: añade la regla exacta al final, una sola vez (RF-4, CL-2, CL-6)", async () => {
    await writeFile(join(root, "AGENTS.md"), "# Proyecto\nreglas previas");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        ...FIRST_RUN.slice(0, -2),
        "✓ Añadida la regla de constitución a AGENTS.md",
        ...FIRST_RUN.slice(-2),
      ],
    });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(
      `# Proyecto\nreglas previas\n${RULE}\n`,
    );

    const again = await initialize({ root, args: [] });
    expect(again).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        ...SECOND_RUN.slice(0, -2),
        "✓ AGENTS.md ya cita docs/constitution.md",
        ...SECOND_RUN.slice(-2),
      ],
    });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(
      `# Proyecto\nreglas previas\n${RULE}\n`,
    );
  });

  it("AGENTS.md que menciona Constitution.md cuenta como citado y no se toca (RF-5, CL-2)", async () => {
    await writeFile(join(root, "AGENTS.md"), "ver Constitution.md");
    await initialize({ root, args: [] });

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        ...SECOND_RUN.slice(0, -2),
        "✓ AGENTS.md ya cita docs/constitution.md",
        ...SECOND_RUN.slice(-2),
      ],
    });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe("ver Constitution.md");
  });

  it("constitución existente y vacía: aviso ⚠ y código 0 (RF-2, CL-3)", async () => {
    for (const path of ALL_PATHS) {
      await mkdir(join(root, path), { recursive: true });
    }
    await writeFile(join(root, "docs/constitution.md"), "   ");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        ...SECOND_RUN.slice(0, -3),
        "⚠ docs/constitution.md ya existe pero está vacío",
        ...SECOND_RUN.slice(-2),
      ],
    });
    expect(await readFile(join(root, "docs/constitution.md"), "utf8")).toBe("   ");
  });

  it("constitución como directorio: error, código 1 y nada creado (RF-3, CL-4)", async () => {
    await mkdir(join(root, "docs/constitution.md"), { recursive: true });

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: docs/constitution.md ya existe y no es un archivo.",
      exitCode: 1,
    });
    await expectPathNotExists("specs");
  });

  it("AGENTS.md como directorio: error, código 1 y nada creado (RF-5, CL-4)", async () => {
    await mkdir(join(root, "AGENTS.md"));

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: AGENTS.md ya existe y no es un archivo.",
      exitCode: 1,
    });
    await expectPathNotExists("docs");
  });

  it("inicialización parcial (solo docs/): crea lo que falta con líneas mixtas (RF-6, CL-5)", async () => {
    await mkdir(join(root, "docs"));

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        "Inicializando SDD…",
        "",
        "✓ docs/ ya existe",
        "✓ Creado specs/",
        "✓ Creado .opencode/",
        "✓ Creado .opencode/agents/",
        "✓ Creado .opencode/commands/",
        "✓ Creado .opencode/skills/",
        "✓ Creado docs/constitution.md",
        "",
        "SDD inicializado correctamente.",
      ],
    });
    await expectConstitutionIsTemplate();
  });

  it("raíces existentes sin subdirectorios: crea los subdirectorios (CL-3/001, RF-6)", async () => {
    await mkdir(join(root, "docs"));
    await mkdir(join(root, "specs"));
    await mkdir(join(root, ".opencode"));

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: [
        "Inicializando SDD…",
        "",
        "✓ docs/ ya existe",
        "✓ specs/ ya existe",
        "✓ .opencode/ ya existe",
        "✓ Creado .opencode/agents/",
        "✓ Creado .opencode/commands/",
        "✓ Creado .opencode/skills/",
        "✓ Creado docs/constitution.md",
        "",
        "SDD inicializado correctamente.",
      ],
    });
  });

  it("conflicto de archivo: error con la ruta, código 1 y nada creado (RF-9/001)", async () => {
    await writeFile(join(root, "docs"), "");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: docs/ ya existe y no es un directorio.",
      exitCode: 1,
    });
    await expectPathNotExists("specs");
  });

  it("conflicto en un subdirectorio también se detecta (QA A2/001)", async () => {
    await mkdir(join(root, ".opencode"));
    await writeFile(join(root, ".opencode", "agents"), "");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: .opencode/agents/ ya existe y no es un directorio.",
      exitCode: 1,
    });
  });

  it("argumentos no soportados: error de uso y nada creado (RF-10/001)", async () => {
    const result = await initialize({ root, args: ["--foo"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: argumentos no soportados.\nUso: sdd init",
      exitCode: 1,
    });
    await expectPathNotExists("docs");
  });

  it("los argumentos tienen prioridad sobre el conflicto (QA A3/001)", async () => {
    await writeFile(join(root, "docs"), "");

    const result = await initialize({ root, args: ["--foo"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: argumentos no soportados.\nUso: sdd init",
      exitCode: 1,
    });
  });

  it("cwd no escribible: error sin crear nada (RF-8/001)", async () => {
    if (process.getuid?.() === 0) {
      return; // root ignora permisos: el caso no es reproducible
    }
    await chmod(root, 0o555);
    try {
      const result = await initialize({ root, args: [] });

      expect(result).toEqual({
        ok: false,
        message: "Error: no es posible escribir en el directorio actual.",
        exitCode: 1,
      });
      await expectPathNotExists("docs");
    } finally {
      await chmod(root, 0o755);
    }
  });

  it("ya inicializado: no comprueba la escritura (QA A5/001)", async () => {
    for (const path of ALL_PATHS) {
      await mkdir(join(root, path), { recursive: true });
    }
    await writeFile(join(root, "docs/constitution.md"), "principios");
    if (process.getuid?.() === 0) {
      return;
    }
    await chmod(root, 0o555);
    try {
      const result = await initialize({ root, args: [] });

      expect(result).toEqual({ ok: true, lines: SECOND_RUN, exitCode: 0 });
    } finally {
      await chmod(root, 0o755);
    }
  });

  it("fallo de copia de la plantilla: rollback del archivo y error con ruta (RF-7, CL-7)", async () => {
    const result = await initialize({ root, args: [], templatePath: BAD_TEMPLATE });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain("Error: no se pudo crear docs/constitution.md:");
      expect(result.message).toContain("ENOENT");
    }
    await expectPathNotExists("docs/constitution.md");
  });

  it("constitución ilegible: error con la ruta, sin stack trace (borde de lectura)", async () => {
    if (process.getuid?.() === 0) {
      return;
    }
    for (const path of ALL_PATHS) {
      await mkdir(join(root, path), { recursive: true });
    }
    await writeFile(join(root, "docs/constitution.md"), "principios");
    await chmod(join(root, "docs/constitution.md"), 0o000);
    try {
      const result = await initialize({ root, args: [] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.exitCode).toBe(1);
        expect(result.message).toContain("Error: no se pudo leer docs/constitution.md:");
      }
    } finally {
      await chmod(join(root, "docs/constitution.md"), 0o644);
    }
  });

  it("AGENTS.md sin permiso de escritura: error al actualizar (RF-7, CL-8)", async () => {
    if (process.getuid?.() === 0) {
      return;
    }
    await writeFile(join(root, "AGENTS.md"), "previo");
    await chmod(join(root, "AGENTS.md"), 0o444);
    try {
      const result = await initialize({ root, args: [] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.exitCode).toBe(1);
        expect(result.message).toContain("Error: no se pudo actualizar AGENTS.md:");
      }
    } finally {
      await chmod(join(root, "AGENTS.md"), 0o644);
    }
  });
});
