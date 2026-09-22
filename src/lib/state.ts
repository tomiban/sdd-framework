import { stat } from "node:fs/promises";
import { join } from "node:path";

import { flattenStructure, type FlatElement } from "./structure.js";

export type ElementStatus = "missing" | "exists" | "conflict";

export interface ElementState extends FlatElement {
  readonly status: ElementStatus;
}

export interface InitState {
  readonly elements: readonly ElementState[];
  readonly hasConflict: boolean;
}

async function elementStatus(absolutePath: string): Promise<ElementStatus> {
  try {
    const info = await stat(absolutePath);
    return info.isDirectory() ? "exists" : "conflict";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "missing";
    }
    throw error;
  }
}

/**
 * Detecta el estado de inicialización (RF-2): para cada elemento de la
 * estructura indica si `missing` (no existe), `exists` (es directorio) o
 * `conflict` (existe pero NO es directorio, p. ej. un archivo llamado `docs`).
 * Recorre los 6 elementos, raíz y subdirectorios (QA A2).
 */
export async function detectInitState(root: string): Promise<InitState> {
  const elements: ElementState[] = [];
  for (const element of flattenStructure()) {
    const status = await elementStatus(join(root, element.path));
    elements.push({ ...element, status });
  }
  return {
    elements,
    hasConflict: elements.some((element) => element.status === "conflict"),
  };
}