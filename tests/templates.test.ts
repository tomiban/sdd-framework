import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { findTemplate, resolveTemplateSource, TEMPLATES } from "../src/lib/templates.js";

const SECTIONS = [
  "## Contexto y objetivo",
  "## Usuarios / actores",
  "## Historias de usuario",
  "## Requisitos funcionales",
  "## Requisitos no funcionales",
  "## Casos límite",
  "## Fuera de alcance",
  "## Criterios de finalización",
];

describe("templates", () => {
  it("el manifiesto declara el spec.md (constitución #3)", () => {
    expect(TEMPLATES).toEqual([{ dest: "spec.md", source: "spec.md" }]);
  });

  it("findTemplate resuelve el entry por destino", () => {
    expect(findTemplate("spec.md")).toEqual({ dest: "spec.md", source: "spec.md" });
    expect(findTemplate("no-existe")).toBeUndefined();
  });

  it("el template existe y contiene las 8 secciones de la plantilla SDD", async () => {
    const url = resolveTemplateSource("spec.md");

    const info = await stat(fileURLToPath(url));
    expect(info.isFile()).toBe(true);

    const content = await readFile(url, "utf8");
    for (const section of SECTIONS) {
      expect(content, `sección: ${section}`).toContain(section);
    }
  });
});