---
description: Fase 5 del flujo SDD — implementa las tareas pendientes de una spec
agent: sdd-implement
---

Fase 5 del flujo SDD: implementación.

Spec: $ARGUMENTS (número `NNN`, slug o ruta — o una tarea concreta `T<N>` para avanzar solo hasta
ahí)

Implementa las tareas `- [ ]` en orden de `tasks.md`, verificando cada una antes de marcarla
(`pnpm test` / `pnpm run build` / `pnpm run typecheck` en verde) y respetando plan y constitución.
Cierra con resumen de tareas, RF cubiertos y desvíos del plan.