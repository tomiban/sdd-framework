import { describe, expect, it } from "vitest";

import {
  conflictError,
  createError,
  createdLine,
  existsLine,
  initTitle,
  newCreatedDir,
  newCreatedFile,
  newExists,
  newExtraArgs,
  newInvalidSlug,
  newLimit,
  newMissingSlug,
  newNotInitialized,
  newSuccess,
  newTitle,
  newWriteError,
  successMessage,
  unknownCommandError,
  usageError,
  writeError,
} from "../src/lib/messages.js";

describe("messages", () => {
  it("el título usa el carácter … (U+2026), no tres puntos", () => {
    expect(initTitle()).toBe("Inicializando SDD…");
    expect(initTitle()).toContain("\u2026");
    expect(initTitle()).not.toContain("...");
  });

  it("createdLine y existsLine añaden la barra final a la ruta", () => {
    expect(createdLine("docs")).toBe("✓ Creado docs/");
    expect(createdLine(".opencode/agents")).toBe("✓ Creado .opencode/agents/");
    expect(existsLine("docs")).toBe("✓ docs/ ya existe");
    expect(existsLine(".opencode/agents")).toBe("✓ .opencode/agents/ ya existe");
  });

  it("successMessage distingue si se creó algo", () => {
    expect(successMessage(true)).toBe("SDD inicializado correctamente.");
    expect(successMessage(false)).toBe("SDD ya está inicializado.");
  });

  it("errores en castellano con el uso del comando", () => {
    expect(usageError()).toBe("Error: argumentos no soportados.\nUso: sdd init");
    expect(unknownCommandError("foo")).toBe(
      "Error: comando no soportado: foo\nUso: sdd init",
    );
  });

  it("conflictError reporta la ruta en conflicto con barra final", () => {
    expect(conflictError("docs")).toBe("Error: docs/ ya existe y no es un directorio.");
  });

  it("writeError y createError", () => {
    expect(writeError()).toBe("Error: no es posible escribir en el directorio actual.");
    expect(createError("docs", "EACCES")).toBe("Error: no se pudo crear docs/: EACCES");
  });
});

describe("messages new (spec 002)", () => {
  it("newTitle usa … (U+2026)", () => {
    expect(newTitle()).toBe("Creando spec…");
  });

  it("newCreatedDir, newCreatedFile y newSuccess usan el path con formato", () => {
    expect(newCreatedDir("specs/002-x")).toBe("✓ Creado specs/002-x/");
    expect(newCreatedFile("specs/002-x/spec.md")).toBe("✓ Creado specs/002-x/spec.md");
    expect(newSuccess("specs/002-x")).toBe("Spec creada: specs/002-x/");
  });

  it("errores de uso en castellano", () => {
    expect(newMissingSlug()).toBe("Error: falta el nombre de la spec.\nUso: sdd new <slug>");
    expect(newExtraArgs()).toBe("Error: argumentos no soportados.\nUso: sdd new <slug>");
    expect(newInvalidSlug("Mi-Gasto")).toBe(
      "Error: Mi-Gasto no es un nombre válido (usa kebab-case, p. ej. lista-gastos).\nUso: sdd new <slug>",
    );
  });

  it("newNotInitialized, newExists, newLimit y newWriteError", () => {
    expect(newNotInitialized()).toBe("Error: proyecto no inicializado. Ejecuta primero: sdd init");
    expect(newExists("specs/002-x")).toBe("Error: ya existe specs/002-x/.");
    expect(newExists("specs/002-x", false)).toBe("Error: ya existe specs/002-x.");
    expect(newLimit()).toBe("Error: límite de 999 specs alcanzado.");
    expect(newWriteError("specs/002-x", "ENOENT")).toBe("Error: no se pudo crear specs/002-x: ENOENT");
  });
});