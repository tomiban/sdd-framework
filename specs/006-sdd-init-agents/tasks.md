# Tasks — Spec 006 `sdd init` crea `AGENTS.md`

> Orden de dependencia obligatorio. Cada tarea deja `pnpm test`, `pnpm run typecheck` y
> `pnpm run build` en verde.

## T1 — `templates/agents.md` + manifiesto + sincronía

**RF:** RF-1 · NFR-2 · QA A2 · D1 · D2

- Crear `templates/agents.md` (título, descripción, conventions, pitfalls, `## Reglas` con 3 reglas
  — la primera es la línea de `agents-rule.md` — y marcas `<…>`).
- Añadir la entrada `{ phase: "init", dest: "AGENTS.md", source: "agents.md" }` al manifiesto.
- Tests `tests/templates.test.ts` (+): entrada, `## Reglas` y sincronía exacta con
  `agents-rule.md`.

**Hecho cuando:**
- [x] `templates/agents.md` contiene la línea exacta de `agents-rule.md` en `## Reglas`
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T2 — `initialize` crea `AGENTS.md` + bloques exactos + tests

**RF:** RF-2…RF-5 · QA A1/A3/A4/A5/A6 · D3 · D4

- `src/lib/init.ts`: `AgentsStatus` con `created`, bucle de plantillas que copia las faltantes con
  rollback por archivo, `createdAny` ampliado y línea `✓ Creado AGENTS.md`.
- Tests `tests/init.test.ts`: bloques exactos del RF-3 (FIRST_RUN con AGENTS creado, variante con
  regla añadida, variante «ya cita», SECOND_RUN) + CL-1…CL-5 (byte a byte, checksum, vacío,
  directorio, rollback).

**Hecho cuando:**
- [x] Los bloques del RF-3 salen byte a byte y `AGENTS.md` creado es idéntico al template
- [x] `init` repetido no modifica nada (checksum de `AGENTS.md` y la constitución)
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde