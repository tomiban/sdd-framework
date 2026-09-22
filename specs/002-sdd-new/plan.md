# Plan — Spec 002 `sdd new <slug>`

## 0. Cambios de persistencia derivados de la spec

Ninguno (sdd no persiste datos). El comando escribe en `specs/` del cwd del usuario, que es
contenido del proyecto, no persistencia de la aplicación: sin base de datos ni storage.

## 1. Resolución de ambigüedades (revisión QA de la spec)

| # | Ambigüedad / hallazgo | Resolución | RF |
|---|------------------------|------------|----|
| A1 | Orden de las precondiciones sin definir entre sí (sin slug vs slug inválido vs no inicializado) | Orden fijo: 1) argumentos (sin slug o extra) → error uso; 2) slug inválido → error de formato; 3) `specs/` inexistente → sugerir `sdd init`; 4) destino existente → «ya existe»; 5) crear/copiar con rollback. | RF-2, RF-3, RF-4, RF-6 |
| A2 | Directorios sin prefijo NNN dentro de `specs/` (p. ej. `plantillas/`) | Se ignoran para el cálculo del número: solo cuentan los prefijos `^\d{3}-`. | RF-5 |
| A3 | El `NNN` se expresa como string de 3 dígitos con ceros a la izquierda (001, 002… 999) | Sí: `padStart(3, "0")`. Si el máximo es 999 → error «número de spec agotado» sin crear nada (CL-6). | RF-5, CL-6 |
| A4 | Ruta del template: el CLI lee su propia plantilla, que NO depende del cwd del usuario | La plantilla vive en `templates/spec.md` en la raíz del paquete y se resuelve relativa al módulo (`new URL("../../templates/spec.md", import.meta.url)`), válido igual desde `src/` (dev/tests) y desde `dist/` (build). Nunca relativo al cwd. | RF-7, NFR-4 |
| A5 | Fallo de copia: ¿qué pasa con el directorio recién creado? | Rollback: se elimina el directorio creado por este comando (vacío) y se reporta el error con la ruta. Si el rollback falla, se reporta el error original. | RF-9 |
| A6 | `sdd new --foo`: ¿flag o slug inválido? | Es un slug inválido (no matchea kebab-case) → error de formato RF-4. No hay flags soportados. | RF-4, CL-1 |
| A7 | ¿Comprobación previa de escritura de `specs/`? | No hace falta pre-check: se intenta mkdir/escribir y ante error de fs se aplica rollback + error con ruta (RF-9); más simple y robusto que `access`. | RF-9 |
| A8 | ¿`createSpec` debe también validar el slug y los argumentos? | Su función de biblioteca sigue el mismo orden de precondiciones (A1), recibiendo `args` — defensa en profundidad además del dispatch del CLI. | RF-3, RF-4 |
| A9 | Salida RF-8: `Spec creada: specs/NNN-<slug>/` con barra final | Consistente con la convención de `init` (slash final en rutas de la salida). | RF-8 |
| A10 | *Revelada en T3*: repetir el mismo slug con número distinto (002 → 003) no dispara RF-6 por ruta, así que la repetición creaba una spec nueva | El destino se comprueba también por slug: si existe `^\d{3}-<slug>$` en `specs/` → error «ya existe» sin crear nada (criterio #2 de finalización). Bug detectado por test: `rm` de rollback sobre un directorio exige `recursive: true` (si no lanza EISDIR y el directorio queda huérfano). | RF-6, NFR-5 |

## 2. Decisiones técnicas

- **D1** — Dispatch de comandos en `src/index.ts`: `init` (por defecto, D9 de la spec 001) y
  `new <slug>`. `new` no acepta otros subcomandos ni flags. Cubre RF-1, RF-3, RF-10.
- **D2** — Módulo puro `src/lib/spec.ts`: `SPEC_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/`,
  `isValidSlug(slug)`, `nextSpecNumber(entries)` (max `^\d{3}-` + 1, con límite 999 y ceros a la
  izquierda) y `specDirName(nnn, slug)`. Recibe la lista de nombres de directorio como parámetro
  para ser testeable sin fs. Cubre RF-4, RF-5, CL-4, CL-6.
- **D3** — Template centralizado (constitución #3): el contenido del `spec.md` generado vive en
  `templates/spec.md`; `src/lib/templates.ts` expone el manifiesto (`{ dest: "spec.md",
  source: "spec.md" }`) y `resolveTemplatePath()` con `import.meta.url` (A4). El comando copia bytes;
  no hay strings de contenido en el código. Cubre RF-7, NFR-4.
- **D4** — `src/lib/new.ts`: `createSpec({ root, slug, args, templatePath? })` → `NewResult`
  (`{ ok, lines, exitCode }` | `{ ok: false, message, exitCode: 1 }`) siguiendo el orden de A1 y con
  rollback de A5. `templatePath` es inyectable para testear el fallo de copia. Cubre RF-1…RF-10.
- **D5** — Mensajes nuevos en `src/lib/messages.ts` (módulo único, QA A10 de spec 001):
  `newTitle()`, `newCreatedDir(path)`, `newCreatedFile(path)`, `newSuccess(path)`,
  `newMissingSlug()`, `newInvalidSlug(slug)`, `newNotInitialized()`, `newExists(path)`,
  `newLimit()`, `newWriteError(path, detail)`. Cubre RF-2…RF-9, NFR-2.
- **D6** — El "número NNN" se calcula leyendo `specs/` del cwd (readdir) en `createSpec` y pasando
  los nombres a `nextSpecNumber`. Cubre RF-5, NFR-6.

## 3. Modelo de datos y contratos

```jsonc
// src/lib/spec.ts
{
  "SPEC_SLUG_PATTERN": "/^[a-z0-9]+(-[a-z0-9]+)*$/",
  "MAX_SPEC_NUMBER": 999,
  "isValidSlug(slug): boolean"
  // nextSpecNumber(entries: string[]): { ok: true, nnn: "001" } | { ok: false, reason: "limit" }
  // specDirName(nnn, slug): "002-lista-gastos"
}

// src/lib/templates.ts
{
  "TemplateEntry": { "dest": "spec.md", "source": "spec.md" },
  "resolveTemplatePath(entry): URL" // new URL("../../templates/<source>", import.meta.url)
}

// src/lib/new.ts — NewResult
{
  "NewResult":
    { "ok": true,  "lines": ["Creando spec…", "", "✓ Creado specs/NNN-<slug>/",
                            "✓ Creado specs/NNN-<slug>/spec.md", "", "Spec creada: specs/NNN-<slug>/"],
      "exitCode": 0 }
    | { "ok": false, "message": "Error: …\nUso: sdd new <slug>", "exitCode": 1 }
}
```

## 4. Estrategia de tests

- Directorios temporales reales (`mkdtemp` en `os.tmpdir()`, limpieza en `afterEach`), como en la
  spec 001.
- `tests/spec.test.ts`: `isValidSlug` (válidos e inválidos del CL-2); `nextSpecNumber` con arrays de
  nombres (vacío → 001; `001-x` → 002; `003-a, 001-b` → 004; máx 999 → error limit; nombres sin
  prefijo NNN ignorados); `specDirName`.
- `tests/templates.test.ts`: el manifiesto resuelve a un archivo existente cuyo contenido tiene las
  secciones de la plantilla SDD (encabezados `## `); desde `src/` (misma profundidad que `dist/`).
- `tests/new.test.ts` (integración): proyecto inicializado → crea dir + spec.md byte a byte igual al
  template, líneas exactas RF-8, exitCode 0; repetir → `newExists`, exitCode 1, sin sobrescribir;
  sin `specs/` → `newNotInitialized`; slug inválido/sin slug/args extra → errores de uso/formato;
  colisión de slug con otro NNN (number fue bumpéado): `sdd new a` → 002, `sdd new b` → 003;
  rollback: `templatePath` inexistente → error con ruta y el directorio no queda en disco.
- Verificación E2E manual del bin (criterios 1–4 de la spec) en `dist/`.

## 5. Cobertura

| RF | Módulo(s) | Test(s) |
|----|-----------|---------|
| RF-1 | `src/index.ts` (CLI) | manual E2E |
| RF-2 | `src/lib/new.ts` | `tests/new.test.ts` (sin specs/) |
| RF-3 | `src/index.ts` + `src/lib/new.ts` | `tests/new.test.ts` (sin slug, args extra) |
| RF-4 | `src/lib/spec.ts` + `src/lib/new.ts` | `tests/spec.test.ts`, `tests/new.test.ts` |
| RF-5 | `src/lib/spec.ts` | `tests/spec.test.ts` (CL-4, CL-6) |
| RF-6 | `src/lib/new.ts` | `tests/new.test.ts` (repetir, colisión) |
| RF-7 | `src/lib/templates.ts` + `src/lib/new.ts` | `tests/templates.test.ts`, `tests/new.test.ts` (byte a byte) |
| RF-8 | `src/lib/messages.ts` + `src/lib/new.ts` | `tests/new.test.ts`, `tests/messages.test.ts` |
| RF-9 | `src/lib/new.ts` | `tests/new.test.ts` (permisos/fallo, rollback) |
| RF-10 | `src/lib/new.ts` | todos los casos de `tests/new.test.ts` |

Todos los RF quedan cubiertos por las tareas T1–T4 (ver `tasks.md`).