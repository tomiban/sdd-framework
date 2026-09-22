---
description: Crea una spec de funcionalidad (entrevista → spec.md con EARS)
---

Cargá la skill `open-spec` y ejecutá su proceso completo para la funcionalidad: $ARGUMENTS

Instrucciones:

1. Seguí la skill al pie de la letra: contexto (`docs/constitution.md` + specs previas en `specs/`),
   entrevista de UNA pregunta por vez (máx. 6), número libre `specs/NNN-<nombre>/`, redacción con la
   plantilla `spec-template.md` de la skill y criterios en notación EARS (RF-1, RF-2, …).
2. Si `$ARGUMENTS` está vacío, preguntá al usuario qué funcionalidad quiere especificar.
3. Redactá la spec en el chat y pedí **aprobación explícita** antes de escribir nada a disco.
4. Con la aprobación, creá únicamente `specs/NNN-<nombre>/spec.md`. Nada más: ni código, ni cambios
   en PLAN.md ni en `packages/` — eso llega después, referenciando la spec.
