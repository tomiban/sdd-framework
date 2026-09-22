import { describe, expect, it } from "vitest";

import {
  conflictError,
  createError,
  createdLine,
  existsLine,
  initTitle,
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