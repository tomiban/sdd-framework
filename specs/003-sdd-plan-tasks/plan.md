# Plan — Spec 003 `sdd plan` y `sdd tasks`

## 0. Cambios de persistencia derivados de la spec

Ninguno (sdd no persiste datos). Los comandos escriben en `specs/` del cwd: contenido del
proyecto, no persistencia de la aplicación.

## 1. Resolución de ambigüedades (revisión QA de la spec)

| # | Ambigüedad / hallazgo | Resolución | RF |
|---|------------------------|------------|----|
| A1 | Orden de precondiciones sin definir entre sí | Orden fijo: 1) sin argumento/args extra → uso; 2) id inválido → formato; 3) `specs/` inexistente o no directorio → sugerir `sdd init`; 4) spec inexistente o ambigua → error; 5) prerequisitos de fase (spec → plan); 6) destino existente → «ya existe»; 7) copiar con rollback. | RF-3…RF-8 |
| A2 | Formato del id: ¿nombre completo, slug, número? | Solo número de 1–3 dígitos, normalizado a 3 (`3` → `003`). El nombre completo `NNN-slug` se rechaza con error de formato que muestra la regla. | RF-3, RF-4, CL-2, CL-4 |
| A3 | Varias specs con el mismo número (creadas a mano) | Error de ambigüedad que lista los directorios; nunca se elige uno implícitamente. | RF-3, CL-3 |
| A4 | ¿Qué marca que una fase existe? | La existencia del **archivo** de esa fase (`spec.md`, `plan.md`, `tasks.md`). Prerequisitos por fase: `plan` exige `spec.md`; `tasks` exige `spec.md` y `plan.md`, comprobados en ese orden (falla por lo más fundamental primero). | RF-7, CL-5 |
| A5 | Fallo de copia: ¿qué se limpia? | Rollback del **archivo destino** que este comando haya empezado a escribir (no hay directorio propio: el directorio de la spec ya existía). Si el rollback falla, se reporta el error original. | RF-10, CL-9 |
| A6 | RF-12 cambia el mensaje de comando desconocido fijado por la spec 001 | Se actualiza el mensaje y los tests de la 001 que lo asertaban (los tests son código, evolucionan). La spec 001 no se modifica: queda como histórico y la 003 documenta la sustitución. | RF-12 |
| A7 | Mensajería compartida con nombres `new*` (`newNotInitialized`, `newExists`, `newWriteError`, `newCreatedFile`) usada ahora por más comandos | Renombrado neutro: `notInitializedError`, `existsError(path, isDirectory?)`, `createFileError(path, detail)`, `fileCreatedLine(path)`. Se actualizan las referencias de los tests 001/002; los textos no cambian (salvo RF-12). | NFR-2 |
| A8 | ¿`createPhaseFile` valida también los argumentos? | Sí, mismo orden de A1 (defensa en profundidad además del dispatch del CLI) y acepta `templatePath` inyectable para testear el fallo de copia (CL-9). | RF-4, RF-5, RF-10 |
| A9 | Título y mensaje final difieren por fase («plan» vs «tareas») | Mensajes derivados del tipo `Phase` (`"plan" \| "tasks"`): `phaseTitle`, `phaseSuccess`; el nombre de archivo sale de la config de fases. | RF-9 |
| A10 | El manifiesto `TEMPLATES` de la 002 copiaba **todas** sus entradas en `sdd new` | Cada entrada se etiqueta por fase y `templatesFor(phase)` selecciona: `new` → `spec.md`, `plan` → `plan.md`, `tasks` → `tasks.md`. `sdd new` deja de copiar entradas ajenas. Contrato `findTemplate(dest)` → `templatesFor(phase)` (lección H2 de la 002: se refleja aquí y en tasks). | RF-1, RF-2, NFR-7 |
| A11 | `sdd plan 000` u otros números sin spec | `000` es un id válido; no existe ninguna spec `000-*` → error «no existe la spec 000» (no se inventa ni se desborda). | RF-3, CL-10 |

## 2. Decisiones técnicas

- **D1** — Dispatch en `src/index.ts`: `init` (por defecto, D9 de la spec 001), `new <slug>`,
  `plan <NNN>`, `tasks <NNN>`; el resto → RF-12 con la lista de comandos. Cubre RF-5, RF-11, RF-12.
- **D2** — Lógica pura en `src/lib/spec.ts` (extensión): `parseSpecId(input)` → `"003"` normalizado
  o `null` si no matchea `^\d{1,3}$`; `findSpecDir(entries, nnn)` → `{ ok, dir }` |
  `{ ok: false, reason: "missing" | "ambiguous", matches }` filtrando `^NNN-`. Cubre RF-3, RF-4,
  CL-2, CL-3, CL-4, CL-10.
- **D3** — Manifiesto por fase (constitución #3): `TemplateEntry { phase, dest, source }` en
  `src/lib/templates.ts` con `templatesFor(phase)`; `resolveTemplateSource(source)` se mantiene
  (relativo al paquete, A4 de la spec 002). Cubre RF-1, RF-2, NFR-4, NFR-7.
- **D4** — `src/lib/phases.ts`: `PHASE_FILES` (`plan → plan.md`, `tasks → tasks.md`) y
  `PHASE_PREREQS` (`plan → [spec.md]`, `tasks → [spec.md, plan.md]`) declarativos, y
  `createPhaseFile({ root, phase, args, templatePath? })` → `PhaseResult` (mismo shape que
  `NewResult`) siguiendo A1 y rollback A5. Cubre RF-1…RF-11.
- **D5** — Mensajes en `src/lib/messages.ts` (módulo único): renombrado A7 + nuevos
  `phaseMissingId(cmd)`, `phaseExtraArgs(cmd)`, `phaseInvalidId(cmd, id)`, `specNotFound(nnn)`,
  `specAmbiguous(nnn, names)`, `missingSpecFile(path)`, `missingPlanFile(path, nnn)`,
  `phaseTitle(phase)`, `phaseSuccess(phase, path)`, y `unknownCommandError` con el texto RF-12.
  Cubre RF-4…RF-9, RF-12, NFR-2.
- **D6** — Los prerequisitos se recorren en orden del flujo: para el primer archivo ausente se
  emite `missingSpecFile` si es `spec.md` o `missingPlanFile` (con `sdd plan NNN`) si es `plan.md`;
  añadir una fase futura = fila en `PHASE_PREREQS` + mensajes (NFR-7). Cubre RF-7, CL-5.
- **D7** — Rollback de copia: `rm(dest, { force: true })` del archivo destino parcial (A5); verificado
  con `templatePath` inyectable. Cubre RF-10, CL-9.

## 3. Modelo de datos y contratos

```jsonc
// src/lib/spec.ts (además de lo existente)
{
  "parseSpecId(input): string | null"   // "3" → "003"; "0021" | "x" | "002-slug" → null
  // findSpecDir(entries, nnn):
  //   { ok: true,  dir: "002-sdd-new" }
  // | { ok: false, reason: "missing",   matches: [] }
  // | { ok: false, reason: "ambiguous", matches: ["002-a", "002-b"] }
}

// src/lib/templates.ts (sustituye a findTemplate)
{
  "TemplatePhase": "new" | "plan" | "tasks",
  "TemplateEntry": { "phase": "TemplatePhase", "dest": "spec.md", "source": "spec.md" },
  "TEMPLATES": [ new → spec.md, plan → plan.md, tasks → tasks.md ],
  "templatesFor(phase): readonly TemplateEntry[]",
  "resolveTemplateSource(source): URL"  // new URL("../../templates/<source>", import.meta.url)
}

// src/lib/phases.ts
{
  "Phase": "plan" | "tasks",
  "PHASE_FILES":   { "plan": "plan.md",   "tasks": "tasks.md" },
  "PHASE_PREREQS": { "plan": ["spec.md"], "tasks": ["spec.md", "plan.md"] },
  // createPhaseFile({ root, phase, args, templatePath? }): Promise<PhaseResult>
  "PhaseResult":
    { "ok": true,  "lines": ["Creando plan…", "", "✓ Creado specs/NNN-<slug>/plan.md",
                            "", "Plan creado: specs/NNN-<slug>/plan.md"], "exitCode": 0 }
  | { "ok": false, "message": "Error: …\\nUso: sdd plan <NNN>", "exitCode": 1 }
}
```

## 4. Estrategia de tests

- Directorios temporales reales (`mkdtemp`), como en specs 001/002; `templatePath` inyectable para
  CL-9; `it.skipIf(root)` para permisos (CL-8).
- `tests/spec.test.ts` (+): `parseSpecId` (CL-2 completo, CL-4) y `findSpecDir` (único, missing,
  ambiguous, ignora archivos sueltos).
- `tests/templates.test.ts` (+): `templatesFor` por fase; cada source existe y contiene sus
  secciones (plan: persistencia, ambigüedades, decisiones, contratos, tests, cobertura; tasks:
  bloque `## T1 —`, `**RF:**`, `**Hecho cuando:**`); `sdd new` solo recibe `spec.md` (A10).
- `tests/phases.test.ts` (nuevo, integración): plan OK (byte a byte + líneas exactas RF-9); tasks OK
  tras plan; repetir → `existsError` sin sobrescribir; sin id / extra / id inválido; spec missing /
  ambigua; `plan` sin `spec.md`; `tasks` sin `plan.md` (y sin ambos → falla por `spec.md`); destino
  como directorio (barra final) y como archivo (sin barra); `specs/` como archivo → init sugerido;
  rollback con `templatePath` inexistente (destino no queda); flujo completo CL-11.
- `tests/messages.test.ts` (+): mensajes de fase y RF-12; `tests/init.test.ts` actualiza el mensaje
  de comando desconocido (A6).
- E2E manual del binario (criterios 1–4) en tmp dir.

## 5. Cobertura

| RF | Módulo(s) | Test(s) |
|----|-----------|---------|
| RF-1 | `templates.ts` + `phases.ts` | `tests/templates.test.ts`, `tests/phases.test.ts` (byte a byte) |
| RF-2 | `templates.ts` + `phases.ts` | idem, rama `tasks` |
| RF-3 | `spec.ts` + `phases.ts` | `tests/spec.test.ts`, `tests/phases.test.ts` (missing/ambigua/CL-10) |
| RF-4 | `spec.ts` + `phases.ts` | `tests/spec.test.ts`, `tests/phases.test.ts` (CL-2) |
| RF-5 | `phases.ts` + `index.ts` | `tests/phases.test.ts` (sin id, extra) |
| RF-6 | `phases.ts` | `tests/phases.test.ts` (sin `specs/`, `specs/` archivo — CL-7) |
| RF-7 | `phases.ts` | `tests/phases.test.ts` (CL-5 completo) |
| RF-8 | `phases.ts` | `tests/phases.test.ts` (CL-6, CL-11, NFR-5) |
| RF-9 | `messages.ts` + `phases.ts` | `tests/phases.test.ts` (bloques exactos) · `tests/messages.test.ts` |
| RF-10 | `phases.ts` | `tests/phases.test.ts` (CL-8, CL-9 rollback) |
| RF-11 | `index.ts` | exitCode asertado en todos los casos + E2E |
| RF-12 | `messages.ts` + `index.ts` | `tests/messages.test.ts` · `tests/init.test.ts` (actualizado) + E2E |

Todos los RF quedan cubiertos por las tareas T1–T4 (ver `tasks.md`).