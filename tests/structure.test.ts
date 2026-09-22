import { describe, expect, it } from "vitest";

import { SDD_STRUCTURE, flattenStructure } from "../src/lib/structure.js";

describe("flattenStructure", () => {
  it("devuelve 6 elementos en el orden canónico", () => {
    expect(flattenStructure().map((element) => element.path)).toEqual([
      "docs",
      "specs",
      ".opencode",
      ".opencode/agents",
      ".opencode/commands",
      ".opencode/skills",
    ]);
  });

  it("cada elemento conserva nombre propio y ruta relativa", () => {
    expect(flattenStructure()[3]).toEqual({
      name: "agents",
      path: ".opencode/agents",
    });
  });
});

describe("SDD_STRUCTURE", () => {
  it("declara los tres directorios raíz en orden", () => {
    expect(SDD_STRUCTURE.map((node) => node.name)).toEqual([
      "docs",
      "specs",
      ".opencode",
    ]);
  });

  it(".opencode declara sus subdirectorios en orden", () => {
    expect(SDD_STRUCTURE[2]?.children).toEqual([
      "agents",
      "commands",
      "skills",
    ]);
  });

  it("docs y specs no tienen subdirectorios", () => {
    expect(SDD_STRUCTURE[0]?.children).toEqual([]);
    expect(SDD_STRUCTURE[1]?.children).toEqual([]);
  });
});