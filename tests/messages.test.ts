import { describe, expect, it } from "vitest";

import {
  conflictError,
  createError,
  createFileError,
  createdLine,
  existsError,
  existsLine,
  fileCreatedLine,
  initTitle,
  missingPlanFile,
  missingSpecFile,
  newCreatedDir,
  newExtraArgs,
  newInvalidSlug,
  newLimit,
  newMissingSlug,
  newSuccess,
  newTitle,
  notInitializedError,
  phaseExtraArgs,
  phaseInvalidId,
  phaseMissingId,
  phaseSuccess,
  phaseTitle,
  specAmbiguous,
  specNotFound,
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
  });

  it("unknownCommandError lista todos los comandos (RF-12, spec 003)", () => {
    expect(unknownCommandError("foo")).toBe(
      "Error: comando no soportado: foo\nUso: sdd <comando> (init, new <slug>, plan <NNN>, tasks <NNN>)",
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

describe("messages compartidos (renombrado A7)", () => {
  it("fileCreatedLine, notInitializedError, createFileError", () => {
    expect(fileCreatedLine("specs/002-x/plan.md")).toBe("✓ Creado specs/002-x/plan.md");
    expect(notInitializedError()).toBe("Error: proyecto no inicializado. Ejecuta primero: sdd init");
    expect(createFileError("specs/002-x", "ENOENT")).toBe("Error: no se pudo crear specs/002-x: ENOENT");
  });

  it("existsError pone barra final solo a directorios (validación H4)", () => {
    expect(existsError("specs/002-x")).toBe("Error: ya existe specs/002-x/.");
    expect(existsError("specs/002-x", false)).toBe("Error: ya existe specs/002-x.");
  });
});

describe("messages new (spec 002)", () => {
  it("newTitle usa … (U+2026)", () => {
    expect(newTitle()).toBe("Creando spec…");
  });

  it("newCreatedDir y newSuccess usan el path con formato", () => {
    expect(newCreatedDir("specs/002-x")).toBe("✓ Creado specs/002-x/");
    expect(newSuccess("specs/002-x")).toBe("Spec creada: specs/002-x/");
  });

  it("errores de uso en castellano", () => {
    expect(newMissingSlug()).toBe("Error: falta el nombre de la spec.\nUso: sdd new <slug>");
    expect(newExtraArgs()).toBe("Error: argumentos no soportados.\nUso: sdd new <slug>");
    expect(newInvalidSlug("Mi-Gasto")).toBe(
      "Error: Mi-Gasto no es un nombre válido (usa kebab-case, p. ej. lista-gastos).\nUso: sdd new <slug>",
    );
    expect(newLimit()).toBe("Error: límite de 999 specs alcanzado.");
  });
});

describe("messages de fase (spec 003)", () => {
  it("phaseMissingId, phaseExtraArgs y phaseInvalidId", () => {
    expect(phaseMissingId("plan")).toBe("Error: falta el número de la spec.\nUso: sdd plan <NNN>");
    expect(phaseExtraArgs("tasks")).toBe("Error: argumentos no soportados.\nUso: sdd tasks <NNN>");
    expect(phaseInvalidId("plan", "0021")).toBe(
      "Error: 0021 no es un número de spec válido (1-3 dígitos, p. ej. 002).\nUso: sdd plan <NNN>",
    );
  });

  it("specNotFound y specAmbiguous", () => {
    expect(specNotFound("003")).toBe("Error: no existe la spec 003.");
    expect(specAmbiguous("002", ["002-a", "002-b"])).toBe(
      "Error: la spec 002 es ambigua: 002-a, 002-b.",
    );
  });

  it("missingSpecFile y missingPlanFile", () => {
    expect(missingSpecFile("specs/002-x/spec.md")).toBe(
      "Error: falta specs/002-x/spec.md. Flujo SDD: spec → plan → tareas.",
    );
    expect(missingPlanFile("specs/002-x/plan.md", "002")).toBe(
      "Error: falta specs/002-x/plan.md. Ejecuta primero: sdd plan 002",
    );
  });

  it("phaseTitle y phaseSuccess usan … (U+2026) y el path", () => {
    expect(phaseTitle("plan")).toBe("Creando plan…");
    expect(phaseTitle("tasks")).toBe("Creando tareas…");
    expect(phaseTitle("plan")).toContain("\u2026");
    expect(phaseSuccess("plan", "specs/002-x/plan.md")).toBe("Plan creado: specs/002-x/plan.md");
    expect(phaseSuccess("tasks", "specs/002-x/tasks.md")).toBe(
      "Tareas creadas: specs/002-x/tasks.md",
    );
  });
});
