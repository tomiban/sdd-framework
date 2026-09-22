# Spec 002 — `sdd new <slug>`

## Contexto y objetivo

`sdd` inicializa la estructura SDD (`sdd init`, spec 001). El siguiente paso natural es poder crear
un nuevo spec desde el CLI: `sdd new <slug>` genera el scaffold `specs/NNN-<slug>/spec.md` con la
plantilla SDD lista para rellenar, calculando el número `NNN` automáticamente.

Es además el primer comando que copia **contenido de archivos**, lo que activa la constitución #3
(templates centralizados): el texto de la plantilla vive en una fuente única y el CLI la copia, sin
strings de contenido desperdigados en el código.

Objetivo: un comando no destructivo (nunca sobrescribe), sin dependencias de runtime, que cree el
scaffold de un spec e informe el resultado en castellano.

## Usuarios / actores

- **Desarrollador/a**: persona que quiere arrancar una funcionalidad nueva con el flujo SDD.

## Historias de usuario

- **H1**: Como desarrolladora, quiero ejecutar `sdd new <slug>` en un proyecto inicializado para que
  se cree el scaffold de una spec (`specs/NNN-<slug>/spec.md`) con el número y la plantilla listos.
- **H2**: Como desarrolladora, quiero que `sdd new` nunca pise una spec existente, para poder
  ejecutarlo sin miedo a perder trabajo.

## Requisitos funcionales (EARS)

- **RF-1** — CUANDO `sdd new <slug>` se ejecuta, EL SISTEMA opera sobre el directorio de trabajo
  actual (cwd) y sobre su directorio `specs/`.
- **RF-2** — CUANDO el cwd no tiene directorio `specs/` (proyecto no inicializado), EL SISTEMA
  termina con un mensaje de error en castellano que sugiere ejecutar `sdd init`, y código de salida
  != 0, sin crear nada.
- **RF-3** — CUANDO el comando se invoca sin `<slug>` o con más de un argumento, EL SISTEMA muestra
  un error de uso (`Uso: sdd new <slug>`) y termina con código de salida != 0, sin crear nada.
- **RF-4** — CUANDO `<slug>` no es un nombre válido en kebab-case, EL SISTEMA muestra un error con
  el valor recibido y la regla de formato, y termina con código de salida != 0, sin crear nada. Un
  slug es válido si matchea `^[a-z0-9]+(-[a-z0-9]+)*$`.
- **RF-5** — CUANDO `<slug>` es válido y `specs/` existe, EL SISTEMA calcula el número `NNN` del
  nuevo spec como el siguiente al prefijo numérico de 3 dígitos más alto entre los directorios
  `specs/NNN-*` existentes (001 si no hay ninguno).
- **RF-6** — CUANDO el destino `specs/NNN-<slug>/` ya existe (como directorio o como archivo),
  EL SISTEMA termina con un error que indica la ruta, código de salida != 0, y NO sobrescribe ni
  modifica nada.
- **RF-7** — CUANDO el destino no existe, EL SISTEMA crea `specs/NNN-<slug>/` y escribe en él un
  `spec.md` cuyo contenido es exactamente el de la plantilla SDD del proyecto, copiada desde la
  fuente centralizada de templates (constitución #3).
- **RF-8** — MIENTRAS `sdd new <slug>` tiene éxito, EL SISTEMA muestra en stdout, en castellano:
  ```
  Creando spec…

  ✓ Creado specs/NNN-<slug>/
  ✓ Creado specs/NNN-<slug>/spec.md

  Spec creada: specs/NNN-<slug>/
  ```
  y termina con código de salida 0.
- **RF-9** — CUANDO falla la creación del directorio o la escritura del `spec.md` (permisos, error
  de fs, template no legible), EL SISTEMA informa el error con la ruta implicada, elimina el
  directorio que, en su caso, haya creado recién para este comando, y termina con código de salida
  != 0.
- **RF-10** — En TODO caso de éxito EL SISTEMA termina con código de salida 0; en TODO caso de
  error, con código de salida != 0. La salida informativa/éxito va a stdout y los errores a stderr.

## Requisitos no funcionales

- **NFR-1** — `sdd new` no añade dependencias de runtime (solo Node estándar: `fs`/`path`).
- **NFR-2** — Todos los mensajes visibles del CLI están en castellano; los identificadores en inglés.
- **NFR-3** — La lógica pura (validación del slug, cálculo del número, paths, mensajes) es testeable
  con Vitest (constitución #4).
- **NFR-4** — La plantilla del `spec.md` vive en una fuente centralizada de templates (constitución
  #3): el comando copia el archivo; no genera el contenido desde strings del código.
- **NFR-5** — No destructivo: repetir `sdd new` con el mismo slug no modifica el scaffold existente
  (RF-6).
- **NFR-6** — El comando solo lee y escribe en `specs/` y en la fuente de templates; no recorre el
  árbol completo del proyecto.

## Casos límite

- **CL-1** — Sin `<slug>` o con argumentos extra (`sdd new`, `sdd new a b`, `sdd new --foo`):
  error de uso, nada creado (RF-3/RF-4).
- **CL-2** — Slug inválido: mayúsculas (`MisGastos`), espacios (`mi gasto`), guiones dobles
  (`mi--gasto`), guion al inicio o final (`-gasto`, `gasto-`), guion bajo (`mi_gasto`), caracteres
  acentuados o especiales (RF-4).
- **CL-3** — `specs/` inexistente: error que sugiere `sdd init` (RF-2).
- **CL-4** — `specs/` vacío → NNN = 001; `specs/` solo con `001–x` → NNN = 002; sin directorios con
  prefijo numérico de 3 dígitos → NNN = 001 (RF-5).
- **CL-5** — Existe un directorio/archivo de nombre `NNN-<slug>` (mismo slug o colisión fs):
  error «ya existe», sin sobrescribir (RF-6).
- **CL-6** — Número agotado: si el prefijo numérico más alto es 999, el siguiente sería 1000, que
  no cabe en la convención de 3 dígitos → error claro, nada creado (RF-5).
- **CL-7** — `specs/` no escribible (permisos): error con la ruta, nada creado (RF-9).
- **CL-8** — Fallo al copiar el template (p. ej. archivo de template ilegible o borrado): error con
  la ruta y eliminación del directorio recién creado (RF-9).
- **CL-9** — `sdd new init`: `init` es un slug válido; se crea `specs/NNN-init/` sin conflicto con
  el comando `init` (el dispatch de comandos del CLI trata `new <slug>` como operación propia).

## Fuera de alcance

- Flags de ayuda/versión (`--help`, `--version`).
- Editar, renombrar o eliminar specs existentes.
- Interpolación/placeholders en la plantilla (el `spec.md` generado repite la plantilla tal cual;
  el rellenado lo hace la persona al editar).
- Resto de comandos del CLI (`status`, `validate`, …) y el flujo por fases (los agentes SDD siguen
  encargándose de redactar contenido).
- Generación de archivos en `.opencode/`.
- Integración con git.

## Criterios de finalización

1. En un proyecto inicializado, `node dist/index.js new lista-gastos` crea `specs/002-lista-gastos/`
   con un `spec.md` byte a byte idéntico a la plantilla centralizada, emite la salida exacta del
   RF-8 y termina con código 0.
2. Repetir el mismo comando → error «ya existe» en stderr, código 1, y el `spec.md` existente no se
   modifica.
3. `sdd new` en un proyecto sin `specs/` → error que sugiere `sdd init`, código 1, nada creado.
4. Slug inválido, sin slug o argumentos extra → error de uso, código 1, nada creado.
5. La plantilla se copia desde la fuente centralizada (constitución #3): verificable con un test que
   compara el archivo generado con el template, y sin literales de contenido fuera de `templates/`.
6. La lógica pura (slug, número, paths, mensajes) tiene tests Vitest en verde; `pnpm test`,
   `pnpm run build` y `pnpm run typecheck` pasan.