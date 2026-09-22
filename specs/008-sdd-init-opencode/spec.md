# Spec 008 — `sdd init` popula `.opencode/`

## Contexto y objetivo

`sdd init` crea `.opencode/agents|commands|skills/` **vacíos**: carpetas sin contenido no sirven de
nada (hallazgo del piloto en `/tmp/piloto`). El contenido del flujo (agentes `sdd-*`, comandos
`/sdd-*`, skill `sdd`) vive en este repo pero `init` no lo instala. Este spec cierra el hueco:
`init` copia el árbol `templates/opencode/` dentro de `.opencode/` del proyecto, **solo los
archivos que falten** (nunca sobrescribe los del usuario), igual que ya hace con la constitución y
`AGENTS.md`.

## Usuarios / actores

- **Desarrollador/a**: ejecuta `sdd init` y espera el flujo SDD operativo de inmediato (estructura +
  constitución + `AGENTS.md` + agentes/comandos de OpenCode).

## Historias de usuario

- **H1**: Como desarrolladora, quiero que `sdd init` deje `.opencode/` con los agentes y comandos
  del flujo, para usar `/sdd-spec`, `/sdd-quick`… sin copias manuales.

## Requisitos funcionales (EARS)

- **RF-1** — CUANDO `sdd init` se ejecuta, EL SISTEMA copia en `.opencode/` del proyecto el árbol
  `templates/opencode/` (constitución #3: `agents/*.md`, `commands/*.md`, `skills/sdd/SKILL.md`),
  conservando la estructura de carpetas, **solo los archivos que no existan** en el destino.
- **RF-2** — CUANDO un archivo ya existe en `.opencode/` del proyecto (p. ej. un agente adaptado por
  el usuario), EL SISTEMA NO lo modifica ni lo informa aparte: los bloques de salida exactos de
  `sdd init` **no cambian** (el contenido forma parte de los elementos `.opencode/…` ya informados
  por las specs 001/005/006).
- **RF-3** — CUANDO falla la copia de un archivo, EL SISTEMA elimina el archivo parcial que haya
  creado, informa el error con la ruta y termina con código != 0.
- **RF-4** — El resto del comportamiento de `sdd init` (001/005/006) sigue vigente; copiar archivos
  de `.opencode/` cuenta como creación para el mensaje final («SDD inicializado correctamente.» vs
  «SDD ya está inicializado.»).

## Requisitos no funcionales

- **NFR-1** — Contenido centralizado (constitución #3): `templates/opencode/` es la única fuente; el
  `.opencode/` de este repo debe mantenerse idéntico (test de sincronía, patrón QA A2 de la 006).
- **NFR-2** — No destructivo e idempotente: repetir `init` no modifica nada.
- **NFR-3** — Sin dependencias de runtime; mensajes en castellano (sin mensajes nuevos).

## Casos límite

- **CL-1** — `.opencode/` vacío (el piloto) → se popula completo, incluida la skill anidada
  (`skills/sdd/SKILL.md`).
- **CL-2** — Archivos del usuario presentes (agentes adaptados) → intactos; solo se añaden los que
  falten.
- **CL-3** — Estado parcial (p. ej. `agents/` lleno y `commands/` vacío) → solo se copia lo faltante.
- **CL-4** — Fallo de copia (template ilegible o destino no escribible) → rollback del archivo
  parcial y error con la ruta (RF-3).

## Fuera de alcance

- Actualizar o fusionar archivos `.opencode/` existentes (solo se añaden).
- Borrar agentes/comandos sobrantes ni gestionar la config global de OpenCode (`~/.config/opencode/`).
- Cambios en los bloques de salida de `init`.

## Criterios de finalización

1. En un directorio vacío, `node dist/index.js init` deja `.opencode/` con el árbol idéntico a
   `templates/opencode/` (byte a byte, incluida la skill) y el bloque de salida exacto de siempre;
   `$? == 0`.
2. Repetir `init` → mismo bloque «ya inicializado» y checksums intactos; con archivos previos del
   usuario → conservados.
3. Test de sincronía `templates/opencode/` ≡ `.opencode/` de este repo en verde.
4. `pnpm test`, `pnpm run build` y `pnpm run typecheck` en verde.
