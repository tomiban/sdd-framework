# Spec 001 — `sdd init`

## Contexto y objetivo

`sdd` es un CLI de Spec-Driven Development para Node/TypeScript. `sdd init` es el primer comando:
inicializa en el directorio actual la estructura de carpetas del flujo SDD (`docs/`, `specs/` y
`.opencode/` con sus subdirectorios) para que el proyecto quede listo para trabajar con specs como
fuente de verdad.

Objetivo: un comando idempotente, sin dependencias de runtime, que cree la estructura SDD e informe
claramente el resultado, sin generar contenido arbitrario desde el código (constitución #3).

## Usuarios / actores

- **Desarrollador/a**: persona que arranca un proyecto nuevo y quiere el flujo SDD listo.

## Historias de usuario

- **H1**: Como desarrolladora, quiero ejecutar `sdd init` una vez en un proyecto para que se cree la
  estructura SDD (`docs/`, `specs/`, `.opencode/` con sus subdirectorios).
- **H2**: Como desarrolladora, quiero ejecutar `sdd init` de nuevo sin que se rompa nada, para poder
  reutilizar el comando en un proyecto ya inicializado.

## Requisitos funcionales (EARS)

- **RF-1** — MIENTRAS `sdd init` se ejecuta en un directorio, EL SISTEMA opera sobre ese directorio de
  trabajo actual (cwd) y no recibe ni requiere argumentos.
- **RF-2** — CUANDO `sdd init` comienza, EL SISTEMA detecta el estado de inicialización: cuáles de los
  directorios `docs/`, `specs/` y `.opencode/` (y sus subdirectorios `agents/`, `commands/`,
  `skills/`) existen como directorios en el cwd.
- **RF-3** — CUANDO `sdd init` detecta un directorio de la estructura que NO existe, EL SISTEMA lo crea
  (docs/ → specs/ → .opencode/ → .opencode/agents/ → .opencode/commands/ → .opencode/skills/).
- **RF-4** — CUANDO `sdd init` detecta un directorio de la estructura que YA existe, EL SISTEMA no lo
  recrea ni lo modifica.
- **RF-5** — MIENTRAS `sdd init` inicializa un proyecto (crea al menos un directorio), EL SISTEMA muestra
  exactamente:
  ```
  Inicializando SDD…

  ✓ Creado docs/
  ✓ Creado specs/
  ✓ Creado .opencode/
  ✓ Creado .opencode/agents/
  ✓ Creado .opencode/commands/
  ✓ Creado .opencode/skills/

  SDD inicializado correctamente.
  ```
  usando `✓ Creado <ruta>/` por cada directorio creado y `✓ <ruta>/ ya existe` por cada directorio
  existente, y termina con código de salida 0.
- **RF-6** — CUANDO `sdd init` encuentra que los tres directorios raíz (`docs/`, `specs/`,
  `.opencode/`) ya existen como directorios, EL SISTEMA muestra exactamente:
  ```
  Inicializando SDD…

  ✓ docs/ ya existe
  ✓ specs/ ya existe
  ✓ .opencode/ ya existe

  SDD ya está inicializado.
  ```
  y termina con código de salida 0. En este caso solo se listan los directorios raíz, no sus
  subdirectorios.
- **RF-7** — CUANDO la inicialización es parcial (existen algunos directorios raíz y faltan otros o
  faltan subdirectorios), EL SISTEMA crea lo que falta, informa `✓ Creado` / `✓ ya existe` por cada
  elemento y muestra `SDD inicializado correctamente.` SI creó algún directorio, o `SDD ya está
  inicializado.` SI no creó ninguno.
- **RF-8** — ANTES de crear nada, EL SISTEMA comprueba que el cwd es escribible, y SI no lo es,
  EL SISTEMA termina con un mensaje de error claro y código de salida != 0, sin haber creado ningún
  directorio.
- **RF-9** — CUANDO existe un ARCHIVO (no directorio) cuyo nombre coincide con algún directorio de la
  estructura (`docs`, `specs`, `.opencode`, `agents`, `commands`, `skills`), EL SISTEMA termina con
  un mensaje de error claro indicando la ruta en conflicto y código de salida != 0, sin destruir ni
  modificar nada.
- **RF-10** — CUANDO `sdd init` recibe argumentos o flags no soportados, EL SISTEMA muestra un error
  con el uso del comando y termina con código de salida != 0, sin crear nada.
- **RF-11** — En TODO caso de éxito, EL SISTEMA termina con código de salida 0; en TODO caso de error,
  con código != 0.

## Requisitos no funcionales

- **NFR-1** — `sdd init` no añade dependencias de runtime (solo Node estándar: `fs`/`path`).
- **NFR-2** — Todos los mensajes visibles del CLI están en castellano; los identificadores en inglés.
- **NFR-3** — La lógica de detección de estado, creación y formateo de mensajes es pura y testeable
  con Vitest (constitución #4).
- **NFR-4** — Idempotencia (constitución #5): dos ejecuciones consecutivas de `sdd init` terminan con
  código 0 y sin efectos destructivos.
- **NFR-5** — El comando solo inspecciona y opera sobre los paths de la estructura SDD; no recorre el
  árbol completo del proyecto.

## Casos límite

- **CL-1** — cwd no escribible (permisos, read-only): error claro, código != 0, nada creado (RF-8).
- **CL-2** — Existe un archivo `docs`, `specs`, `.opencode` o cualquiera de los subdirectorios como
  archivo: error claro con la ruta, código != 0 (RF-9).
- **CL-3** — Inicialización parcial: solo existe `docs/`; o solo `specs/`; o solo `.opencode/` sin
  subdirectorios. Se crea lo que falta y se informa por elemento (RF-7).
- **CL-4** — Existe `.opencode/agents/` pero no `.opencode/` raíz: se crea el raíz y se respeta el
  subdirectorio existente; se informa `Creado .opencode/` y `ya existe .opencode/agents/`.
- **CL-5** — Doble ejecución consecutiva: la segunda muestra "ya inicializado" y código 0 (RF-6).
- **CL-6** — Ejecución con argumentos (`sdd init --foo`, `sdd init extra`): error de uso, nada creado
  (RF-10).
- **CL-7** — Proyecto sin `package.json` ni ningún marcador de proyecto Node: `sdd init` NO lo exige;
  inicializa igualmente (decisión D1).
- **CL-8** — Carácter `…` (U+2026) literal en los mensajes, no tres puntos.

El comportamiento `sdd init` en un directorio con inicialización completa pero con un subdirectorio
de `.opencode/` faltante (p. ej. falta `.opencode/skills/`) se trata como inicialización parcial
(RF-7), creando ese subdirectorio.

## Fuera de alcance

- Resto de comandos del CLI (`plan`, `tasks`, `qa`, `validate`, …) y el flujo por fases.
- Flags de ayuda/versión (`--help`, `--version`) y cualquier otra opción de `sdd init`.
- Copia de archivos plantilla o creación de contenido (constitución #3: el mecanismo de `templates/`
  se definirá cuando un comando necesite copiar archivos).
- Integración con git (inicializar repos, commits).
- Integración con agentes de `.opencode` (solo se crean los directorios).
- Validación de que el cwd sea un proyecto Node (`package.json`, etc.).

## Criterios de finalización

1. En un directorio vacío, `node dist/index.js init` muestra la salida de la primera ejecución
   (RF-5) y termina con código 0; una segunda ejecución muestra la salida "ya inicializado" (RF-6) y
   código 0.
2. Cada caso límite (CL-1…CL-8) tiene comportamiento definido y verificado.
3. La lógica pura (estado, creación, mensajes) tiene tests Vitest en verde; `pnpm test`,
   `pnpm run build` y `pnpm run typecheck` pasan.
4. No hay strings de contenido desperdigados: la estructura de la inicialización está definida en un
   único manifiesto del código (constitución #3).