# Tasks — Spec 004 `sdd validate <NNN>`

> Orden de dependencia obligatorio. Cada tarea deja `pnpm test`, `pnpm run typecheck` y
> `pnpm run build` en verde. Rama sugerida: `feat/004-sdd-validate`.

## T1 — Análisis puro de artefactos

**RF:** RF-7 · RF-8 · RF-9 · RF-10 · CL-5…CL-8 · QA A2/A3/A8 · NFR-3

- Crear `src/lib/analysis.ts`: `rfTokens(text)` con expansión inclusiva de rangos `RF-a…RF-b`
  (también `..`/`-`) y dedupe/orden; `missingSections(specText, templateText)` por sección base
  (encabezado sin paréntesis final); `parseTasks(tasksText)` (bloques `## Tn`, checkboxes totales
  y `[x]`, pendientes por id de tarea, flags `hasTasks`/`hasCheckboxes`);
  `citesConstitution(texts)`.
- Tests `tests/analysis.test.ts`: cada caso de CL-5…CL-8 y A2/A3/A8 (rangos, variantes con
  paréntesis, pendientes con ids, sin checkboxes/bloques, citas case-insensitive).

**Hecho cuando:**
- [x] `rfTokens` expande rangos y no se traga `RF-N` ni duplicados (fixture A2)
- [x] `missingSections` tolera variantes de paréntesis contra `templates/spec.md` real
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T2 — `sdd.json`: parseo, lectura y config del repo

**RF:** RF-4 · CL-3 · QA A4 · D7

- Crear `src/lib/config.ts`: `parseVerifyConfig(text)` (valida `verify` ≥1 string no vacío; campos
  extra se ignoran) y `readVerifyConfig(root)` con errores tipados.
- Mensajes `configMissing()` y `configInvalid(detail)` en `src/lib/messages.ts`.
- Crear `sdd.json` en la raíz del repo con `["pnpm run build", "pnpm run typecheck", "pnpm test"]`.
- Tests `tests/config.test.ts`: CL-3 completo (ausente, JSON malformado, sin `verify`, vacío, no
  lista, elementos no string, campos extra ignorados).

**Hecho cuando:**
- [x] `sdd.json` del repo es válido según `parseVerifyConfig`
- [x] CL-3 cubierto caso a caso
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T3 — `validateSpec` + informe

**RF:** RF-1…RF-3 · RF-5…RF-12 · QA A1/A5/A6/A7/A9/A10/A11 · NFR-2 · NFR-5 · NFR-7

- Mensajes del informe en `src/lib/messages.ts` (`validateTitle`, `artifactsLine`, `structureLine`,
  `traceLine`, `tasksLine`, `constitutionLine`, `verdesLine`, `verdictLine`) con plurales correctos
  (A11) y los textos exactos del RF-11.
- Crear `src/lib/validate.ts`: `validateSpec({ root, args, runner? })` → `ValidateResult` con el
  orden de A1, comprobaciones como hallazgos (A6), verdes vía `VerifyRunner` inyectable (default
  `exec`, timeout 600000 ms, todos los comandos se ejecutan) y bloque exacto del RF-11. Los
  mensajes de uso del id aceptan `validate` (A1/D1: `IdCommand`).
- Tests `tests/validate.test.ts` con tmp dirs y runner stub: LISTO (líneas exactas), NO LISTO
  combinado, «requiere …» (CL-11), runner fallido y `timeout` (CL-9), precondiciones sin informe,
  exitCode 0/1.

**Hecho cuando:**
- [x] El bloque LISTO coincide byte a byte con el RF-11
- [x] Cada hallazgo de CL-4…CL-8 aparece en su línea `✗` y voltea el veredicto a NO LISTO
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T4 — CLI + E2E (criterios 1–4)

**RF:** RF-12 · QA A1 · NFR-6

- Dispatch `sdd validate <NNN>` en `src/index.ts` (informe → stdout con exitCode del veredicto;
  errores de precondición → stderr, exit 1).
- Verificación manual en este repo: `node dist/index.js validate 001|002|003` → bloque LISTO con
  verdes reales y `$? == 0`; fixture roto en tmp dir (RF sin cubrir + tarea pendiente + plan
  ausente) → NO LISTO `$? == 1`; `sdd.json` ausente/inválido → error sin informe; comando fallido
  en `verify` → `✗ Verdes: … (exit 1)` y NO LISTO.

**Hecho cuando:**
- [x] `validate 001|002|003` → LISTO `$? == 0` en este repo real (dogfooding)
- [x] Fixture roto y comando fallido → NO LISTO `$? == 1` con cada línea `✗` documentada
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde