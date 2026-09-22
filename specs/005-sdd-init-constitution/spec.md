# Spec 005 — `sdd init`: `docs/constitution.md` + regla en `AGENTS.md`

## Contexto y objetivo

Todo proyecto tiene principios inexorables (su `docs/constitution.md`): reglas numeradas, con
título en negrita, descripción y cláusula «Verificable:». `sdd init` hoy solo crea directorios;
este spec lo amplía para que **siembre y verifique** esos principios y garantice que el agente los
lea siempre:

1. `sdd init` crea/verifica `docs/constitution.md` con principios genéricos del flujo SDD (el
   proyecto los adapta a su stack), copiados desde `templates/constitution.md`.
2. Si existe `AGENTS.md` y no menciona `constitution.md`, `init` le añade al final la regla que
   pide al agente leer la constitución y la spec activa antes de tocar código (aditivo; nunca se
   borra ni se reescribe contenido).

Objetivo: cerrar el círculo init → constitución → agente → validate (`sdd validate` ya exige la
constitución; ahora `init` la siembra).

> **Supersede a la spec 001**: los bloques de salida exactos de la 001 quedan sustituidos por los
> de esta spec (RF-6). El resto de la 001 sigue vigente (RF-8). La 001 no se modifica: queda como
> histórico de su alcance (mismo patrón que la 003 con el mensaje de comando desconocido).

## Usuarios / actores

- **Desarrollador/a**: inicializa un proyecto y quiere sus principios inexorables en su sitio.
- **Agente (LLM)**: lee `AGENTS.md`; con la regla añadida, siempre revisa la constitución.

## Historias de usuario

- **H1**: Como desarrolladora, quiero que `sdd init` cree `docs/constitution.md` con principios
  inexorables listos para adaptar, para no empezar de cero.
- **H2**: Como desarrolladora, quiero que si mi `AGENTS.md` no pide leer la constitución, `init` le
  añada esa regla (y solo una vez), para que el agente nunca la ignore.

## Formato de `templates/constitution.md`

Principios genéricos reales del flujo SDD en el formato del equipo: título `# Constitution —
<nombre del proyecto>`, preámbulo breve y 6 principios numerados (`1.`…`6.`) con **título en
negrita**, descripción y cláusula `Verificable:` — spec antes de código · lógica pura testeada ·
templates centralizados · idempotencia y no destructividad · stack mínimo · castellano en humano,
inglés en código.

## Requisitos funcionales (EARS)

- **RF-1** — CUANDO `sdd init` se ejecuta, además de la estructura de directorios, EL SISTEMA
  garantiza `docs/constitution.md`: SI no existe, lo crea copiando byte a byte
  `templates/constitution.md` (constitución #3) y lo informa como creado.
- **RF-2** — CUANDO `docs/constitution.md` ya existe como archivo, EL SISTEMA NO lo modifica; lo
  informa como existente (`✓ docs/constitution.md ya existe`) y, SI está vacío o solo tiene
  espacios, emite en su lugar el aviso `⚠ docs/constitution.md ya existe pero está vacío`
  (el comando sigue terminando con código 0).
- **RF-3** — CUANDO `docs/constitution.md` existe pero no es un archivo (p. ej. un directorio), EL
  SISTEMA termina con `Error: docs/constitution.md ya existe y no es un archivo.`, código != 0 y
  sin crear ni modificar nada.
- **RF-4** — CUANDO existe `AGENTS.md` como archivo y su contenido NO menciona `constitution.md`
  (búsqueda sin distinguir mayúsculas), EL SISTEMA añade al final del archivo, de forma aditiva y
  con el salto de línea que haga falta, la línea exacta:
  ```
  - Lee `docs/constitution.md` y la spec activa en `specs/` antes de tocar código.
  ```
  y lo informa (`✓ Añadida la regla de constitución a AGENTS.md`).
- **RF-5** — DONDE `AGENTS.md` es un archivo que ya menciona `constitution.md`, EL SISTEMA lo
  informa como citado (`✓ AGENTS.md ya cita docs/constitution.md`) sin tocarlo; CUANDO `AGENTS.md`
  no existe, EL SISTEMA no lo crea ni emite ninguna línea sobre él; CUANDO existe pero no es un
  archivo, EL SISTEMA termina con `Error: AGENTS.md ya existe y no es un archivo.`, código != 0 y
  sin crear ni modificar nada.
- **RF-6** — MIENTRAS `sdd init` termina bien, EL SISTEMA muestra en stdout el bloque exacto del
  modo correspondiente. **Estos bloques sustituyen a los bloques de salida de la spec 001.** Las
  líneas de archivo van al final del bloque, primero `docs/constitution.md` y después la de
  `AGENTS.md` (solo si el archivo existe). Primera ejecución (proyecto vacío, con `AGENTS.md` sin
  citar):
  ```
  Inicializando SDD…

  ✓ Creado docs/
  ✓ Creado specs/
  ✓ Creado .opencode/
  ✓ Creado .opencode/agents/
  ✓ Creado .opencode/commands/
  ✓ Creado .opencode/skills/
  ✓ Creado docs/constitution.md
  ✓ Añadida la regla de constitución a AGENTS.md

  SDD inicializado correctamente.
  ```
  Segunda ejecución (todo en su sitio):
  ```
  Inicializando SDD…

  ✓ docs/ ya existe
  ✓ specs/ ya existe
  ✓ .opencode/ ya existe
  ✓ docs/constitution.md ya existe
  ✓ AGENTS.md ya cita docs/constitution.md

  SDD ya está inicializado.
  ```
  Sin `AGENTS.md` se emite el mismo bloque sin su línea (y sin la de la regla en la primera
  ejecución).
- **RF-7** — CUANDO falla la copia de la plantilla, EL SISTEMA elimina el archivo parcial que haya
  creado, informa el error con la ruta y termina con código != 0; CUANDO falla la escritura de la
  regla en `AGENTS.md`, EL SISTEMA informa `Error: no se pudo actualizar AGENTS.md: <detalle>` y
  termina con código != 0.
- **RF-8** — El resto del comportamiento de `sdd init` definido por la spec 001 sigue vigente:
  operación sobre el cwd, rechazo de argumentos, detección de conflictos de directorios,
  inicialización parcial, comprobación de escritura solo si hay algo que crear, idempotencia y
  códigos de salida 0/!= 0 con errores en stderr.

## Requisitos no funcionales

- **NFR-1** — Sin dependencias de runtime (solo Node estándar).
- **NFR-2** — Mensajes e informes en castellano; identificadores en inglés; el `⚠` solo para el
  aviso de constitución vacía.
- **NFR-3** — Lógica pura testeable con Vitest (constitución #4): composición de líneas, estado de
  archivos y detección de cita.
- **NFR-4** — Contenido generado centralizado (constitución #3): `templates/constitution.md` se
  copia y `templates/agents-rule.md` se añade; cero strings de contenido en el código.
- **NFR-5** — Aditivo y no destructivo: jamás se borra ni se reescribe contenido existente (la
  regla se añade una sola vez; repetir `init` no modifica nada).
- **NFR-6** — Idempotente: segunda ejecución solo informa estado.

## Casos límite

- **CL-1** — Proyecto vacío sin `AGENTS.md`: primera ejecución sin línea de AGENTS; segunda con
  `✓ docs/constitution.md ya existe` y sin línea de AGENTS (RF-5, RF-6).
- **CL-2** — `AGENTS.md` sin cita → regla añadida al final; segunda ejecución → «ya cita» (la
  detección cuenta como cita cualquier mención de `constitution.md`, p. ej. `Constitution.md` o
  `./docs/constitution.md`) (RF-4, RF-5).
- **CL-3** — `docs/constitution.md` existente y vacío (o solo espacios) → aviso `⚠` y código 0
  (RF-2). `sdd validate` lo trata como NO LISTO (spec 004, sin cambios).
- **CL-4** — `docs/constitution.md` o `AGENTS.md` como directorio → error «no es un archivo»,
  código 1, nada creado (RF-3, RF-5).
- **CL-5** — Inicialización parcial: `docs/` existe sin `docs/constitution.md` → solo se crea el
  archivo y su línea dice «Creado» entre las de estado (RF-6).
- **CL-6** — `AGENTS.md` sin salto de línea final (o vacío) → la regla se añade con el salto que
  haga falta, sin partir líneas existentes (RF-4).
- **CL-7** — Fallo de copia de la plantilla → se elimina el archivo parcial y se informa con la
  ruta (RF-7).
- **CL-8** — `AGENTS.md` sin permiso de escritura → `Error: no se pudo actualizar AGENTS.md: …`,
  código != 0 (RF-7).

## Fuera de alcance

- Crear `AGENTS.md` desde cero (solo se enmienda si ya existe) ni editar otras secciones suyas.
- Validar el contenido de la constitución (eso lo hace `sdd validate`/el agente) ni interpolar el
  nombre del proyecto en `<nombre del proyecto>`.
- Cambios en `sdd validate`, `sdd new`, `sdd plan` o `sdd tasks`.
- Migrar constituciones existentes (p. ej. adaptar la de gastos-casa): se conservan tal cual.

## Criterios de finalización

1. En un directorio vacío con un `AGENTS.md` sin menciones, `node dist/index.js init` emite el
   bloque exacto del RF-6, crea `docs/constitution.md` byte a byte idéntico a
   `templates/constitution.md` y deja en `AGENTS.md` la regla exacta del RF-4 al final; `$? == 0`.
2. Segunda ejecución → bloque «ya inicializado» exacto, `$? == 0`, y ambos archivos con checksum
   intacto.
3. Constitución vacía → línea `⚠`; constitución o `AGENTS.md` como directorio → error en stderr,
   `$? == 1`, nada creado.
4. `docs/` sin `docs/constitution.md` (parcial) → solo se crea el archivo con su línea «Creado».
5. Templates centralizados (constitución #3, verificable sin literales de contenido en `src/`) y
   `pnpm test`, `pnpm run build`, `pnpm run typecheck` en verde con los tests de la 001
   actualizados a los bloques nuevos.
6. `node dist/index.js validate 001|002|003|004` sigue dando LISTO (no se rompe lo ya validado).
