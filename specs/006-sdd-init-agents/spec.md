# Spec 006 — `sdd init` crea `AGENTS.md`

## Contexto y objetivo

`init` ya siembra `docs/constitution.md` y enmienda un `AGENTS.md` existente (spec 005), pero si el
proyecto no tiene `AGENTS.md` no hace nada. Este spec cierra el hueco: `init` **crea**
`AGENTS.md` desde `templates/agents.md` (con la regla de leer la constitución ya incluida), de modo
que todo proyecto inicializado nace con constitución y con el agente instruido para respetarla.

> **Supersede a la spec 005**: el «Fuera de alcance» de crear `AGENTS.md` queda retirado y su
> RF-5 (no crearlo) se sustituye por el RF-1 de esta spec; el bloque de salida de su RF-6 se
> sustituye por el de esta spec (RF-3). La 005 no se modifica (histórico). El resto de 001 y 005
> sigue vigente.

## Usuarios / actores

- **Desarrollador/a**: inicializa un proyecto y quiere `AGENTS.md` listo para adaptar.
- **Agente (LLM)**: recibe instrucciones desde la primera ejecución.

## Historias de usuario

- **H1**: Como desarrolladora, quiero que `sdd init` cree un `AGENTS.md` con reglas de trabajo
  (incluida la lectura obligatoria de la constitución), para no redactarlo desde cero.

## Requisitos funcionales (EARS)

- **RF-1** — CUANDO `sdd init` se ejecuta y `AGENTS.md` no existe, EL SISTEMA lo crea copiando byte
  a byte `templates/agents.md` (constitución #3; incluye la regla «- Lee `docs/constitution.md` y la
  spec activa en `specs/` antes de tocar código.» dentro de su `## Reglas`) y lo informa como
  creado (`✓ Creado AGENTS.md`).
- **RF-2** — CUANDO `AGENTS.md` ya existe, EL SISTEMA aplica el comportamiento de la spec 005 sin
  cambios: sin mención a `constitution.md` → le añade la regla al final (una sola vez); con
  mención → lo informa como citado sin tocarlo; no es un archivo → error, nada creado.
- **RF-3** — Bloques de salida exactos (sustituyen a los de la spec 005). Primera ejecución en un
  proyecto vacío:
  ```
  Inicializando SDD…

  ✓ Creado docs/
  ✓ Creado specs/
  ✓ Creado .opencode/
  ✓ Creado .opencode/agents/
  ✓ Creado .opencode/commands/
  ✓ Creado .opencode/skills/
  ✓ Creado docs/constitution.md
  ✓ Creado AGENTS.md

  SDD inicializado correctamente.
  ```
  Con `AGENTS.md` preexistente sin cita, la línea final es `✓ Añadida la regla de constitución a
  AGENTS.md`; con cita, `✓ AGENTS.md ya cita docs/constitution.md`. Segunda ejecución: el bloque
  «ya inicializado» de la spec 005 (raíces + `✓ docs/constitution.md ya existe` + `✓ AGENTS.md ya
  cita docs/constitution.md`).
- **RF-4** — CUANDO falla la copia de la plantilla de `AGENTS.md`, EL SISTEMA elimina el archivo
  parcial que haya creado, informa el error con la ruta y termina con código != 0.
- **RF-5** — El resto del comportamiento de `sdd init` (001 y 005) sigue vigente: operación sobre
  el cwd, rechazo de argumentos, conflictos de directorio y archivo, inicialización parcial,
  escritura solo si hay algo que crear, idempotencia y códigos 0/!= 0 con errores en stderr.

## Requisitos no funcionales

- **NFR-1** — Sin dependencias de runtime; mensajes en castellano, identificadores en inglés.
- **NFR-2** — Contenido centralizado en `templates/` (constitución #3): `agents.md` se copia y
  `agents-rule.md` se añade; la línea de la regla es la misma en ambas plantillas (test de
  sincronía).
- **NFR-3** — No destructivo e idempotente: nunca se reescribe un `AGENTS.md` existente.

## Casos límite

- **CL-1** — Proyecto vacío → bloque con `✓ Creado AGENTS.md`; segunda pasada → «ya cita» (el
  archivo creado ya contiene la regla) y checksums intactos.
- **CL-2** — `AGENTS.md` preexistente sin cita / con cita → comportamiento 005 (regla una vez /
  «ya cita»), sin tocar el contenido previo.
- **CL-3** — `AGENTS.md` como directorio → `Error: AGENTS.md ya existe y no es un archivo.`,
  exit 1, nada creado.
- **CL-4** — Fallo de copia del template → rollback del archivo parcial y error con la ruta.
- **CL-5** — `AGENTS.md` vacío (0 bytes) → cuenta como sin cita → se le añade la regla.

## Fuera de alcance

- Editar secciones de un `AGENTS.md` existente más allá de añadir la regla (005).
- Interpolar el nombre del proyecto ni el stack en las marcas `<…>` del template.
- Cambios en `sdd new`, `sdd plan`, `sdd tasks` o `sdd validate`.

## Criterios de finalización

1. En un directorio vacío, `node dist/index.js init` emite el bloque exacto del RF-3 y crea
   `AGENTS.md` byte a byte idéntico a `templates/agents.md` (que contiene la regla en `## Reglas`);
   `$? == 0`.
2. Segunda ejecución → bloque «ya inicializado» exacto, `$? == 0`, `AGENTS.md` con checksum
   intacto.
3. `AGENTS.md` preexistente sin cita → regla añadida al final (una sola vez); con cita → intacto;
   como directorio → error `$? == 1` sin crear nada.
4. Templates centralizados verificables (cero literales de contenido en `src/`) y
   `pnpm test`, `pnpm run build`, `pnpm run typecheck` en verde.
