---
name: SDD
description: Flujo de desarrollo dirigido por specs del proyecto sdd — spec → QA → plan → tareas → implementación → validación. Usar cuando el usuario pida arrancar una funcionalidad, crear o revisar una spec, generar el plan o las tareas, implementar o validar una spec existente.
---

# SDD — Flujo guiado del proyecto sdd

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

- **Numeración**: prefijo incremental de 3 dígitos + slug en kebab (`specs/005-comandos/`). Mirar
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
3. Templates centralizados: los contenidos a generar viven en `templates/` o `src/templates/` y se
   copian vía manifiesto; nada de strings de contenido desperdigados.
4. Tests para lógica pura (`pnpm test`); el CLI se verifica con el build y verificación manual.
5. Idempotencia: las ejecuciones repetidas no tienen efectos destructivos (código de salida 0).
6. Castellano en textos, mensajes y docs; inglés en identificadores.

## Criterio de paso entre fases

- **Spec → QA**: spec completo, RF numerados y verificables.
- **QA → plan**: hallazgos con propuesta de resolución.
- **Plan → tareas**: resoluciones A# adoptadas, decisiones D# justificadas, cobertura RF total.
- **Tareas → implementación**: toda tarea con `Hecho cuando:` objetiva.
- **Implementación → validación**: `build`, `typecheck` y `test` verdes en local.
- **Validación**: `/sdd-validate` en verde = spec entregada.

Ante duda de formato, `specs/001-sdd-init/` (spec + plan + tasks) es la referencia canónica.