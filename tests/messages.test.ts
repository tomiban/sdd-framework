import { describe, expect, it } from "vitest";

import {
  agentsCitedLine,
  agentsRuleAddedLine,
  appendError,
  artifactsLine,
  configInvalid,
  configMissing,
  conflictError,
  constitutionEmpty,
  constitutionEmptyWarn,
  constitutionLine,
  constitutionMissing,
  constitutionUncited,
  createError,
  createFileError,
  createdLine,
  existsError,
  existsLine,
  fileConflictError,
  fileCreatedLine,
  fileExistsLine,
  idExtraArgsError,
  idInvalidError,
  idMissingError,
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
  phaseSuccess,
  phaseTitle,
  readError,
  specAmbiguous,
  specNotFound,
  structureLine,
  structureRequiresSpec,
  successMessage,
  tasksLine,
  tasksRequiresFile,
  tasksStructureLine,
  traceLine,
  traceRequiresSpec,
  unknownCommandError,
  usageError,
  validateTitle,
  verdictLine,
  verdesLine,
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
    expect(fileExistsLine("docs/constitution.md")).toBe("✓ docs/constitution.md ya existe");
  });
});

describe("messages de init: constitución y AGENTS.md (spec 005)", () => {
  it("fileConflictError, appendError y readError", () => {
    expect(fileConflictError("docs/constitution.md")).toBe(
      "Error: docs/constitution.md ya existe y no es un archivo.",
    );
    expect(appendError("AGENTS.md", "EACCES")).toBe(
      "Error: no se pudo actualizar AGENTS.md: EACCES",
    );
    expect(readError("docs/constitution.md", "EACCES")).toBe(
      "Error: no se pudo leer docs/constitution.md: EACCES",
    );
  });

  it("constitutionEmptyWarn usa el glifo ⚠ (RF-2, QA A4)", () => {
    expect(constitutionEmptyWarn()).toBe("⚠ docs/constitution.md ya existe pero está vacío");
  });

  it("agentsRuleAddedLine y agentsCitedLine", () => {
    expect(agentsRuleAddedLine()).toBe("✓ Añadida la regla de constitución a AGENTS.md");
    expect(agentsCitedLine()).toBe("✓ AGENTS.md ya cita docs/constitution.md");
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
  it("idMissingError, idExtraArgsError e idInvalidError (specs 003-004)", () => {
    expect(idMissingError("plan")).toBe("Error: falta el número de la spec.\nUso: sdd plan <NNN>");
    expect(idExtraArgsError("tasks")).toBe("Error: argumentos no soportados.\nUso: sdd tasks <NNN>");
    expect(idInvalidError("plan", "0021")).toBe(
      "Error: 0021 no es un número de spec válido (1-3 dígitos, p. ej. 002).\nUso: sdd plan <NNN>",
    );
    expect(idMissingError("validate")).toBe(
      "Error: falta el número de la spec.\nUso: sdd validate <NNN>",
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

describe("messages de validate (spec 004)", () => {
  it("configMissing y configInvalid", () => {
    expect(configMissing()).toBe("Error: falta sdd.json con los comandos de verificación.");
    expect(configInvalid("JSON malformado")).toBe("Error: sdd.json inválido: JSON malformado");
  });

  it("validateTitle y verdictLine", () => {
    expect(validateTitle("002-x")).toBe("Validando spec 002-x…");
    expect(validateTitle("002-x")).toContain("\u2026");
    expect(verdictLine("002-x", true)).toBe("Spec 002-x: LISTO");
    expect(verdictLine("002-x", false)).toBe("Spec 002-x: NO LISTO");
  });

  it("artifactsLine con plurales (QA A11)", () => {
    expect(artifactsLine([])).toBe("✓ Artefactos: spec.md, plan.md, tasks.md");
    expect(artifactsLine(["plan.md"])).toBe("✗ Artefactos: falta plan.md");
    expect(artifactsLine(["plan.md", "tasks.md"])).toBe("✗ Artefactos: faltan plan.md, tasks.md");
  });

  it("structureLine y traceLine", () => {
    expect(structureRequiresSpec()).toBe("✗ Estructura: requiere spec.md");
    expect(structureLine([])).toBe("✓ Estructura: todas las secciones de la plantilla");
    expect(structureLine(["Casos límite"])).toBe("✗ Estructura: sin secciones: Casos límite");
    expect(traceRequiresSpec()).toBe("✗ Trazabilidad: requiere spec.md");
    expect(traceLine([], [])).toBe("✓ Trazabilidad: todos los RF cubiertos en plan.md y tasks.md");
    expect(traceLine([1, 2], [2])).toBe(
      "✗ Trazabilidad: sin cubrir en plan.md: RF-1, RF-2 · sin cubrir en tasks.md: RF-2",
    );
  });

  it("tasksLine y variantes", () => {
    expect(tasksRequiresFile()).toBe("✗ Tareas: requiere tasks.md");
    expect(tasksStructureLine(true)).toBe("✗ Tareas: sin «Hecho cuando» en tasks.md");
    expect(tasksStructureLine(false)).toBe("✗ Tareas: sin tareas en tasks.md");
    expect(tasksLine(3, 3, [])).toBe("✓ Tareas: 3/3 completadas");
    expect(tasksLine(1, 2, ["T2"])).toBe("✗ Tareas: 1/2 completadas (pendientes: T2)");
    expect(tasksLine(0, 2, ["T1", "T2"])).toBe("✗ Tareas: 0/2 completadas (pendientes: T1, T2)");
  });

  it("constitutionLine y variantes", () => {
    expect(constitutionLine()).toBe(
      "✓ Constitución: docs/constitution.md (citada en spec/plan/tasks)",
    );
    expect(constitutionMissing()).toBe("✗ Constitución: falta docs/constitution.md");
    expect(constitutionEmpty()).toBe("✗ Constitución: docs/constitution.md está vacío");
    expect(constitutionUncited()).toBe(
      "✗ Constitución: docs/constitution.md (sin citas en los artefactos)",
    );
  });

  it("verdesLine con fallos y timeout", () => {
    expect(verdesLine([{ command: "a", outcome: 0 }, { command: "b", outcome: 0 }])).toBe(
      "✓ Verdes: 2/2 comandos",
    );
    expect(verdesLine([{ command: "a", outcome: 0 }, { command: "b", outcome: 1 }])).toBe(
      "✗ Verdes: 1/2 comandos — b (exit 1)",
    );
    expect(verdesLine([{ command: "a", outcome: "timeout" }])).toBe(
      "✗ Verdes: 0/1 comandos — a (timeout)",
    );
    expect(verdesLine([{ command: "a", outcome: 3 }, { command: "b", outcome: "timeout" }])).toBe(
      "✗ Verdes: 0/2 comandos — a (exit 3) · b (timeout)",
    );
  });
});
