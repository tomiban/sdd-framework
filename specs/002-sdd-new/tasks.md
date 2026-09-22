# Tasks — Spec 002 `sdd new <slug>`

> Orden de dependencia obligatorio. Cada tarea deja `pnpm test`, `pnpm run typecheck` y
> `pnpm run build` en verde. Rama sugerida: `feat/002-sdd-new`.

## T1 — Lógica pura del número y del slug

**RF:** RF-4 · RF-5 · CL-2 · CL-4 · CL-6 · QA A2/A3 · NFR-3

- Crear `src/lib/spec.ts`: `SPEC_SLUG_PATTERN` (`^[a-z0-9]+(-[a-z0-9]+)*$`), `isValidSlug(slug)`,
  `nextSpecNumber(entries: string[])` — el siguiente al máximo prefijo `^\d{3}-` + 1 con ceros a la
  izquierda (001 si no hay ninguno; `{ ok: false, reason: "limit" }` si el máximo es 999) e ignora
  nombres sin prefijo NNN — y `specDirName(nnn, slug)`.
- Tests `tests/spec.test.ts`: slugs válidos e inválidos (CL-2 completo: mayúsculas, espacios,
  `--`, guiones al inicio/fin, `_`, acentos); `nextSpecNumber` con arrays (vacío → 001; `001-x` →
  002; `001-b, 003-a` → 004; sin prefijo → 001; 999 → error).

**Hecho cuando:**
- [x] `isValidSlug` distingue correctamente los slugs del CL-2 sobre un fixture de casos
- [x] `nextSpecNumber` devuelve 001 sin specs, bumpéa por el máximo y falla en 999
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T2 — Template centralizado + manifiesto

**RF:** RF-7 · NFR-4 · QA A4 · constitución #3

- Crear `templates/spec.md` con la plantilla SDD en castellano (secciones: Contexto y objetivo ·
  Usuarios/actores · Historias de usuario · Requisitos funcionales (EARS) · Requisitos no
  funcionales · Casos límite · Fuera de alcance · Criterios de finalización), con marcadores
  vacíos listos para rellenar; sin interpolación.
- Crear `src/lib/templates.ts`: manifiesto `[{ dest: "spec.md", source: "spec.md" }]`,
  `findTemplate(dest)` y `resolveTemplateSource(source)` vía
  `new URL("../../templates/…", import.meta.url)` (funciona igual
  desde `src/` y `dist/`; nunca relativo al cwd).
- Tests `tests/templates.test.ts`: el path resuelto existe y su contenido contiene los encabezados
  `## ` de las 8 secciones.

**Hecho cuando:**
- [x] `templates/spec.md` existe con las 8 secciones de la plantilla SDD
- [x] `resolveTemplateSource` apunta a un archivo real desde tests y desde `dist/` (verificar con el
  build)
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T3 — Lógica de creación + mensajes

**RF:** RF-1…RF-10 · QA A1/A5/A7/A8 · NFR-2

- Extender `src/lib/messages.ts` con `newTitle()`, `newCreatedDir(path)`, `newCreatedFile(path)`,
  `newSuccess(path)`, `newMissingSlug()`, `newInvalidSlug(slug)`, `newNotInitialized()`,
  `newExists(path)`, `newLimit()`, `newWriteError(path, detail)` (castellano, `…` U+2026).
- Crear `src/lib/new.ts`: `createSpec({ root, slug, args, templatePath? })` → `NewResult` con
  precondiciones en orden QA A1 (args → slug válido → `specs/` existe → destino no existe → crear +
  copiar) y rollback (QA A5): si la copia falla, elimina el directorio recién creado y reporta el
  error con la ruta. `templatePath` inyectable para tests.
- Tests `tests/new.test.ts` con tmp dirs reales: crea dir + spec.md byte a byte igual al template,
  líneas exactas del RF-8 y exitCode 0; repetir → `newExists` sin sobrescribir; sin `specs/` →
  `newNotInitialized`; slug inválido / sin slug / args extra → errores; dos slugs seguidos numeran
  002 y 003; `templatePath` inexistente → error con ruta y directorio eliminado (rollback).

**Hecho cuando:**
- [x] `createSpec` crea el scaffold con el contenido exacto del template (byte a byte)
- [x] Fallo de copia → rollback del directorio y error con ruta (verificado en tmp dirs)
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde

## T4 — CLI: dispatch de `new` + verificación manual

**RF:** RF-1 · RF-3 · RF-10 · QA A6/A9 · NFR-2

- En `src/index.ts`, añadir el dispatch: `sdd new <slug>` (hasta 1 argumento; si falta o sobran →
  error uso; `--foo` → error de formato), reutilizando `initialize` para `init` (por defecto).
- Verificación manual (criterios 1–4): en un proyecto inicializado, `node dist/index.js new
  lista-gastos` → `specs/002-lista-gastos/` con `spec.md` == template, salida exacta RF-8, `$? == 0`;
  repetir → error «ya existe» + `$? == 1` sin sobrescribir; sin `specs/` → sugerencia de init +
  `$? == 1`; slug inválido / sin slug → error uso + `$? == 1` sin crear nada.

**Hecho cuando:**
- [x] `node dist/index.js new <slug>` reproduce la salida del RF-8 y el scaffold con `$? == 0`
- [x] Casos de error (repetido, sin specs/, slug inválido) → stderr + `$? == 1` sin crear nada
- [x] `pnpm test`, `pnpm run typecheck` y `pnpm run build` en verde