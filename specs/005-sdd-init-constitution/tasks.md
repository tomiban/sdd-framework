# Tasks — Spec 005 `sdd init`: constitución + AGENTS.md

> Orden de dependencia obligatorio. Cada tarea deja `pnpm test`, `pnpm run typecheck` y
> `pnpm run build` en verde. Rama sugerida: `feat/005-sdd-init-constitution`.

## T1 — Plantillas centralizadas (constitution + agents-rule)

**RF:** RF-1 · RF-4 · QA A2/A8/D6 · NFR-4

- Crear `templates/constitution.md`: `# Constitution — <nombre del proyecto>`, preámbulo de
  principios inexorables y 6 principios genéricos del flujo SDD con «Verificable:» (spec antes de
  código · lógica pura testeada · templates centralizados · idempotencia y no destructividad ·
  stack mínimo · castellano/inglés).
- Crear `templates/agents-rule.md` con la línea exacta del RF-4 (y `\n` final).
- Extender `src/lib/templates.ts`: `TemplatePhase` con `"init"`, entrada
  `{ phase: "init", dest: "docs/constitution.md", source: "constitution.md" }` y
  `AGENTS_RULE_SOURCE`.
- Tests `tests/templates.test.ts` (+): manifiesto por fase de init, línea exacta de la regla y
  principios («Verificable:» ×6).

**Hecho cuando:**
- [x] `templates/constitution.md` tiene los 6 principios con «Verificable:» y `agents-rule.md` la
  línea exacta del RF-4
- [x] `templatesFor("init")` devuelve solo la entrada de constitución
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T2 — Estados de archivo + mensajes

**RF:** RF-2 · RF-3 · RF-5 · QA A3/A5/A10 · NFR-2 · NFR-3

- `src/lib/state.ts`: `fileStatus(path)` → `missing | exists | conflict` (existe y no es archivo →
  conflict).
- `src/lib/messages.ts`: `fileConflictError`, `constitutionEmptyWarn`, `agentsRuleAddedLine`,
  `agentsCitedLine`, `appendError` con los textos exactos.
- Tests `tests/messages.test.ts` (+) y los que necesite `fileStatus` (integración en tmp dirs).

**Hecho cuando:**
- [x] `fileStatus` distingue missing/exists/conflict sobre archivo y directorio
- [x] Los textos coinciden con los de la spec (incluido el `⚠`)
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T3 — `initialize` ampliado + bloques exactos + E2E

**RF:** RF-1…RF-8 · QA A1/A4/A6/A7/A9/A11 · NFR-5 · NFR-6

- `src/lib/init.ts`: flujo de QA A1 (conflictos de archivo, creación de constitución con rollback,
  append de la regla con salto garantizado, `createdAny` ampliado) y `buildLines` con las líneas de
  archivo (QA A7) en los bloques exactos del RF-6.
- Tests `tests/init.test.ts`: bloques FIRST_RUN/SECOND_RUN actualizados (con y sin `AGENTS.md`) y
  los casos CL-1…CL-8 (byte a byte, checksum intacto, `⚠`, conflictos, parcial, sin `\n` final,
  rollback, permisos).
- E2E manual (criterios 1–4) + regresión `validate 001|002|003|004` (criterio 6).

**Hecho cuando:**
- [x] Los bloques del RF-6 salen byte a byte y la constitución creada es idéntica al template
- [x] La regla se añade una sola vez y `init` repetido no modifica nada (checksum)
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde