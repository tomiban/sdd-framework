# Spec 003 — `sdd plan <NNN>` y `sdd tasks <NNN>`

## Contexto y objetivo

`sdd new` (spec 002) crea el scaffold `specs/NNN-<slug>/spec.md`. El flujo SDD continúa con dos
fases de documentación: el **plan** (`plan.md`) y las **tareas** (`tasks.md`), hoy creadas a mano.

Este spec añade `sdd plan <NNN>` y `sdd tasks <NNN>`: crean el archivo de su fase en
`specs/NNN-<slug>/` desde la plantilla centralizada correspondiente, exigiendo el orden del flujo
(spec → plan → tareas) y sin sobrescribir nunca trabajo existente.

Es la primera extensión del manifiesto de templates con varios destinos (constitución #3) y la
primera funcionalidad con prerequisitos de fase.

Objetivo: scaffold de fase no destructivo, sin dependencias de runtime, con plantillas
centralizadas y mensajes en castellano.

## Usuarios / actores

- **Desarrollador/a**: persona o agente que sigue el flujo SDD sobre un proyecto inicializado.

## Historias de usuario

- **H1**: Como desarrolladora, quiero ejecutar `sdd plan <NNN>` para que se cree `plan.md` de esa
  spec desde la plantilla, sin saltarme el orden spec → plan.
- **H2**: Como desarrolladora, quiero ejecutar `sdd tasks <NNN>` para que se cree `tasks.md`
  exigiendo que exista antes el `plan.md` que descompone.
- **H3**: Como desarrolladora, quiero que ninguna fase pise un archivo existente, para poder
  ejecutar los comandos sin miedo a perder trabajo.

## Requisitos funcionales (EARS)

- **RF-1** — CUANDO `sdd plan <NNN>` se ejecuta sobre una spec válida, EL SISTEMA crea
  `specs/NNN-<slug>/plan.md` cuyo contenido es exactamente el de `templates/plan.md`, copiado desde
  la fuente centralizada de templates (constitución #3).
- **RF-2** — CUANDO `sdd tasks <NNN>` se ejecuta sobre una spec válida, EL SISTEMA crea
  `specs/NNN-<slug>/tasks.md` cuyo contenido es exactamente el de `templates/tasks.md`, con idéntico
  mecanismo de copia.
- **RF-3** — DONDE `<NNN>` es un número de spec de 1 a 3 dígitos normalizado a 3 (p. ej. `3` → `003`),
  EL SISTEMA resuelve el directorio `specs/NNN-*` correspondiente; SI no existe ninguno, EL SISTEMA
  termina con `Error: no existe la spec NNN.`, código != 0 y nada creado; SI existen varios
  directorios con ese número, EL SISTEMA termina con un error de ambigüedad que los lista, código
  != 0 y nada creado.
- **RF-4** — CUANDO `<NNN>` no es un número de 1 a 3 dígitos (p. ej. `0021`, `x`, `002-slug`, vacío),
  EL SISTEMA muestra un error con el valor recibido, la regla de formato y `Uso: sdd <comando>
  <NNN>`, y termina con código != 0 sin crear nada.
- **RF-5** — CUANDO el comando se invoca sin `<NNN>` o con más de un argumento, EL SISTEMA muestra
  un error de uso (`Uso: sdd plan <NNN>` o `Uso: sdd tasks <NNN>`) y termina con código != 0 sin
  crear nada.
- **RF-6** — CUANDO el cwd no tiene directorio `specs/` (o `specs/` no es un directorio), EL
  SISTEMA termina con un mensaje en castellano que sugiere ejecutar `sdd init`, código != 0, sin
  stack traces ni nada creado.
- **RF-7** — Flujo en orden: CUANDO `sdd plan <NNN>` se ejecuta y `spec.md` no existe en el directorio
  de la spec, EL SISTEMA termina con un error que indica el archivo ausente y el orden del flujo
  (`spec → plan → tareas`), código != 0; CUANDO `sdd tasks <NNN>` se ejecuta y falta `spec.md` o
  `plan.md`, EL SISTEMA comprueba `spec.md` primero y termina con el error correspondiente (para
  `plan.md`, el error sugiere `sdd plan NNN`), código != 0 y nada creado.
- **RF-8** — CUANDO el archivo de destino de la fase (`plan.md` / `tasks.md`) ya existe en el
  directorio de la spec (como archivo o como directorio), EL SISTEMA termina con un error «ya
  existe» que indica la ruta (con barra final solo si es un directorio), código != 0, y NO
  sobrescribe ni modifica nada.
- **RF-9** — MIENTRAS la creación tiene éxito, EL SISTEMA muestra en stdout, en castellano:
  ```
  Creando plan…

  ✓ Creado specs/NNN-<slug>/plan.md

  Plan creado: specs/NNN-<slug>/plan.md
  ```
  y para `tasks` el bloque equivalente con `Creando tareas…` y `Tareas creadas:
  specs/NNN-<slug>/tasks.md`, terminando con código de salida 0.
- **RF-10** — CUANDO falla la copia del template (permisos, error de fs, template ilegible), EL
  SISTEMA informa el error con la ruta implicada, elimina el archivo destino que, en su caso, haya
  quedado a medias por este comando, y termina con código != 0.
- **RF-11** — En TODO caso de éxito EL SISTEMA termina con código de salida 0; en TODO caso de
  error, con código != 0. La salida informativa/éxito va a stdout y los errores a stderr.
- **RF-12** — CUANDO se invoca un comando no soportado, EL SISTEMA responde `Error: comando no
  soportado: <comando>` seguido de `Uso: sdd <comando> (init, new <slug>, plan <NNN>, tasks <NNN>)`
  y código != 0. **Este mensaje sustituye al fijado por la spec 001** (que solo citaba `sdd init`);
  la spec 001 queda como histórico de su alcance y no se modifica.

## Requisitos no funcionales

- **NFR-1** — Sin dependencias de runtime (solo Node estándar: `fs`/`path`/`url`).
- **NFR-2** — Todos los mensajes visibles en castellano; identificadores en inglés.
- **NFR-3** — Lógica pura testeable con Vitest: resolución del id de spec (formato, padding,
  unicidad), selección de templates por fase, prerequisitos y mensajes (constitución #4).
- **NFR-4** — Las plantillas `plan.md` y `tasks.md` viven en `templates/` y se copian vía manifiesto
  (constitución #3): cero contenido de plantilla como strings en el código.
- **NFR-5** — No destructivo: repetir `sdd plan`/`sdd tasks` sobre una spec no modifica el archivo
  existente (RF-8).
- **NFR-6** — Solo lectura/escritura en `specs/` del cwd y lectura de `templates/` del paquete
  instalado (nunca relativo al cwd).
- **NFR-7** — Extensible: añadir una fase futura del flujo = una entrada de manifiesto + sus
  mensajes + su fila de prerequisitos; sin duplicar la lógica de creación.

## Casos límite

- **CL-1** — Sin `<NNN>`, argumentos extra (`sdd plan 002 003`, `sdd tasks a b`): error de uso,
  nada creado (RF-5).
- **CL-2** — Id inválido: `0021` (4 dígitos), `3a`, `x`, `-1`, `0x2`, nombre completo
  `002-slug`, vacío: error de formato con la regla (1–3 dígitos) y nada creado (RF-4).
- **CL-3** — Spec inexistente (`sdd plan 999`): error «no existe la spec 999» (RF-3). Ambigüedad
  real (p. ej. `002-a` y `002-b` creados a mano): error que lista ambos, sin elegir uno (RF-3).
- **CL-4** — Padding: `sdd plan 3` opera sobre `specs/003-*` idéntico a `sdd plan 003` (RF-3).
- **CL-5** — Prerequisitos: directorio de spec sin `spec.md`; `sdd tasks` sin `plan.md`; `sdd tasks`
  sin ninguno de los dos (falla por `spec.md` primero). Nada creado en ningún caso (RF-7).
- **CL-6** — Destino existente como archivo y como directorio: error «ya existe» con barra final
  solo en el segundo caso (RF-8).
- **CL-7** — `specs/` existe pero es un archivo: error que sugiere `sdd init`, sin stack trace (RF-6).
- **CL-8** — `specs/` o el directorio de la spec sin permiso de escritura: error con la ruta,
  nada creado (RF-10).
- **CL-9** — Fallo al copiar el template (ilegible o borrado): se elimina el destino parcial y se
  reporta el error con la ruta (RF-10).
- **CL-10** — `sdd plan 000`: normaliza a `000`, que no corresponde a ninguna spec → error «no
  existe la spec 000» (RF-3).
- **CL-11** — Flujo completo sobre la misma spec: `plan` y luego `tasks` crean ambos archivos;
  repetir cualquiera de los dos → error «ya existe» sin sobrescribir (RF-8, NFR-5).

## Fuera de alcance

- Generar contenido del plan o de las tareas más allá de la plantilla (el rellenado lo hace la
  persona o el agente al editar).
- Interpolación/placeholders dinámicos en las plantillas (contenido estático, como en la spec 002).
- Comandos `sdd status`, `sdd validate`, edición o borrado de specs, `--help`/`--version`.
- Numeración automática de specs: el `<NNN>` lo aporta quien invoca (eso ya es `sdd new`).
- Integración con git y generación de archivos en `.opencode/`.
- Modificar los mensajes de `sdd init` o `sdd new`, salvo el de comando desconocido (RF-12).

## Criterios de finalización

1. En un proyecto con `specs/002-x/` que contiene `spec.md`, `node dist/index.js plan 002` crea
   `plan.md` byte a byte idéntico a `templates/plan.md`, emite la salida exacta del RF-9 y termina
   con código 0; a continuación `node dist/index.js tasks 002` crea `tasks.md` idéntico a
   `templates/tasks.md`, mismo bloque exacto y código 0.
2. Repetir cualquiera de los dos comandos → error «ya existe» en stderr, código 1, y el archivo
   existente no se modifica (checksum intacto).
3. `sdd plan` sin `spec.md` → error de flujo (RF-7); `sdd tasks` sin `plan.md` → error que sugiere
   `sdd plan 002`; nada creado en ningún caso.
4. Id inválido, id desconocido, id ambiguo, sin argumento o argumentos extra → error en stderr,
   código 1, nada creado (RF-3…RF-5).
5. Plantillas centralizadas (constitución #3): verificado byte a byte y sin literales de contenido
   fuera de `templates/`.
6. `pnpm test`, `pnpm run build` y `pnpm run typecheck` en verde, incluidos los tests actualizados
   del mensaje de comando desconocido (RF-12) y de la lógica pura de ids de spec.
