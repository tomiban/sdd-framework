export interface StructureNode {
  readonly name: string;
  readonly children: readonly string[];
}

export interface FlatElement {
  /** Nombre propio del elemento: `docs`, `agents`, ... */
  readonly name: string;
  /** Ruta relativa al cwd: `docs`, `.opencode/agents`, ... */
  readonly path: string;
}

/**
 * Manifiesto único de la estructura SDD (constitución #3): la única fuente de
 * nombres y orden para la inicialización.
 */
export const SDD_STRUCTURE: readonly StructureNode[] = [
  { name: "docs", children: [] },
  { name: "specs", children: [] },
  { name: ".opencode", children: ["agents", "commands", "skills"] },
] as const;

/**
 * Aplana la estructura en el orden canónico de inicialización:
 * `docs`, `specs`, `.opencode`, `.opencode/agents`, `.opencode/commands`,
 * `.opencode/skills`.
 */
export function flattenStructure(): FlatElement[] {
  const elements: FlatElement[] = [];
  for (const node of SDD_STRUCTURE) {
    elements.push({ name: node.name, path: node.name });
    for (const child of node.children) {
      elements.push({ name: child, path: `${node.name}/${child}` });
    }
  }
  return elements;
}