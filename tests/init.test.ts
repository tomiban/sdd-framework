import { chmod, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
const OPENCOPY_ROOT = fileURLToPath(resolveTemplateSource("opencode"));

// Bloques exactos de las specs 005/006 (sustituyen a los de la 001).
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
  "✓ Creado AGENTS.md",
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
  "✓ AGENTS.md ya cita docs/constitution.md",
  "",
  "SDD ya está inicializado.",
];

/** FIRST_RUN con la línea de AGENTS sustituida por la variante correspondiente. */
function withAgentsLine(line: string): string[] {
  return FIRST_RUN.map((entry) => (entry === "✓ Creado AGENTS.md" ? line : entry));
}

async function expectAllDirectoriesExist(): Promise<void> {
  for (const path of ALL_PATHS) {
    const info = await stat(join(root, path));
    expect(info.isDirectory(), `${path} debería ser un directorio`).toBe(true);
  }
}

async function expectFileIsTemplate(path: string, source: string): Promise<void> {
  const generated = await readFile(join(root, path), "utf8");
  const template = await readFile(resolveTemplateSource(source), "utf8");
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
  it("primera ejecución: 6 directorios + constitución + AGENTS.md byte a byte (RF-1/005-006, RF-3/006)", async () => {
    const result = await initialize({ root, args: [] });

    expect(result).toEqual({ ok: true, lines: FIRST_RUN, exitCode: 0 });
    await expectAllDirectoriesExist();
    await expectFileIsTemplate("docs/constitution.md", "constitution.md");
    await expectFileIsTemplate("AGENTS.md", "agents.md");
  });

  it("segunda ejecución: no modifica nada y emite el modo ya inicializado (NFR-3/006)", async () => {
    await initialize({ root, args: [] });
    const constitution = await readFile(join(root, "docs/constitution.md"), "utf8");
    const agents = await readFile(join(root, "AGENTS.md"), "utf8");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({ ok: true, lines: SECOND_RUN, exitCode: 0 });
    expect(await readFile(join(root, "docs/constitution.md"), "utf8")).toBe(constitution);
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(agents);
  });

  it("AGENTS.md preexistente sin cita: añade la regla exacta, una sola vez (RF-2/006, CL-2)", async () => {
    await writeFile(join(root, "AGENTS.md"), "# Proyecto\nreglas previas");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: withAgentsLine("✓ Añadida la regla de constitución a AGENTS.md"),
    });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(
      `# Proyecto\nreglas previas\n${RULE}\n`,
    );

    const again = await initialize({ root, args: [] });
    expect(again).toEqual({ ok: true, lines: SECOND_RUN, exitCode: 0 });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(
      `# Proyecto\nreglas previas\n${RULE}\n`,
    );
  });

  it("AGENTS.md preexistente con cita (Constitution.md): no se toca (RF-2/006, CL-2)", async () => {
    await writeFile(join(root, "AGENTS.md"), "ver Constitution.md");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: withAgentsLine("✓ AGENTS.md ya cita docs/constitution.md"),
    });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe("ver Constitution.md");
  });

  it("AGENTS.md vacío: se le añade la regla (CL-5)", async () => {
    await writeFile(join(root, "AGENTS.md"), "");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: withAgentsLine("✓ Añadida la regla de constitución a AGENTS.md"),
    });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(`${RULE}\n`);
  });

  it("constitución existente y vacía: aviso ⚠ y código 0 (RF-2/005, CL-3)", async () => {
    await initialize({ root, args: [] });
    await writeFile(join(root, "docs/constitution.md"), "   ");

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: true,
      exitCode: 0,
      lines: SECOND_RUN.map((line) =>
        line === "✓ docs/constitution.md ya existe"
          ? "⚠ docs/constitution.md ya existe pero está vacío"
          : line,
      ),
    });
    expect(await readFile(join(root, "docs/constitution.md"), "utf8")).toBe("   ");
  });

  it("constitución como directorio: error, código 1 y nada creado (RF-3/005, CL-3)", async () => {
    await mkdir(join(root, "docs/constitution.md"), { recursive: true });

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: docs/constitution.md ya existe y no es un archivo.",
      exitCode: 1,
    });
    await expectPathNotExists("specs");
  });

  it("AGENTS.md como directorio: error, código 1 y nada creado (CL-3/006)", async () => {
    await mkdir(join(root, "AGENTS.md"));

    const result = await initialize({ root, args: [] });

    expect(result).toEqual({
      ok: false,
      message: "Error: AGENTS.md ya existe y no es un archivo.",
      exitCode: 1,
    });
    await expectPathNotExists("docs");
  });

  it("inicialización parcial (solo docs/): crea lo que falta con líneas mixtas (RF-3/006)", async () => {
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
        "✓ Creado AGENTS.md",
        "",
        "SDD inicializado correctamente.",
      ],
    });
  });

  it("raíces existentes sin subdirectorios: crea los subdirectorios (RF-3/006)", async () => {
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
        "✓ Creado AGENTS.md",
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
      await expectPathNotExists("AGENTS.md");
    } finally {
      await chmod(root, 0o755);
    }
  });

  it("ya inicializado: no comprueba la escritura (QA A5/001)", async () => {
    await initialize({ root, args: [] });
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

  it("constitución ilegible: error con la ruta, sin stack trace (borde de lectura)", async () => {
    if (process.getuid?.() === 0) {
      return;
    }
    await initialize({ root, args: [] });
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

  it("AGENTS.md sin permiso de escritura: error al actualizar (RF-7/005, CL-8)", async () => {
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

  it("fallo de copia de plantilla: rollback del archivo y error con ruta (CL-4/006)", async () => {
    const result = await initialize({ root, args: [], templatePath: BAD_TEMPLATE });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain("Error: no se pudo crear docs/constitution.md:");
      expect(result.message).toContain("ENOENT");
    }
    await expectPathNotExists("docs/constitution.md");
    await expectPathNotExists("AGENTS.md");
  });

  it("popula .opencode/ desde el árbol de plantillas, skill incluida (RF-1/008, CL-1)", async () => {
    const result = await initialize({ root, args: [] });

    expect(result).toEqual({ ok: true, lines: FIRST_RUN, exitCode: 0 });

    for (const rel of [
      "agents/sdd-quick.md",
      "commands/sdd-quick.md",
      "commands/spec.md",
      "skills/sdd/SKILL.md",
    ]) {
      const generated = await readFile(join(root, ".opencode", rel), "utf8");
      const master = await readFile(join(OPENCOPY_ROOT, rel), "utf8");
      expect(generated, rel).toBe(master);
    }
    expect(await readdir(join(root, ".opencode/agents"))).toHaveLength(7);
  });

  it("conserva archivos del usuario y solo copia los que faltan (RF-2/008, CL-2, CL-3, QA A4)", async () => {
    await initialize({ root, args: [] });
    await writeFile(join(root, ".opencode/agents/sdd-quick.md"), "MIO");
    await rm(join(root, ".opencode/commands/spec.md"));

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
        "✓ .opencode/agents/ ya existe",
        "✓ .opencode/commands/ ya existe",
        "✓ .opencode/skills/ ya existe",
        "✓ docs/constitution.md ya existe",
        "✓ AGENTS.md ya cita docs/constitution.md",
        "",
        "SDD inicializado correctamente.",
      ],
    });
    expect(await readFile(join(root, ".opencode/agents/sdd-quick.md"), "utf8")).toBe("MIO");
    const restored = await readFile(join(root, ".opencode/commands/spec.md"), "utf8");
    expect(restored).toBe(await readFile(join(OPENCOPY_ROOT, "commands/spec.md"), "utf8"));
  });

  it.skipIf(process.getuid?.() === 0)(
    "fallo copiando el árbol: error con la ruta y sin archivo parcial (RF-3/008, CL-4)",
    async () => {
      await initialize({ root, args: [] });
      await rm(join(root, ".opencode/commands/spec.md"));
      await chmod(join(root, ".opencode/commands"), 0o555);
      try {
        const result = await initialize({ root, args: [] });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.exitCode).toBe(1);
          expect(result.message).toContain("Error: no se pudo crear .opencode/commands/spec.md:");
        }
        await expectPathNotExists(".opencode/commands/spec.md");
      } finally {
        await chmod(join(root, ".opencode/commands"), 0o755);
      }
    },
  );
});
