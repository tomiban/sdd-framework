---
description: Fase 6 del flujo SDD — valida una spec contra RF, constitución y verdes
agent: sdd-validate
---

Fase 6 del flujo SDD: validación final.

Spec: $ARGUMENTS (número `NNN`, slug o ruta)

Ejecuta build/typecheck/test, verifica la trazabilidad de cada RF a archivo/test, revisa las 6
reglas de `docs/constitution.md` y los artefactos de `specs/`. Emite las tablas de verdes y de RF,
la lista de hallazgos por severidad y el veredicto `LISTO` / `NO LISTO`. No corrijas nada.