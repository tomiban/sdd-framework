import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { configInvalid, configMissing } from "./messages.js";

/**
 * Parseo puro de `sdd.json` (spec 004): exige `verify`, lista de 1 o más
 * comandos (strings no vacíos); los campos extra se ignoran (CL-3).
 */
export type ParseConfigResult =
  | { readonly ok: true; readonly commands: readonly string[] }
  | { readonly ok: false; readonly detail: string };

export function parseVerifyConfig(text: string): ParseConfigResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, detail: "JSON malformado" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, detail: "debe ser un objeto con la clave verify" };
  }
  const verify = (parsed as { verify?: unknown }).verify;
  if (!Array.isArray(verify)) {
    return { ok: false, detail: "verify debe ser una lista de comandos" };
  }
  if (verify.length === 0) {
    return { ok: false, detail: "verify no puede estar vacío" };
  }
  if (!verify.every((command) => typeof command === "string" && command.trim() !== "")) {
    return { ok: false, detail: "verify debe contener comandos no vacíos" };
  }
  return { ok: true, commands: verify as string[] };
}

export type ReadConfigResult =
  | { readonly ok: true; readonly commands: readonly string[] }
  | { readonly ok: false; readonly message: string };

/** Lee `sdd.json` de la raíz del proyecto (RF-4). */
export async function readVerifyConfig(root: string): Promise<ReadConfigResult> {
  let text: string;
  try {
    text = await readFile(join(root, "sdd.json"), "utf8");
  } catch {
    return { ok: false, message: configMissing() };
  }
  const parsed = parseVerifyConfig(text);
  if (!parsed.ok) {
    return { ok: false, message: configInvalid(parsed.detail) };
  }
  return { ok: true, commands: parsed.commands };
}
