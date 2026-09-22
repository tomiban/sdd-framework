import { describe, expect, it } from "vitest";

import {
  citesConstitution,
  missingSections,
  parseTasks,
  rfTokens,
} from "../src/lib/analysis.js";

describe("rfTokens (spec 004)", () => {
  it("reúne tokens sueltos, únicos y ordenados", () => {
    expect(rfTokens("RF-2 … RF-1")).toEqual([1, 2]);
    expect(rfTokens("ver RF-5 y otra vez RF-5")).toEqual([5]);
  });

  it("expande rangos RF-a…RF-b de forma inclusiva (QA A2)", () => {
    expect(rfTokens("RF-1…RF-4")).toEqual([1, 2, 3, 4]);
    expect(rfTokens("RF-1…RF-10")).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(rfTokens("RF-3…RF-11 · RF-12")).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(rfTokens("RF-2..RF-3")).toEqual([2, 3]);
  });

  it("ignora RF-N no numérico y prefijos que no son RF-", () => {
    expect(rfTokens("RF-N y ARF-2 y XRF-3")).toEqual([]);
    expect(rfTokens("RF-1…RF-N")).toEqual([1]);
  });
});

describe("missingSections (spec 004)", () => {
  const template =
    "## Contexto y objetivo\n## Requisitos funcionales (criterios de aceptación en EARS)\n## Casos límite\n";

  it("tolera variantes de paréntesis (QA A3)", () => {
    const spec =
      "## Contexto y objetivo\n## Requisitos funcionales (EARS)\n## Casos límite (del CLI)\n";
    expect(missingSections(spec, template)).toEqual([]);
  });

  it("lista las secciones base faltantes", () => {
    const spec = "## Contexto y objetivo\n## Casos límite\n";
    expect(missingSections(spec, template)).toEqual(["Requisitos funcionales"]);
    expect(missingSections("sin encabezados", template)).toEqual([
      "Contexto y objetivo",
      "Requisitos funcionales",
      "Casos límite",
    ]);
  });
});

describe("parseTasks (spec 004)", () => {
  it("todo completado", () => {
    const text = "## T1 — a\n**RF:** RF-1\n- [x] uno\n- [x] dos\n## T2 — b\n- [x] tres\n";
    expect(parseTasks(text)).toEqual({
      taskIds: ["T1", "T2"],
      totalCount: 3,
      doneCount: 3,
      pendingIds: [],
      hasTasks: true,
      hasCheckboxes: true,
    });
  });

  it("pendientes por id de tarea (CL-7)", () => {
    const text = "## T1 — a\n- [x] uno\n- [ ] dos\n## T2 — b\n- [ ] tres\n";
    const summary = parseTasks(text);
    expect(summary.doneCount).toBe(1);
    expect(summary.totalCount).toBe(3);
    expect(summary.pendingIds).toEqual(["T1", "T2"]);
  });

  it("sin checkboxes y sin bloques (CL-7)", () => {
    expect(parseTasks("## T1 — a\nsin marcables")).toMatchObject({
      hasTasks: true,
      hasCheckboxes: false,
    });
    expect(parseTasks("solo texto")).toMatchObject({ hasTasks: false, hasCheckboxes: false });
  });
});

describe("citesConstitution (spec 004)", () => {
  it("detecta citas sin distinguir mayúsculas (QA A8)", () => {
    expect(citesConstitution(["x", "según la Constitución aplica"])).toBe(true);
    expect(citesConstitution(["ver constitution.md"])).toBe(true);
    expect(citesConstitution(["nada por aquí"])).toBe(false);
  });
});
