---
name: SDD gastos-casa
description: Flujo de desarrollo dirigido por specs de gastos-casa — spec → QA → plan → tareas → implementación → validación. Usar cuando el usuario pida arrancar una funcionalidad, crear o revisar una spec, generar el plan o las tareas, implementar o validar una spec existente.
---

# SDD — Flujo guiado de gastos-casa

Flujo de seis fases. La spec es la fuente de verdad (constitución #2); cada fase produce un artefacto
en `specs/NNN-<nombre>/` antes de pasar a la siguiente. Nunca se escribe código antes de la spec y el plan.

## Fases

| # | Fase | Comando | Agente | Artefacto |
|---|------|---------|--------|-----------|
| 1 | Spec | `/sdd-spec <funcionalidad>` | `sdd-spec` | `specs/NNN-<nombre>/spec.md` |
| 2 | QA de la spec | `/sdd-qa <NNN o ruta>` | `sdd-qa` | Informe de hallazgos (se resuelven en el plan) |
| 3 | Plan | `/sdd-plan <NNN o ruta>` | `sdd-plan` | `specs/NNN-<nombre>/plan.md` |
| 4 | Tareas | `/sdd-tasks <NNN o ruta>` | `sdd-tasks` | `specs/NNN-<nombre>/tasks.md` |
| 5 | Implementación | `/sdd-implement <NNN o ruta [tarea]>` | `sdd-implement` | Código + tests |
| 6 | Validación | `/sdd-validate <NNN o ruta>` | `sdd-validate` | Informe verde/rojo |

## Convenciones de los artefactos

- **Numeración**: prefijo incremental de 3 dígitos + slug en kebab (`specs/005-compras/`). Mirar
  `specs/` para calcular el siguiente; no reutilizar números.
- **`spec.md`**: Contexto y objetivo · Usuarios / actores · Historias de usuario (H1…) ·
  Requisitos funcionales en EARS (RF-1…) · Requisitos no funcionales · Casos límite ·
  Fuera de alcance · Criterios de finalización.
- **`plan.md`** (sin código): cambios de persistencia (tabla con justificativa y RF) ·
  resoluciones del QA (A1, A2…) · decisiones técnicas (D1, D2…) · modelo de datos en JSON ·
  estrategia de tests · cobertura RF → módulo/test. Cada sección marca los RF que cubre.
- **`tasks.md`**: fases en orden de dependencia; tareas de ~20–30 min; cada una con `RF:` y
  `Hecho cuando:` verificable; checkboxes `- [ ]` / `- [x]`; la lógica pura lleva sus unit tests
  incluidos en la misma tarea.

## Reglas de ejecución (docs/constitution.md)

1. Stack mínimo: sin dependencias nuevas ni cambios de formato de JSON sin actualizar la spec antes.
2. Spec antes de código: toda entrega cita spec + RF.
3. Lógica fuera de la UI: `packages/shared` y `lib/` puros; la UI solo renderiza y delega.
4. Tests para lógica pura (`pnpm test`); la UI se verifica con el build.
5. Persistencia solo por la API (Prisma/Postgres); el device solo guarda tokens.
6. Castellano en textos, mensajes y docs; inglés en identificadores. Montos en ARS.

## Criterio de paso entre fases

- **Spec → QA**: spec completo, RF numerados y verificables.
- **QA → plan**: hallazgos con propuesta de resolución.
- **Plan → tareas**: resoluciones A# adoptadas, decisiones D# justificadas, cobertura RF total.
- **Tareas → implementación**: toda tarea con `Hecho cuando:` objetiva.
- **Implementación → validación**: `build`, `lint` y `test` verdes en local.
- **Validación**: `/sdd-validate` en verde = spec entregada.

Ante duda de formato, `specs/001-gastos/` (spec + plan + tasks) es la referencia canónica.
