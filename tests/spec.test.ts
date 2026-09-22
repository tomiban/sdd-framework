import { describe, expect, it } from "vitest";

import {
  findSpecDir,
  isValidSlug,
  nextSpecNumber,
  parseSpecId,
  specDirName,
} from "../src/lib/spec.js";

describe("isValidSlug", () => {
  it("acepta slugs kebab-case válidos", () => {
    for (const slug of ["gastos", "lista-gastos", "a1-b2", "abc", "123"]) {
      expect(isValidSlug(slug), `slug: ${slug}`).toBe(true);
    }
  });

  it("rechaza slugs inválidos (CL-2): mayúsculas, espacios, guiones dobles y bordes, _, acentos", () => {
    for (const slug of [
      "",
      "MisGastos",
      "mi gasto",
      "mi--gasto",
      "-gasto",
      "gasto-",
      "mi_gasto",
      "café",
      "mi.gasto",
      "--foo",
    ]) {
      expect(isValidSlug(slug), `slug: ${slug}`).toBe(false);
    }
  });
});

describe("nextSpecNumber", () => {
  it("001 sin specs existentes (CL-4)", () => {
    expect(nextSpecNumber([])).toEqual({ ok: true, nnn: "001" });
    expect(nextSpecNumber(["plantillas", "README.md"])).toEqual({ ok: true, nnn: "001" });
  });

  it("sigue al máximo prefijo de 3 dígitos", () => {
    expect(nextSpecNumber(["001-sdd-init"])).toEqual({ ok: true, nnn: "002" });
    expect(nextSpecNumber(["001-sdd-init", "003-a"])).toEqual({ ok: true, nnn: "004" });
  });

  it("ignora nombres sin prefijo NNN (QA A2)", () => {
    expect(nextSpecNumber(["plantillas", "001-sdd-init"])).toEqual({ ok: true, nnn: "002" });
  });

  it("prefijos de más de 3 dígitos no cuentan (1000-x → 001)", () => {
    expect(nextSpecNumber(["1000-x"])).toEqual({ ok: true, nnn: "001" });
  });

  it("límite: error si el máximo es 999, 999 si el máximo es 998 (CL-6)", () => {
    expect(nextSpecNumber(["999-x"])).toEqual({ ok: false, reason: "limit" });
    expect(nextSpecNumber(["998-x"])).toEqual({ ok: true, nnn: "999" });
  });
});

describe("specDirName", () => {
  it("combina número y slug", () => {
    expect(specDirName("002", "lista-gastos")).toBe("002-lista-gastos");
  });
});

describe("parseSpecId (spec 003)", () => {
  it("normaliza 1-3 dígitos a 3 con ceros a la izquierda (CL-4)", () => {
    expect(parseSpecId("3")).toBe("003");
    expect(parseSpecId("03")).toBe("003");
    expect(parseSpecId("003")).toBe("003");
    expect(parseSpecId("000")).toBe("000");
    expect(parseSpecId("999")).toBe("999");
  });

  it("rechaza ids inválidos (CL-2)", () => {
    for (const input of ["", "0021", "3a", "x", "-1", "0x2", "002-slug", " 3", "3 "]) {
      expect(parseSpecId(input), `input: ${JSON.stringify(input)}`).toBeNull();
    }
  });
});

describe("findSpecDir (spec 003)", () => {
  it("resuelve el único directorio con el prefijo NNN-", () => {
    expect(findSpecDir(["002-sdd-new", "003-x"], "002")).toEqual({ ok: true, dir: "002-sdd-new" });
  });

  it("missing si no hay candidatos (CL-3, CL-10)", () => {
    expect(findSpecDir(["001-a", "plantillas"], "999")).toEqual({
      ok: false,
      reason: "missing",
      matches: [],
    });
  });

  it("ambiguous lista los candidatos sin elegir (CL-3)", () => {
    expect(findSpecDir(["002-a", "001-b", "002-b"], "002")).toEqual({
      ok: false,
      reason: "ambiguous",
      matches: ["002-a", "002-b"],
    });
  });

  it("ignora nombres sin el prefijo exacto NNN-", () => {
    expect(findSpecDir(["plantillas", "0021-x"], "002")).toEqual({
      ok: false,
      reason: "missing",
      matches: [],
    });
  });
});