import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { detectInitState, fileStatus, type ElementState } from "../src/lib/state.js";

const ALL_PATHS = [
  "docs",
  "specs",
  ".opencode",
  ".opencode/agents",
  ".opencode/commands",
  ".opencode/skills",
] as const;

function statuses(elements: readonly ElementState[]): [string, string][] {
  return elements.map((element) => [element.path, element.status]);
}

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "sdd-init-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("detectInitState", () => {
  it("estructura vacía: todo missing, sin conflictos", async () => {
    const state = await detectInitState(root);

    expect(state.hasConflict).toBe(false);
    expect(statuses(state.elements)).toEqual([
      ["docs", "missing"],
      ["specs", "missing"],
      [".opencode", "missing"],
      [".opencode/agents", "missing"],
      [".opencode/commands", "missing"],
      [".opencode/skills", "missing"],
    ]);
  });

  it("los 6 directorios existen: todo exists, sin conflictos", async () => {
    for (const path of ALL_PATHS) {
      await mkdir(join(root, path));
    }

    const state = await detectInitState(root);

    expect(state.hasConflict).toBe(false);
    expect(state.elements.every((element) => element.status === "exists")).toBe(
      true,
    );
  });

  it("raíces sin subdirectorios: estados mixtos", async () => {
    await mkdir(join(root, "docs"));
    await mkdir(join(root, ".opencode"));

    const state = await detectInitState(root);

    expect(statuses(state.elements)).toEqual([
      ["docs", "exists"],
      ["specs", "missing"],
      [".opencode", "exists"],
      [".opencode/agents", "missing"],
      [".opencode/commands", "missing"],
      [".opencode/skills", "missing"],
    ]);
    expect(state.hasConflict).toBe(false);
  });

  it("archivo en lugar de directorio: conflict en ese elemento", async () => {
    await mkdir(join(root, ".opencode"));
    await writeFile(join(root, ".opencode", "agents"), "");

    const state = await detectInitState(root);

    expect(statuses(state.elements)).toEqual([
      ["docs", "missing"],
      ["specs", "missing"],
      [".opencode", "exists"],
      [".opencode/agents", "conflict"],
      [".opencode/commands", "missing"],
      [".opencode/skills", "missing"],
    ]);
    expect(state.hasConflict).toBe(true);
  });

  it("archivo llamado docs en la raíz: conflict (RF-9)", async () => {
    await writeFile(join(root, "docs"), "");

    const state = await detectInitState(root);

    expect(state.elements[0]?.status).toBe("conflict");
    expect(state.hasConflict).toBe(true);
  });

  it("un subdirectorio existente sin .opencode raíz se detecta como exists", async () => {
    await mkdir(join(root, ".opencode/agents"), { recursive: true });

    const state = await detectInitState(root);

    expect(state.elements[2]?.status).toBe("exists");
    expect(state.elements[3]?.status).toBe("exists");
    expect(state.hasConflict).toBe(false);
  });
});

describe("fileStatus (spec 005)", () => {
  it("distingue missing / exists / conflict sobre archivo y directorio", async () => {
    expect(await fileStatus(join(root, "constitution.md"))).toBe("missing");

    await writeFile(join(root, "constitution.md"), "principios");
    expect(await fileStatus(join(root, "constitution.md"))).toBe("exists");

    await mkdir(join(root, "agents"));
    expect(await fileStatus(join(root, "agents"))).toBe("conflict");
  });
});