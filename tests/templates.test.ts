import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { resolveTemplateSource, TEMPLATES, templatesFor } from "../src/lib/templates.js";

const SPEC_SECTIONS = [
  "## Contexto y objetivo",
  "## Usuarios / actores",
  "## Historias de usuario",
  "## Requisitos funcionales",
  "## Requisitos no funcionales",
  "## Casos límite",
  "## Fuera de alcance",
  "## Criterios de finalización",
];

const PLAN_SECTIONS = [
  "## 0. Cambios de persistencia",
  "## 1. Resolución de ambigüedades",
  "## 2. Decisiones técnicas",
  "## 3. Modelo de datos y contratos",
  "## 4. Estrategia de tests",
  "## 5. Cobertura",
];

const TASKS_SECTIONS = ["## T1 —", "**RF:**", "**Hecho cuando:**"];

describe("templates", () => {
  it("el manifiesto etiqueta cada entrada con su fase (constitución #3, QA A10)", () => {
    expect(TEMPLATES).toEqual([
      { phase: "new", dest: "spec.md", source: "spec.md" },
      { phase: "plan", dest: "plan.md", source: "plan.md" },
      { phase: "tasks", dest: "tasks.md", source: "tasks.md" },
    ]);
  });

  it("templatesFor devuelve solo las entradas de cada fase", () => {
    expect(templatesFor("new")).toEqual([{ phase: "new", dest: "spec.md", source: "spec.md" }]);
    expect(templatesFor("plan")).toEqual([{ phase: "plan", dest: "plan.md", source: "plan.md" }]);
    expect(templatesFor("tasks")).toEqual([{ phase: "tasks", dest: "tasks.md", source: "tasks.md" }]);
  });

  it("cada template existe y contiene sus secciones", async () => {
    for (const [source, sections] of [
      ["spec.md", SPEC_SECTIONS],
      ["plan.md", PLAN_SECTIONS],
      ["tasks.md", TASKS_SECTIONS],
    ] as const) {
      const url = resolveTemplateSource(source);

      const info = await stat(fileURLToPath(url));
      expect(info.isFile(), `template: ${source}`).toBe(true);

      const content = await readFile(url, "utf8");
      for (const section of sections) {
        expect(content, `sección ${source}: ${section}`).toContain(section);
      }
    }
  });
});
