# sdd — AGENTS.md

CLI de Spec-Driven Development: inicializa y gestiona el flujo SDD en un proyecto. Node/TS ESM +
Vitest, sin dependencias de runtime. Specs = fuente de verdad: `specs/NNN-*/spec.md` (crear vía
`/sdd-spec` o skill `sdd` en `.opencode/skills/sdd`).

Dev env: node >=20, pnpm 9.6.0 (`packageManager`). Commands verificados desde package.json:
`pnpm run build` (tsc → `dist/`, bin `sdd` → `dist/index.js`), `pnpm run typecheck`, `pnpm test`
(Vitest), `pnpm run dev` (`node --watch src/index.ts`; requiere Node ≥23.6 con type stripping).
Probar el CLI: `node dist/index.js init` en un directorio temporal.

Conventions: TS estricto (`strict`), ESM NodeNext — imports relativos con extensión `.js` —
`verbatimModuleSyntax`, sin prettier/eslint configurados. Reglas innegociables (stack, spec↔código,
templates centralizados, tests, idempotencia, idioma): ver `docs/constitution.md`.

Pitfalls: `pnpm-lock.yaml` present — use `pnpm`, not `npm`. No README — see `specs/`. `node_modules`
already present. Los mensajes visibles del CLI viven en `src/lib/messages.ts` (no literales en
`src/index.ts`); los contenidos que genere el CLI en el futuro viven en `templates/`.

## Reglas

- Lee `docs/constitution.md` y la spec activa en `specs/` antes de tocar código.
- No añadas dependencias ni cambies el formato del JSON sin actualizar antes la spec.
- No modifiques archivos dentro de `specs/` salvo petición explícita.