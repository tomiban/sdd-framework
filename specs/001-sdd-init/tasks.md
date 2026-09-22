# Tasks — Spec 001 `sdd init`

> Orden de dependencia obligatorio. Cada tarea deja `pnpm test`, `pnpm run typecheck` y
> `pnpm run build` en verde. Nombre de rama sugerido: `feat/001-sdd-init`.

## T1 — Manifiesto de estructura + detección de estado

**RF:** RF-2 · RF-3 · RF-4 · RF-9 · criterio de finalización 4 (constitución #3)

- Crear `src/lib/structure.ts`: manifiesto único `SDD_STRUCTURE` con los 6 elementos en orden
  canónico (`docs`, `specs`, `.opencode` → `agents`, `commands`, `skills`) y helper
  `flattenStructure()` que devuelve la lista aplanada `[{ name, path }]` (paths relativos:
  `docs`, `.opencode/agents`, …).
- Crear `src/lib/state.ts`: `detectInitState(root)` que devuelve por elemento `missing` (no existe),
  `exists` (existe y es directorio) o `conflict` (existe y NO es directorio), además de
  `hasConflict`.
- Tests `tests/structure.test.ts` y `tests/state.test.ts` usando directorios temporales reales
  (`mkdtemp` en `os.tmpdir()`): estructura vacía → todo `missing`; completa (los 6 como directorios)
  → todo `exists` y `hasConflict=false`; `.opencode/agents` como archivo → `conflict` y
  `hasConflict=true`; raíz existente sin subdirectorios → estados mixtos.

**Hecho cuando:**
- [x] `flattenStructure()` devuelve 6 elementos en el orden canónico con sus paths relativos
- [x] `detectInitState` distingue `missing`/`exists`/`conflict` en directorios temporales reales
  (vacío, completo, parcial y con conflicto de archivo)
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T2 — Mensajes en castellano (módulo único)

**RF:** RF-5 · RF-6 · RF-7 · NFR-2 · resolución QA A10 · CL-8

- Crear `src/lib/messages.ts` con funciones puras para las líneas exactas (castellano, `…` U+2026
  literal): `initTitle()`, `createdLine(path)`, `existsLine(path)`, `successMessage(createdAny)`,
  `usageError()`, `conflictError(path)`, `writeError(path)`.
- Las rutas llevan `/` final (`docs/`, `.opencode/agents/`).
- Tests `tests/messages.test.ts` comparando contra los bloques literales de la spec (primera y
  segunda ejecución).

**Hecho cuando:**
- [x] Todos los strings visibles viven en `src/lib/messages.ts` (sin literales de texto en otros
  módulos)
- [x] Los bloques exactos de la spec (RF-5 y RF-6) se reproducen concatenando las funciones
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T3 — Lógica de inicialización

**RF:** RF-3 · RF-4 · RF-8 · RF-9 · RF-11 · resoluciones QA A2/A3/A5/A6/A7 · NFR-4

- Crear `src/lib/init.ts` con `initialize(opts)` que:
  1. Rechaza argumentos no soportados (error de uso) — depende de T4 solo para el wiring; aquí se
     acepta `argv` como parámetro.
  2. Detecta estado; si hay `conflict` → `{ ok: false, message: conflictError(ruta), exitCode: 1 }`.
  3. Determina si hay algo que crear; si lo hay, comprueba que el cwd es escribible →
     `writeError` si no.
  4. Crea solo lo que falta en orden canónico (best-effort por elemento; fallo de fs → error con la
     ruta que falló, sin rollback).
  5. Devuelve `InitResult` con las líneas exactas (modo creación con 6 líneas si creó algo; modo
     "ya inicializado" con solo los 3 raíz si no creó nada).
  - No escribe nada si hay precondición fallida; no re-crea elementos existentes.
- Tests `tests/init.test.ts` con tmp dirs: inicialización completa → se crean los 6, líneas exactas,
  `exitCode 0`, `ok: true`; doble inicialización → segunda sin crear, modo "ya inicializado",
  `exitCode 0`; parcial (solo `docs/` y solo `.opencode/` sin subs) → crea solo faltantes con líneas
  mixtas; conflicto de archivo → `ok: false`, ruta en mensaje, `exitCode 1`, nada creado; cwd no
  escribible (chmod 0o555, skip si root) → `ok: false`, `exitCode 1`, nada creado; ya inicializado →
  no comprueba escritura (funciona con cwd de solo lectura).

**Hecho cuando:**
- [x] `initialize` crea solo lo que falta y respeta lo existente (verificado en tmp dirs)
- [x] Precondiciones en orden del QA A3: argumentos → conflicto → escribibilidad (solo si hay algo
  que crear)
- [x] Segunda ejecución consecutiva → `ok: true`, `exitCode 0`, sin efectos destructivos (NFR-4)
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T4 — CLI, salida y binario

**RF:** RF-1 · RF-10 · RF-11 · NFR-2 · resolución QA A8/A12 · criterios 1 y 3

- Reemplazar el scaffold de `src/index.ts`: shebang `#!/usr/bin/env node`; leer `process.argv.slice(2)`
  → si hay argumentos, imprimir `usageError()` en stderr y `process.exitCode = 1`; si no, llamar a
  `initialize({ root: process.cwd(), argv })`, imprimir `lines` a stdout, o `message` a stderr en
  caso de error; fijar `process.exitCode` del resultado.
- Verificación manual (criterios 1 y 3) en un directorio temporal:
  - `node dist/index.js init` → salida exacta RF-5 y `$? == 0`; repetir → salida RF-6 y `$? == 0`.
  - `node dist/index.js init --foo` → error de uso en stderr y `$? == 1`, sin crear nada.
  - `node dist/index.js` sin argumentos → tratar como `init` (comando por defecto) o error; elegir y
    documentar en el código (decisión D9: el comando por defecto del CLI es `init`).

**Hecho cuando:**
- [x] `node dist/index.js init` reproduce exactamente los bloques RF-5 y RF-6 con `$? == 0` (doble
  ejecución)
- [x] Argumentos extra → stderr + `$? == 1` sin crear nada
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde