import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { parseVerifyConfig, readVerifyConfig } from "../src/lib/config.js";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "sdd-config-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("parseVerifyConfig (spec 004)", () => {
  it("config válida; los campos extra se ignoran (CL-3)", () => {
    expect(parseVerifyConfig('{"verify":["pnpm test"],"otro":1}')).toEqual({
      ok: true,
      commands: ["pnpm test"],
    });
  });

  it("CL-3: malformado, sin verify, vacío, no lista y elementos inválidos", () => {
    expect(parseVerifyConfig("{")).toEqual({ ok: false, detail: "JSON malformado" });
    expect(parseVerifyConfig("[1]")).toEqual({
      ok: false,
      detail: "debe ser un objeto con la clave verify",
    });
    expect(parseVerifyConfig("{}")).toEqual({
      ok: false,
      detail: "verify debe ser una lista de comandos",
    });
    expect(parseVerifyConfig('{"verify":"pnpm test"}')).toEqual({
      ok: false,
      detail: "verify debe ser una lista de comandos",
    });
    expect(parseVerifyConfig('{"verify":[]}')).toEqual({
      ok: false,
      detail: "verify no puede estar vacío",
    });
    expect(parseVerifyConfig('{"verify":[1]}')).toEqual({
      ok: false,
      detail: "verify debe contener comandos no vacíos",
    });
    expect(parseVerifyConfig('{"verify":["  "]}')).toEqual({
      ok: false,
      detail: "verify debe contener comandos no vacíos",
    });
  });
});

describe("readVerifyConfig (spec 004)", () => {
  it("sin sdd.json → mensaje de precondición (QA A4)", async () => {
    expect(await readVerifyConfig(root)).toEqual({
      ok: false,
      message: "Error: falta sdd.json con los comandos de verificación.",
    });
  });

  it("sdd.json inválido → detalle; válido → comandos", async () => {
    await writeFile(join(root, "sdd.json"), "{");
    expect(await readVerifyConfig(root)).toEqual({
      ok: false,
      message: "Error: sdd.json inválido: JSON malformado",
    });

    await writeFile(join(root, "sdd.json"), '{"verify":["uno","dos"]}');
    expect(await readVerifyConfig(root)).toEqual({ ok: true, commands: ["uno", "dos"] });
  });
});
