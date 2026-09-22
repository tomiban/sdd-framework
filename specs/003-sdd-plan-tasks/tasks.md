# Tasks — Spec 003 `sdd plan` y `sdd tasks`

> Orden de dependencia obligatorio. Cada tarea deja `pnpm test`, `pnpm run typecheck` y
> `pnpm run build` en verde. Rama sugerida: `feat/003-sdd-plan-tasks`.

## T1 — Lógica pura de ids de spec

**RF:** RF-3 · RF-4 · CL-2 · CL-3 · CL-4 · CL-10 · QA A2/A3 · NFR-3

- Extender `src/lib/spec.ts` con `parseSpecId(input)` (1–3 dígitos → normalizado a 3 con
  `padStart`; `null` para `0021`, `3a`, `x`, `-1`, `0x2`, `002-slug`, vacío) y
  `findSpecDir(entries, nnn)` (único → `ok`; ninguno → `missing`; varios → `ambiguous` con la lista;
  ignora nombres sin prefijo `NNN-`).
- Tests `tests/spec.test.ts` (+): CL-2 completo, padding (`3` → `003`), unicidad y ambigüedad.

**Hecho cuando:**
- [x] `parseSpecId` normaliza y rechaza según el CL-2 sobre un fixture de casos
- [x] `findSpecDir` distingue único / missing / ambiguous y lista los candidatos
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T2 — Plantillas de fase + manifiesto por fase

**RF:** RF-1 · RF-2 · NFR-4 · NFR-7 · QA A10 · constitución #3

- Crear `templates/plan.md` (secciones: cambios de persistencia · resolución de ambigüedades ·
  decisiones técnicas · modelo de datos y contratos · estrategia de tests · cobertura) y
  `templates/tasks.md` (bloque de tarea con `**RF:**` y `**Hecho cuando:**`), en castellano y con
  marcadores listos para rellenar; sin interpolación.
- Actualizar `src/lib/templates.ts`: `TemplateEntry` con `phase`, `TEMPLATES` con las tres entradas
  (`new → spec.md`, `plan → plan.md`, `tasks → tasks.md`) y `templatesFor(phase)`; adaptar
  `src/lib/new.ts` para copiar solo `templatesFor("new")`; `findTemplate` desaparece (A10).
- Tests `tests/templates.test.ts` (+): selección por fase, existencia y secciones de cada plantilla.

**Hecho cuando:**
- [x] `templates/plan.md` y `templates/tasks.md` existen con sus secciones
- [x] `templatesFor` devuelve exactamente la entrada de cada fase y `sdd new` solo copia `spec.md`
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T3 — `createPhaseFile` + mensajes (renombrado A7)

**RF:** RF-3…RF-11 · QA A1/A5/A7/A8/A9 · NFR-2 · NFR-5

- Renombrar mensajes compartidos (A7): `newNotInitialized` → `notInitializedError`,
  `newExists` → `existsError`, `newWriteError` → `createFileError`, `newCreatedFile` →
  `fileCreatedLine` (textos idénticos; actualizar usos y tests 001/002).
- Añadir mensajes de fase (D5): `phaseMissingId`, `phaseExtraArgs`, `phaseInvalidId`,
  `specNotFound`, `specAmbiguous`, `missingSpecFile`, `missingPlanFile`, `phaseTitle`,
  `phaseSuccess`.
- Crear `src/lib/phases.ts`: `PHASE_FILES`, `PHASE_PREREQS` y `createPhaseFile({ root, phase, args,
  templatePath? })` con el orden de QA A1, rollback del destino parcial (QA A5, D7) y salida exacta
  del RF-9.
- Tests `tests/phases.test.ts` (integración en tmp dirs): todo el plan §4, incluidos CL-5, CL-6
  (barra final según tipo), CL-7, CL-8 (skip root), CL-9 (rollback) y CL-11.

**Hecho cuando:**
- [x] `createPhaseFile` crea `plan.md`/`tasks.md` byte a byte igual a su plantilla y respeta los
  prerequisitos del flujo (CL-5)
- [x] Fallo de copia → rollback del destino y error con ruta (verificado en tmp dirs)
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T4 — CLI: dispatch `plan`/`tasks` + RF-12 + verificación manual

**RF:** RF-5 · RF-11 · RF-12 · QA A6 · NFR-2

- En `src/index.ts`: dispatch de `plan <NNN>` y `tasks <NNN>` vía `createPhaseFile`; actualizar
  `unknownCommandError` al texto del RF-12 y sus tests (`tests/messages.test.ts`,
  `tests/init.test.ts`) (QA A6).
- Verificación manual (criterios 1–4) con el binario en tmp dir: `plan 002` sobre spec existente →
  bloque RF-9 exacto + `$? == 0`; `tasks 002` → idem; repetir → «ya existe» + `$? == 1` sin
  sobrescribir (checksum); `tasks` sin plan → error que sugiere `sdd plan 002`; `plan` sin spec →
  error de flujo; ids inválidos/desconocidos/ambiguos y args extra → errores + `$? == 1` sin crear
  nada; comando desconocido → RF-12.

**Hecho cuando:**
- [x] `node dist/index.js plan <NNN>` y `tasks <NNN>` reproducen la salida del RF-9 con `$? == 0`
- [x] Casos de error → stderr + `$? == 1` sin crear nada, y comando desconocido muestra el texto RF-12
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde