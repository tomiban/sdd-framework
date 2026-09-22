import { describe, expect, it } from "vitest";

import { isValidSlug, nextSpecNumber, specDirName } from "../src/lib/spec.js";

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