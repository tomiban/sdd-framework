# Spec 007 — `sdd status`

## Contexto y objetivo

El CLI tiene `init`, `new`, `plan`, `tasks` y `validate`, pero no una vista rápida del estado del
flujo. `sdd status` informa, en solo lectura y de un vistazo: si el proyecto está inicializado, si
tiene constitución y `AGENTS.md`, y qué specs existen con sus fases (spec/plan/tasks) y progreso de
tareas. Es el comando de orientación antes de decidir qué hacer (crear, completar o validar).

## Usuarios / actores

- **Desarrollador/a**: abre el proyecto y quiere saber en qué estado está el flujo SDD.

## Historias de usuario

- **H1**: Como desarrolladora, quiero `sdd status` para ver specs, fases y tareas pendientes sin
  tener que abrir carpetas.

## Requisitos funcionales (EARS)

- **RF-1** — CUANDO `sdd status` se ejecuta, EL SISTEMA informa en stdout, sobre el cwd y sin
  modificar nada, el bloque exacto:
  ```
  Estado SDD…

  ✓ Estructura: docs/ · specs/ · .opencode/
  ✓ docs/constitution.md
  ✓ AGENTS.md

  specs/001-sdd-init — spec ✓ · plan ✓ · tasks ✓ 12/12
  specs/002-media — spec ✓ · plan ✗ · tasks ✗

  2 specs · 1 lista
  ```
  y termina con código de salida 0.
- **RF-2** — EL SISTEMA informa la estructura SDD desde su manifiesto: completa → `✓ Estructura:
  <raíces>`; ausente por completo → `✗ Proyecto sin inicializar. Ejecuta primero: sdd init`;
  incompleta → `✗ Estructura incompleta: faltan <rutas>` (singular/plural según cantidad). Después,
  `docs/constitution.md` y `AGENTS.md` como `✓ <ruta>` o `✗ falta <ruta>`.
- **RF-3** — EL SISTEMA emite una línea por spec `specs/NNN-<slug>` (orden por nombre):
  `specs/NNN-<slug> — spec ✓|✗ · plan ✓|✗ · tasks ✓|✗ <hechas>/<total>`, donde los ✓/✗ indican si
  el archivo de esa fase existe y el conteo sale de los checkboxes de `tasks.md` (solo si existe).
  SI no hay specs, emite `sin specs todavía`.
- **RF-4** — EL SISTEMA cierra con el resumen `N spec(s) · M lista(s)` (singular/plural), donde una
  spec está «lista» si tiene las tres fases y `tasks.md` sin checkboxes pendientes (con al menos
  uno).
- **RF-5** — CUANDO se invoca con argumentos, EL SISTEMA muestra `Error: argumentos no
  soportados.\nUso: sdd status` en stderr y termina con código != 0.
- **RF-6** — El mensaje de comando desconocido (RF-12 de la spec 003) se actualiza a `Uso: sdd
  <comando> (init, new <slug>, plan <NNN>, tasks <NNN>, status)`: **sustituye** al texto fijado por
  la 003 (mismo patrón de las sustituciones anteriores).

## Requisitos no funcionales

- **NFR-1** — Solo lectura: `sdd status` no escribe en ningún sitio. Sin dependencias de runtime.
- **NFR-2** — Mensajes en castellano, identificadores en inglés; lógica pura testeable (constitución
  #4).
- **NFR-3** — Nombres de estructura derivados del manifiesto (constitución #3), no hardcodeados.

## Casos límite

- **CL-1** — Proyecto vacío → `✗ Proyecto sin inicializar…`, `✗ falta docs/constitution.md`,
  `✗ falta AGENTS.md`, `sin specs todavía`, `0 specs · 0 listas`, exit 0.
- **CL-2** — Inicialización parcial → `✗ Estructura incompleta: faltan …` (singular con uno).
- **CL-3** — Spec con fases incompletas → `✗` en las que faltan; `tasks.md` sin checkboxes → conteo
  `0/0` y la spec no cuenta como lista.
- **CL-4** — Tareas pendientes → `tasks ✓ 2/3` y la spec no cuenta como lista.
- **CL-5** — Todo completo → todas las líneas `✓` y `N specs · N listas`.
- **CL-6** — Argumentos extra (`sdd status foo`) → error de uso, exit 1 (RF-5).

## Fuera de alcance

- Veredictos de calidad (eso es `sdd validate`), filtros/flags, formato `--json`, relojes o
  watchers, y cualquier escritura (crear fases, marcar tareas).

## Criterios de finalización

1. En este repo, `node dist/index.js status` emite el bloque exacto del RF-1 con las 7 specs, sus
   tres fases y sus conteos de tareas; `$? == 0`.
2. En un directorio vacío → bloque CL-1 completo, `$? == 0`; en uno parcial → faltantes listados.
3. `sdd status foo` → error en stderr, `$? == 1`; comando desconocido → el texto del RF-6.
4. `pnpm test`, `pnpm run build` y `pnpm run typecheck` en verde.
