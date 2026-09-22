# Plan — Spec 001 `sdd init`

## Cambios de persistencia

Ninguno. `sdd init` solo crea directorios en el cwd; no hay base de datos, storage ni archivos de
configuración persistente. *(No aplica la tabla de persistencia del flujo gastos-casa.)*

## Resoluciones del QA

| # | Resolución adoptada | RF |
|---|---------------------|----|
| A1 | Modo de salida: si se creó ≥1 elemento, se listan los 6 elementos en orden canónico con su estado por elemento; si no se creó nada, se listan solo los 3 directorios raíz con "ya existe". | RF-5, RF-6, RF-7 |
| A2 | La detección de conflictos (archivo con nombre de elemento) se aplica a TODOS los elementos de la estructura (raíz y sub), no solo a los que se crearían. | RF-9 |
| A3 | Precondiciones en orden fijo: 1) argumentos no soportados → error; 2) conflictos de archivo → error; 3) escribibilidad (solo si hay algo que crear) → error; 4) creación; 5) salida. | RF-8, RF-9, RF-10 |
| A4 | Error de argumentos: mensaje en castellano en stderr con `Uso: sdd init`, código 1, sin crear nada. | RF-10 |
| A5 | La comprobación de escritura del cwd es prerrequisito SOLO si hay elementos a crear; si ya está todo inicializado no se comprueba (no hay escrituras). | RF-8 |
| A6 | Código de salida de error único: 1 (argumentos, conflicto, no escribible, error de fs inesperado). Éxito: 0. | RF-8…RF-11 |
| A7 | Fallo a mitad de creación: sin rollback; mensaje de error con la ruta que falló en stderr, código 1; los directorios ya creados se conservan (la siguiente ejecución los detecta y continúa). | RF-11, NFR-4 |
| A8 | stdout para salida informativa/éxito; stderr para errores. | RF-5…RF-10 |
| A9 | `sdd init` no valida que el cwd sea un proyecto Node (no exige `package.json`). | RF-1, CL-7 |
| A10 | Los strings de salida (castellano) viven en un único módulo `src/lib/messages.ts`; los tests comparan contra bloques exactos. | NFR-2, NFR-3, RF-5/6/7 |
| A11 | La estructura SDD vive en un manifiesto único `src/lib/structure.ts` (nombre + hijos); es la única fuente de los nombres y el orden. | Constitución #3, criterio 4 |
| A12 | El CLI (`src/index.ts`) es una capa delgada: parsea argv, delega en `src/lib/init.ts` e imprime; sin lógica de negocio. | RF-1, NFR-3 |

## Decisiones técnicas

- **D1** *(A9, CL-7)* — `sdd init` no exige marcadores de proyecto Node (`package.json`); opera sobre
  cualquier cwd. Se decide porque el objetivo es que la estructura SDD pueda inicializarse antes de
  generar el proyecto. Cubre RF-1, CL-7.
- **D2** *(A10)* — Módulo `src/lib/messages.ts` con funciones puras que devuelven las líneas exactas:
  `initTitle()`, `createdLine(path)`, `existsLine(path)`, `successMessage(createdAny)`,
  `usageError()`, `conflictError(path)`, `writeError(path)`. Sin estado; reciben parámetros. Cubre
  RF-5/6/7, NFR-2.
- **D3** *(A1)* — En `src/lib/state.ts`, `detectInitState(root)` devuelve por cada elemento de la
  estructura `missing | exists | conflict` (no distingue creado aquí; el estado `created` lo calcula
  `initialize` al resolver qué faltaba y crearlo). Cubre RF-2, RF-3, RF-4, RF-9.
- **D4** *(A2)* — La detección de estado recorre los 6 elementos (raíz + sub). Un elemento está en
  `conflict` si existe en el fs como fichero (no directorio). Cubre RF-9.
- **D5** *(A3)* — `src/lib/init.ts` expone `initialize(opts: { root: string; argv: string[] })` →
  `InitResult` con precondiciones en el orden del QA A3 y creación en orden canónico del manifiesto.
  Cubre RF-3…RF-11.
- **D6** *(A5, A6, A7)* — `initialize` distingue `ok` (con `lines` y `exitCode 0`) de `error` (con
  `message`, `exitCode 1`). La creación es best-effort por elemento: ante fallo de fs reporta la ruta
  que falló. Cubre RF-8, RF-11.
- **D7** *(A12)* — `src/index.ts`: `#!/usr/bin/env node`; lee `process.argv.slice(2)`; si hay
  argumentos → error de uso (stderr, código 1); si no, `initialize({ root: process.cwd(), argv })`,
  imprime líneas a stdout y fija `process.exitCode`. Cubre RF-1, RF-10, RF-11.
- **D8** — Nombres de elemento con slash final en la salida (`docs/`, `.opencode/agents/`):
  el manifiesto guarda nombres sin slash y el formateo añade `/`. El carácter `…` (U+2026) se usa
  literal en el título. Cubre RF-5/6, CL-8.

## Modelo de datos (JSON)

```jsonc
// Estructura canónica (única fuente, src/lib/structure.ts)
{
  "SDD_STRUCTURE": [
    { "name": "docs", "children": [] },
    { "name": "specs", "children": [] },
    { "name": ".opencode", "children": ["agents", "commands", "skills"] }
  ]
}

// Estado por elemento (src/lib/state.ts)
{
  "ElementStatus": "missing" | "exists" | "conflict",
  "Element": { "name": "string", "path": "string" /* ruta relativa: docs, .opencode/agents */ },
  "InitState": { "elements": [{ "name", "path", "status" }], "hasConflict": "boolean" }
}

// Resultado (src/lib/init.ts)
{
  "InitResult":
    { "ok": true,  "lines": ["string" /* lineas exactas a stdout */], "exitCode": 0 }
    | { "ok": false, "message": "string" /* a stderr */, "exitCode": 1 }
}
```

## Estrategia de tests

- Framework: Vitest (config `vitest.config.ts`, entorno node, include `tests/**/*.test.ts`).
- Técnica de aislamiento: directorios temporales reales creados con
  `fs.mkdtemp(path.join(os.tmpdir(), "sdd-init-"))` y limpiados en `afterEach` (`rm` recursivo). Sin
  mocks de fs: la lógica es pura en paths y se testea contra el fs real.
- Casos de permisos: simular cwd no escribible con `chmod 0o555` sobre el directorio temporal
  (skip si el test corre como root).
- Salidas: comparaciones exactas contra los bloques literales de la spec (incluido `…` U+2026).
- Cobertura:

| RF | Módulo | Test |
|----|--------|------|
| RF-1 | `src/index.ts` (T4) | manual/CLI |
| RF-2, RF-3, RF-4 | `src/lib/state.ts` | `tests/state.test.ts` |
| RF-5, RF-6, RF-7 | `src/lib/messages.ts` + `src/lib/init.ts` | `tests/messages.test.ts`, `tests/init.test.ts` |
| RF-8 | `src/lib/init.ts` | `tests/init.test.ts` (permisos) |
| RF-9 | `src/lib/state.ts` + `src/lib/init.ts` | `tests/state.test.ts`, `tests/init.test.ts` |
| RF-10, RF-11 | `src/index.ts` (T4) / `src/lib/init.ts` | `tests/init.test.ts`, CLI (T4) |
| NFR-2 | `src/lib/messages.ts` | `tests/messages.test.ts` |
| NFR-4 | `src/lib/init.ts` | `tests/init.test.ts` (doble ejecución) |

## Cobertura RF ─┬─ total

Todos los RF (RF-1…RF-11) quedan cubiertos por las tareas T1–T4 (ver `tasks.md`).