import { chmod, mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { initialize } from "../src/lib/init.js";

const ALL_PATHS = [
  "docs",
  "specs",
  ".opencode",
  ".opencode/agents",
  ".opencode/commands",
  ".opencode/skills",
] as const;

const FIRST_RUN = [
  "Inicializando SDD…",
  "",
  "✓ Creado docs/",
  "✓ Creado specs/",
  "✓ Creado .opencode/",
  "✓ Creado .opencode/agents/",
  "✓ Creado .opencode/commands/",
  "✓ Creado .opencode/skills/",
  "",
  "SDD inicializado correctamente.",
];

const SECOND_RUN = [
  "Inicializando SDD…",
  "",
  "✓ docs/ ya existe",
  "✓ specs/ ya existe",
  "✓ .opencode/ ya existe",
  "",
  "SDD ya está inicializado.",
];

async function expectAllDirectoriesExist(): Promise<void> {
  for (const path of ALL_PATHS) {
    const info = await stat(join(root, path));
    expect(info.isDirectory(), `${path} debería ser un directorio`).toBe(true);
  }
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
  it("primera ejecución: crea los 6 directorios y emite las líneas exactas (RF-3, RF-5)", async () => {
    const result = await initialize({ root, args: [] });

    expect(result).toEqual({ ok: true, lines: FIRST_RUN, exitCode: 0 });
    await expectAllDirectoriesExist();
  });

  it("segunda ejecución: no crea nada y emite el modo ya inicializado (RF-4, RF-6, NFR-4)", async () => {
    await initialize({ root, args: [] });
    const result = await initialize({ root, args: [] });

    expect(result).toEqual({ ok: true, lines: SECOND_RUN, exitCode: 0 });
    await expectAllDirectoriesExist();
  });

  it("inicialización parcial (solo docs/): crea lo que falta con líneas mixtas (RF-7)", async () => {
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
        "",
        "SDD inicializado correctamente.",
      ],
    });
  });

  it("raíces existentes sin subdirectorios: crea los subdirectorios (CL-3, RF-7)", async () => {
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
        "",
        "SDD inicializado correctamente.",
      ],
    });
  });

  it("conflicto de archivo: error con la ruta, código 1 y nada creado (RF-9)", async () => {
    await writeFile(join(root, "docs"), "");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: docs/ ya existe y no es un directorio.",
      exitCode: 1,
    });
    await expectPathNotExists("specs");
  });

  it("conflicto en un subdirectorio también se detecta (QA A2)", async () => {
    await mkdir(join(root, ".opencode"));
    await writeFile(join(root, ".opencode", "agents"), "");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: .opencode/agents/ ya existe y no es un directorio.",
      exitCode: 1,
    });
  });

  it("argumentos no soportados: error de uso y nada creado (RF-10)", async () => {
    const result = await initialize({ root, args: ["--foo"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: argumentos no soportados.\nUso: sdd init",
      exitCode: 1,
    });
    await expectPathNotExists("docs");
  });

  it("los argumentos tienen prioridad sobre el conflicto (QA A3)", async () => {
    await writeFile(join(root, "docs"), "");

    const result = await initialize({ root, args: ["--foo"] });

    expect(result).toEqual({
      ok: false,
      message: "Error: argumentos no soportados.\nUso: sdd init",
      exitCode: 1,
    });
  });

  it("cwd no escribible: error sin crear nada (RF-8)", async () => {
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

  it("ya inicializado: no comprueba la escritura (QA A5)", async () => {
    for (const path of ALL_PATHS) {
      await mkdir(join(root, path), { recursive: true });
    }
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
});