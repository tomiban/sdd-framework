# Spec 004 — `sdd validate <NNN>`

## Contexto y objetivo

El flujo SDD cierra cada spec con una validación (fase 6). Hoy la hace el agente `sdd-validate`,
que razona sobre calidad semántica. Falta una capa **determinista** que cualquiera (persona, CI)
pueda ejecutar: `sdd validate <NNN>` comprueba artefactos, estructura de la plantilla, trazabilidad
RF↔plan↔tasks, tareas completadas, constitución y **verdes** (comandos de verificación declarados
en `sdd.json`), y emite un veredicto LISTO / NO LISTO con código de salida.

Objetivo: veredicto reproducible sin LLM, sin dependencias de runtime, con informe en castellano.

Decisiones de alcance confirmadas: los verdes se declaran en `sdd.json` (formato nuevo de este
spec); la constitución se comprueba por presencia y citas, no por contenido semántico (eso sigue
siendo del agente `sdd-validate`).

## Usuarios / actores

- **Desarrollador/a**: cierra una spec y quiere saber si está lista sin lanzar el agente.
- **CI**: automatiza el cierre con el código de salida.

## Historias de usuario

- **H1**: Como desarrolladora, quiero `sdd validate <NNN>` para obtener un informe y un veredicto
  objetivo sobre el estado de una spec.
- **H2**: Como integración continua, quiero código 0 cuando la spec está LISTO y 1 cuando no, para
  cortar el pipeline.

## Formato de `sdd.json`

Archivo en la raíz del proyecto (cwd). Campos extra se ignoran:

```json
{
  "verify": ["pnpm run build", "pnpm run typecheck", "pnpm test"]
}
```

## Requisitos funcionales (EARS)

- **RF-1** — CUANDO `sdd validate <NNN>` se ejecuta, EL SISTEMA opera sobre el cwd y resuelve la
  spec `specs/NNN-*` con las mismas reglas de id que `plan`/`tasks`: `<NNN>` de 1–3 dígitos con
  padding (`3` → `003`); SI el formato es inválido → error con la regla y `Uso: sdd validate
  <NNN>`; SI no existe → `Error: no existe la spec NNN.`; SI hay varios → error de ambigüedad que
  los lista. Código != 0 y sin informe en todos esos casos.
- **RF-2** — CUANDO el comando se invoca sin `<NNN>` o con más de un argumento, EL SISTEMA muestra
  un error de uso (`Uso: sdd validate <NNN>`) y termina con código != 0, sin informe.
- **RF-3** — CUANDO el cwd no tiene directorio `specs/` (o no es un directorio), EL SISTEMA
  termina con un mensaje en castellano que sugiere ejecutar `sdd init`, código != 0, sin stack
  traces.
- **RF-4** — EL SISTEMA lee `sdd.json` de la raíz del proyecto: objeto JSON con `verify`, lista de
  1 o más comandos (strings no vacíos). SI falta el archivo, el JSON es inválido o `verify` no
  cumple ese formato, EL SISTEMA termina con un error claro en stderr, código != 0 y sin informe.
- **RF-5** — CUANDO hay comandos de verificación, EL SISTEMA ejecuta cada uno de `verify` en orden,
  con cwd = raíz del proyecto y timeout de 10 minutos por comando; SI uno termina con código != 0
  o excede el timeout, se marca fallido (`exit <código>` / `timeout`) pero se ejecutan todos: la
  comprobación de verdes es ✗ si falla alguno, ✓ solo si todos terminan en 0.
- **RF-6** — EL SISTEMA comprueba los artefactos del flujo en `specs/NNN-<slug>/`: `spec.md`,
  `plan.md` y `tasks.md`. SI alguno falta se lista como hallazgo (veredicto NO LISTO), sin ser un
  error de ejecución.
- **RF-7** — EL SISTEMA comprueba la estructura de `spec.md`: contiene una línea de encabezado para
  cada sección base de la plantilla (`templates/spec.md` del paquete; sección base = nombre sin el
  paréntesis final). SI faltan se listan; SI falta `spec.md`, la comprobación marca «requiere
  spec.md».
- **RF-8** — EL SISTEMA comprueba la trazabilidad RF: cada referencia `RF-N` de `spec.md` (incluidos
  los rangos `RF-a…RF-b`, expandidos de forma inclusiva) debe aparecer también en `plan.md` y en
  `tasks.md`; SI faltan, se listan por archivo; SI falta `spec.md`, marca «requiere spec.md».
- **RF-9** — EL SISTEMA comprueba las tareas de `tasks.md`: debe haber al menos un bloque `## Tn` y
  al menos un checkbox `- [x]`/`- [ ]`, y todos los checkboxes deben estar marcados `[x]`; SI hay
  pendientes se listan por id de tarea; SI falta `tasks.md`, marca «requiere tasks.md»; SI no hay
  bloques o no hay checkboxes, se marca como hallazgo.
- **RF-10** — EL SISTEMA comprueba la constitución: `docs/constitution.md` existe y no está vacío,
  y al menos uno de `spec.md`/`plan.md`/`tasks.md` la cita (ocurrencia de `constitu` sin distinguir
  mayúsculas). Cada fallo se marca como hallazgo.
- **RF-11** — EL SISTEMA emite el informe en stdout, en castellano, con una línea por comprobación
  (prefijos `✓`/`✗`) y el veredicto final:
  ```
  Validando spec 002-sdd-new…

  ✓ Artefactos: spec.md, plan.md, tasks.md
  ✓ Estructura: todas las secciones de la plantilla
  ✓ Trazabilidad: todos los RF cubiertos en plan.md y tasks.md
  ✓ Tareas: 12/12 completadas
  ✓ Constitución: docs/constitution.md (citada en spec/plan/tasks)
  ✓ Verdes: 3/3 comandos

  Spec 002-sdd-new: LISTO
  ```
  y cuando hay hallazgos el mismo bloque con las líneas `✗` correspondientes y el veredicto
  `Spec NNN-<slug>: NO LISTO`. El veredicto es LISTO solo si TODAS las comprobaciones son ✓.
- **RF-12** — En TODO caso EL SISTEMA termina con código de salida 0 solo si el veredicto es LISTO;
  si el veredicto es NO LISTO, o si se cumplen las condiciones de error de RF-1…RF-4, termina con
  código de salida 1. Los errores de precondición van a stderr y el informe (cuando se produce) a
  stdout.

## Requisitos no funcionales

- **NFR-1** — Sin dependencias de runtime: ejecución de comandos con `node:child_process` (stdlib).
- **NFR-2** — Mensajes e informe en castellano; identificadores en inglés.
- **NFR-3** — Lógica pura testeable con Vitest: análisis de textos (RF, secciones, tareas, citas) y
  parseo de `sdd.json`, sin fs ni procesos (constitución #4).
- **NFR-4** — Las secciones esperadas se derivan de `templates/spec.md` (constitución #3): cero
  nombres de sección hardcodeados como fuente de verdad.
- **NFR-5** — No destructivo e idempotente: `sdd validate` solo lee del proyecto (más allá de los
  efectos de los comandos que el propio proyecto declare en `verify`); repetirlo no cambia su
  resultado.
- **NFR-6** — Informe determinista: no se incluye la salida cruda de los comandos, solo su marca y
  código (para ver la salida se ejecuta el comando a mano).
- **NFR-7** — El análisis es independiente de la ejecución: los verdes se inyectan como runner,
  testeable sin lanzar procesos reales.

## Casos límite

- **CL-1** — Sin `<NNN>`, argumentos extra, id inválido (`0021`, `x`, `002-slug`), id desconocido
  (`999`), id ambiguo (dos dirs `005-*`): errores de precondición, exit 1, sin informe (RF-1, RF-2).
- **CL-2** — Proyecto sin `specs/` o con `specs/` como archivo: error que sugiere `sdd init`
  (RF-3).
- **CL-3** — `sdd.json`: ausente; JSON malformado; sin `verify`; `verify` vacío, no lista, o con
  elementos que no son strings no vacíos; campos extra (se ignoran) (RF-4).
- **CL-4** — Spec sin `plan.md`/`tasks.md` (fases incompletas): hallazgos de artefactos, el resto
  de comprobaciones sigue informando lo que pueda (RF-6).
- **CL-5** — `spec.md` sin alguna sección de la plantilla (variantes con paréntesis toleradas):
  hallazgo con la lista de secciones base faltantes (RF-7).
- **CL-6** — RF declarado pero sin citar en `plan.md` o `tasks.md` → hallazgo por archivo; rangos
  `RF-1…RF-10` cubren 1..10; menciones aisladas (`ver RF-5`) cuentan como cita (RF-8).
- **CL-7** — `tasks.md` con checkboxes `[ ]` pendientes (se listan los `## Tn` implicados); sin
  checkboxes; sin bloques `## Tn`; todo marcado (RF-9).
- **CL-8** — Constitución ausente, vacía, o presente pero sin ninguna cita en los artefactos
  (RF-10).
- **CL-9** — Verdes: comando con exit != 0 (se informa `exit <código>`); comando inexistente en el
  shell (exit 127, mismo tratamiento); comando que excede 10 minutos (`timeout`); todos OK; un
  fallo no impide ejecutar el resto (RF-5).
- **CL-10** — Spec completa y correcta → bloque exacto del RF-11 con veredicto LISTO y exit 0.
- **CL-11** — Spec sin `spec.md`: artefactos ✗ y las comprobaciones de estructura y trazabilidad
  marcan «requiere spec.md» (RF-6…RF-8).

## Fuera de alcance

- Validación semántica de reglas de constitución, calidad/redacción EARS, o coherencia
  spec↔código↔tests reales: eso lo hace el agente `sdd-validate`.
- Crear o modificar `sdd.json` automáticamente (tampoco lo crea `sdd init`).
- Comandos `sdd status`, `sdd new`/`plan`/`tasks`/`init` (sin cambios), `--help`/`--version`,
  opciones `--fix` o salida `--json`.
- Ejecución en paralelo de comandos y captura/almacenamiento de su salida.
- Validación de varias specs de una vez o del repo completo.

## Criterios de finalización

1. En este repo (con `sdd.json` propio), `node dist/index.js validate 001`, `validate 002` y
   `validate 003` producen el bloque exacto del RF-11 con veredicto LISTO y `$? == 0` (incluidos
   los verdes reales: build, typecheck, test).
2. Un fixture con RF sin cubrir en `tasks.md`, una tarea pendiente y `plan.md` ausente → bloque
   con líneas `✗`, veredicto NO LISTO y `$? == 1`, listando cada hallazgo.
3. `sdd.json` ausente o inválido → error en stderr, `$? == 1`, sin informe.
4. Un comando de `verify` fallido (exit != 0) → línea `✗ Verdes: … (exit 1)` y veredicto NO LISTO;
   con runner inyectable en tests y comando real fallido en el E2E.
5. La lógica de análisis y el parseo de `sdd.json` tienen tests Vitest en verde (incluidos rangos
   RF, variantes con paréntesis de secciones, y los CL-3/CL-6/CL-7/CL-8).
6. `pnpm test`, `pnpm run build` y `pnpm run typecheck` en verde.
