# Plan — Spec 004 `sdd validate <NNN>`

## 0. Cambios de persistencia derivados de la spec

Ninguno. Se añade `sdd.json` a la raíz del proyecto (config de verificación, formato de la spec),
que es configuración del repo, no persistencia de la aplicación.

## 1. Resolución de ambigüedades (revisión QA de la spec)

| # | Ambigüedad / hallazgo | Resolución | RF |
|---|------------------------|------------|----|
| A1 | Orden de precondiciones sin definir | Orden fijo: 1) sin argumento/extra → uso; 2) id inválido → formato; 3) `specs/` inexistente o no directorio → sugerir `sdd init`; 4) spec missing/ambigua → error; 5) `sdd.json` ausente/inválido → error; 6) comprobaciones + verdes → informe. | RF-1…RF-4 |
| A2 | *Hallazgo del dry-run*: 002/003 citan RFs como rangos (`RF-1…RF-10`); el conteo de tokens sueltos daría falsos negativos sobre nuestras propias specs | Los rangos `RF-a…RF-b` (también `..`/`-`) se expanden de forma inclusiva al conjunto de citas. | RF-8 |
| A3 | Las specs existentes usan «## Requisitos funcionales (EARS)» y la plantilla «(criterios de aceptación en EARS)» | Comparación por **sección base**: nombre del encabezado sin el paréntesis final, derivado de `templates/spec.md` (constitución #3). | RF-7, NFR-4 |
| A4 | ¿Y si falta `sdd.json`? ¿hallazgo o error? | Error de precondición (stderr, exit 1, sin informe): sin comandos no hay validación completa y no debe confundirse con «spec no lista». | RF-4 |
| A5 | Tareas pendientes: ¿hallazgo o error? | Hallazgo (NO LISTO). `tasks.md` sin bloques `## Tn` o sin checkboxes también es hallazgo, no excepción. | RF-9 |
| A6 | Faltan artefactos de fase | Hallazgo (NO LISTO), no error: el objetivo del comando es informar de specs incompletas. Las comprobaciones que dependen del archivo marcan «requiere …». | RF-6…RF-9, CL-4, CL-11 |
| A7 | Comandos que fallan o se cuelgan | Se ejecutan **todos** en orden (informe completo); timeout fijo de 10 min por comando; fallo = exit != 0 o timeout. Runner inyectable para tests (NFR-7). | RF-5, CL-9 |
| A8 | «Presencia + citas» de la constitución | Dos comprobaciones: `docs/constitution.md` existe y no vacío, y alguna de las 3 líneas `constitu` (case-insensitive) aparece en algún artefacto. Verificado en el dry-run: los 9 artefactos actuales citan. | RF-10, CL-8 |
| A9 | Forma exacta del informe | Bloque fijo del RF-11: título + 6 líneas de comprobación (✓/✗) + veredicto. Sin salida cruda de comandos (NFR-6). | RF-11, NFR-6 |
| A10 | `ValidateResult` difiere de `NewResult`/`PhaseResult` (la rama ok puede llevar exitCode 1 con informe) | Forma propia documentada en §3: `{ ok: true, lines, exitCode: 0 | 1 } | { ok: false, message, exitCode: 1 }`. | RF-11, RF-12 |
| A11 | Plurales en castellano («falta»/«faltan») | Los mensajes de listas de faltantes singular/plural según cantidad. | NFR-2 |

## 2. Decisiones técnicas

- **D1** — Dispatch `validate <NNN>` en `src/index.ts`; los mensajes de uso del id se generalizan a
  `IdCommand = "plan" | "tasks" | "validate"` (frente a `PhaseName` de fases). Cubre RF-1, RF-2.
- **D2** — `src/lib/config.ts`: `parseVerifyConfig(text)` puro (valida forma; campos extra se
  ignoran) + `readVerifyConfig(root)` (fs) con errores tipados. Mensajes `configMissing()`,
  `configInvalid(detail)`. Cubre RF-4, CL-3.
- **D3** — `src/lib/analysis.ts` (puro, sin fs): `rfTokens(text)` con expansión de rangos,
  `missingSections(specText, templateText)` por sección base, `parseTasks(tasksText)` (bloques
  `## Tn` ↔ checkboxes, pendientes por id), `citesConstitution(texts)`. Cubre RF-7…RF-10, CL-5…CL-8.
- **D4** — `src/lib/validate.ts`: `validateSpec({ root, args, runner? })` → `ValidateResult`;
  orden de A1, comprobaciones A6 (hallazgos, no errores) y verdes vía `VerifyRunner = (command,
  cwd) => Promise<number | "timeout">` (default: `exec` con timeout 600000 ms). Cubre RF-1…RF-12.
- **D5** — Mensajes del informe en `src/lib/messages.ts` (módulo único): `validateTitle`,
  `artifactsLine`, `structureLine`, `traceLine`, `tasksLine`, `constitutionLine`, `verdesLine`,
  `verdictLine`, `configMissing`, `configInvalid`. Cubre RF-11, NFR-2.
- **D6** — Las secciones esperadas se leen de `templates/spec.md` vía `resolveTemplateSource`
  (paquete, no cwd) y se normalizan a nombre base (A3). Cubre RF-7, NFR-4.
- **D7** — `sdd.json` en la raíz de este repo con `["pnpm run build", "pnpm run typecheck",
  "pnpm test"]` (dogfooding del criterio #1). Cubre RF-4.
- **D8** — La salida de los comandos no se captura para el informe (solo marca + exit/timeout,
  NFR-6); para depurar se ejecuta el comando a mano.

## 3. Modelo de datos y contratos

```jsonc
// sdd.json (raíz del proyecto)
{ "verify": ["pnpm run build", "…"] }   // ≥1 string no vacío; campos extra ignorados

// src/lib/config.ts
{
  // parseVerifyConfig(text): { ok: true, commands: string[] } | { ok: false, detail: string }
  "readVerifyConfig(root)": // Promise<{ ok: true, commands } | { ok: false, message }>
}

// src/lib/analysis.ts
{
  "rfTokens(text): number[]"            // únicos, ordenados; expande RF-a…RF-b inclusivo
  "missingSections(specText, templateText): string[]"   // secciones base faltantes
  // parseTasks(tasksText): { taskIds, doneCount, totalCount, pendingIds, hasCheckboxes, hasTasks }
  "citesConstitution(texts: string[]): boolean"
}

// src/lib/validate.ts
{
  "VerifyRunner": "(command, cwd) => Promise<number | \"timeout\">",
  // validateSpec({ root, args, runner? }): Promise<ValidateResult>
  "ValidateResult":
    { "ok": true,  "lines": ["Validando spec 002-sdd-new…", "", "✓ …", "…6 líneas…",
                            "", "Spec 002-sdd-new: LISTO"], "exitCode": 0 | 1 }
  | { "ok": false, "message": "Error: …", "exitCode": 1 }
}
```

## 4. Estrategia de tests

- `tests/analysis.test.ts` (puro): `rfTokens` (sueltos, rangos `RF-1…RF-10`, mixto, `RF-N` no
  numérico ignorado, dedupe/orden); `missingSections` (spec completa → [], faltantes, tolerancia a
  paréntesis); `parseTasks` (todo `[x]`, pendientes con ids, sin checkboxes, sin bloques);
  `citesConstitution` (con/sin cita, mayúsculas).
- `tests/config.test.ts` (puro + tmp dirs): CL-3 completo; `readVerifyConfig` con archivo
  ausente/presente.
- `tests/validate.test.ts` (integración tmp con runner stub): LISTO completo (líneas exactas
  RF-11); NO LISTO combinando hallazgos (plan ausente, RF sin cubrir, tarea pendiente, sección
  faltante, constitución ausente); «requiere spec.md/tasks.md» (CL-11); verdes con runner →
  exit != 0 y `timeout` (CL-9); precondiciones (id, args, sin `specs/`, sin `sdd.json`, config
  inválida) sin informe; exitCode 0/1 en todos.
- `tests/messages.test.ts` (+): textos del informe (plurales A11) y `configMissing`/`configInvalid`.
- E2E manual del binario en este repo: `validate 001/002/003` → LISTO con verdes reales; fixture
  roto → NO LISTO; comando fallido → ✗ Verdes.

## 5. Cobertura

| RF | Módulo(s) | Test(s) |
|----|-----------|---------|
| RF-1 | `spec.ts` (reutilizado) + `validate.ts` | `tests/validate.test.ts` (ids) · `tests/spec.test.ts` (ya existente) |
| RF-2 | `validate.ts` | `tests/validate.test.ts` (sin id, extra) |
| RF-3 | `validate.ts` | `tests/validate.test.ts` (sin `specs/`, `specs/` archivo) |
| RF-4 | `config.ts` | `tests/config.test.ts` (CL-3) · `tests/validate.test.ts` (precondición) |
| RF-5 | `validate.ts` | `tests/validate.test.ts` (runner: ok, exit, timeout) + E2E |
| RF-6 | `validate.ts` + `analysis` (lecturas) | `tests/validate.test.ts` (CL-4, CL-11) |
| RF-7 | `analysis.missingSections` | `tests/analysis.test.ts` · `tests/validate.test.ts` |
| RF-8 | `analysis.rfTokens` | `tests/analysis.test.ts` (rangos) · `tests/validate.test.ts` |
| RF-9 | `analysis.parseTasks` | `tests/analysis.test.ts` · `tests/validate.test.ts` (CL-7) |
| RF-10 | `analysis.citesConstitution` | `tests/analysis.test.ts` · `tests/validate.test.ts` (CL-8) |
| RF-11 | `messages.ts` + `validate.ts` | `tests/validate.test.ts` (bloques exactos) · `tests/messages.test.ts` |
| RF-12 | `validate.ts` + `index.ts` | exitCode asertado en todos los casos + E2E |

Todos los RF quedan cubiertos por las tareas T1–T4 (ver `tasks.md`).
