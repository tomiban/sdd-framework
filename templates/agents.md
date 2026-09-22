# <nombre del proyecto> — AGENTS.md

<Descripción del proyecto y su stack: qué es, cómo se construye y cómo se verifica.>

Specs = fuente de verdad: `specs/NNN-*/spec.md`. El flujo SDD es spec → plan → tareas →
implementación; el código referencia la spec que implementa.

Conventions: <formateo, comandos de build/test verificados, decisiones del entorno.>

Pitfalls: <trampas del proyecto: cosas que rompen el build, configuraciones sensibles…>

## Reglas

- Lee `docs/constitution.md` y la spec activa en `specs/` antes de tocar código.
- No añadas dependencias ni cambies formatos sin actualizar antes la spec.
- No modifiques archivos dentro de `specs/` salvo petición explícita.
