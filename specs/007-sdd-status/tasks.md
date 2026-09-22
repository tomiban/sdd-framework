# Tasks — Spec 007 `sdd status`

> Orden de dependencia obligatorio. Cada tarea deja `pnpm test`, `pnpm run typecheck` y
> `pnpm run build` en verde.

## T1 — `statusReport` + mensajes + tests

**RF:** RF-1…RF-5 · QA A1-A6 · D1-D3

- `src/lib/status.ts`: `isSpecReady` (puro) y `statusReport` con el bloque exacto (estructura desde
  el manifiesto, constitución, AGENTS.md, una línea por spec con conteos, resumen con plurales).
- Mensajes nuevos (D2) y `statusUsageError`.
- Tests `tests/status.test.ts` + `tests/messages.test.ts` (CL-1…CL-6).

**Hecho cuando:**
- [x] El bloque del RF-1 coincide byte a byte sobre fixtures de tmp dir
- [x] CL-1…CL-6 cubiertos con exitCode correcto
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T2 — Dispatch + RF-6 + E2E

**RF:** RF-5 · RF-6 · criterios 1-3

- Dispatch `status` en `src/index.ts`; `unknownCommandError` con la lista de comandos ampliada
  (RF-6) y su test.
- E2E manual: `status` en este repo (7 specs, todo ✓), en directorio vacío y parcial; `status foo`;
  comando desconocido.

**Hecho cuando:**
- [x] `node dist/index.js status` en este repo emite el bloque exacto con `$? == 0`
- [x] Vacío/parcial/args/comando desconocido verificados con `$?` correcto
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde