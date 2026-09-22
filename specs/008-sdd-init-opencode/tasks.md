# Tasks — Spec 008 `sdd init` popula `.opencode/`

> Orden de dependencia obligatorio. Cada tarea deja `pnpm test`, `pnpm run typecheck` y
> `pnpm run build` en verde.

## T1 — Masters en `templates/opencode/` + `kind: "tree"` + sincronía

**RF:** RF-1 · NFR-1 · QA A2/A3 · D1 · D2 · D4

- Copiar `.opencode/{agents,commands,skills}` → `templates/opencode/` (masters).
- `TemplateEntry.kind` + entrada tree de init en el manifiesto.
- Test de sincronía recursivo `templates/opencode/` ≡ `.opencode/` y del manifiesto.

**Hecho cuando:**
- [x] `templates/opencode/` contiene los 7 agentes, 8 comandos y la skill
- [x] El test de sincronía falla si un byte difiere entre ambos árboles
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T2 — Copia en `initialize` + tests + E2E del piloto

**RF:** RF-2…RF-4 · QA A1/A4/A5 · D3 · criterios 1-2

- `src/lib/init.ts`: resolución de `kind: "tree"` (recorrido recursivo, solo ausentes, rollback por
  archivo) y `createdAny` ampliado; bloques de salida sin cambios.
- Tests CL-1…CL-4 (fixtures de estado completo vía `initialize()` previo).
- E2E: `/tmp/piloto` → `init` deja `.opencode/` poblado == `templates/opencode/`; segunda pasada sin
  cambios; con archivo del usuario → conservado.

**Hecho cuando:**
- [x] El piloto queda con `.opencode/` completo y byte a byte igual al árbol master
- [x] `init` repetido no modifica nada (checksums) y conserva archivos previos
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde