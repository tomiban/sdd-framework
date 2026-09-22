# Plan — Spec 005 `sdd init`: constitución + AGENTS.md

## 0. Cambios de persistencia derivados de la spec

Ninguno. Se amplía la plantilla generada en el proyecto del usuario (`docs/constitution.md`) y se
enmienda aditivamente su `AGENTS.md`: contenido del proyecto, no persistencia de la aplicación.

## 1. Resolución de ambigüedades (revisión QA de la spec)

| # | Ambigüedad / hallazgo | Resolución | RF |
|---|------------------------|------------|----|
| A1 | Orden de precondiciones con los elementos nuevos | Orden fijo: 1) argumentos → uso (prioridad máxima, A3/001); 2) conflictos de directorio (001) y de archivo (`constitution.md`/`AGENTS.md` no-archivo) → error; 3) escritura del cwd (solo si hay que crear o añadir); 4) crear directorios; 5) copiar constitución; 6) añadir regla a `AGENTS.md`; 7) líneas. | RF-3, RF-5, RF-8 |
| A2 | Texto y posición exactos de la regla | Línea literal del ejemplo del usuario («- Lee `docs/constitution.md` y la spec activa en `specs/` antes de tocar código.»), añadida **al final** del archivo con el salto de línea previo que haga falta (CL-6). | RF-4 |
| A3 | ¿Qué cuenta como «ya menciona»? | Cualquier ocurrencia de `constitution.md` sin distinguir mayúsculas (cubre `docs/constitution.md`, `Constitution.md`, `./docs/constitution.md`). | RF-5, CL-2 |
| A4 | Constitución existente pero vacía | Aviso `⚠ docs/constitution.md ya existe pero está vacío` que sustituye a la línea «ya existe»; init termina 0 (el vaciado lo caza `sdd validate` como NO LISTO, spec 004 sin cambios). | RF-2, CL-3 |
| A5 | Mensajería | `fileCreatedLine` reutilizado; `existsLine` añade barra (es para directorios) → se añade `fileExistsLine`. Nuevos: `fileConflictError`, `constitutionEmptyWarn`, `agentsRuleAddedLine`, `agentsCitedLine`, `appendError`. | NFR-2 |
| A6 | `AGENTS.md` ausente | Sin acción y **sin línea** en la salida (fuera de alcance crearlo). | RF-5, CL-1 |
| A7 | Posición de las líneas nuevas en el bloque | Al final del bloque de elementos, primero `docs/constitution.md`, luego `AGENTS.md` (si existe); en modo «ya inicializado», tras las 3 raíces. | RF-6 |
| A8 | Constitución #3 con la regla de AGENTS (una línea de contenido) | `templates/constitution.md` (copia) + `templates/agents-rule.md` (append); cero strings de contenido en `src/`. El manifiesto `TEMPLATES` gana la entrada de init; la regla se resuelve con `AGENTS_RULE_SOURCE`. | NFR-4 |
| A9 | ¿«SDD inicializado correctamente.» si solo se añadió la regla? | Sí: `createdAny` incluye la creación de la constitución y la adición de la regla. | RF-6, RF-8 |
| A10 | Conflicto de archivo simétrico al de directorio | `fileConflictError(path)` = `Error: ${path} ya existe y no es un archivo.` (junto al `conflictError` de directorio de la 001). | RF-3, RF-5 |
| A11 | Fallo de copia deja archivo parcial | Rollback: se elimina el archivo recién creado (patrón A5 de la 002 / D7 de la 003). | RF-7, CL-7 |
| A12 | *Hallazgo al correr el criterio 6*: la regla de tokens de la spec 004 (su RF-8) cuenta como declaración cualquier mención `RF-N`, incluidas las referencias a los RF de **otras** specs (la nota de supersesión citaba un RF de la 003 y `validate 005` daba NO LISTO) | Convención de redacción: en `spec.md` no se citan números de RF ajenos literalmente (se habla de «la spec 001/003» sin su numeración). Mejora futura posible: extraer solo declaraciones `**RF-N**` (fuera de alcance). | RF-8, NFR-6 |

## 2. Decisiones técnicas

- **D1** — Manifiesto de templates: `TemplatePhase` gana `"init"` con
  `{ phase: "init", dest: "docs/constitution.md", source: "constitution.md" }` y
  `AGENTS_RULE_SOURCE = "agents-rule.md"` (contenido que se añade, no se copia). Cubre RF-1, NFR-4.
- **D2** — `src/lib/state.ts` gana `fileStatus(path)` → `"missing" | "exists" | "conflict"`
  (conflict = existe y no es archivo); `init` lee el contenido solo para el vacío (CL-3) y la cita
  (A3). Cubre RF-2, RF-3, RF-5, NFR-3.
- **D3** — `src/lib/init.ts` amplía `initialize` con el flujo A1, `templatePath` inyectable en
  `InitOptions` (para el fallo de copia, CL-7) y `buildLines` con las líneas de archivo (A7) y el
  estado `created|exists|empty` / `absent|cited|appended`. Cubre RF-1…RF-8.
- **D4** — Mensajes nuevos en `src/lib/messages.ts` (A5). Cubre RF-2…RF-5, RF-7, NFR-2.
- **D5** — La regla de `AGENTS.md` se añade con `appendFile` (una escritura, aditiva) sobre el
  contenido leído; si el contenido no acaba en `\n` se antepone uno (CL-6). Cubre RF-4, NFR-5.
- **D6** — `templates/constitution.md`: título `# Constitution — <nombre del proyecto>`, preámbulo
  y 6 principios genéricos del flujo SDD con «Verificable:» (decisión de la entrevista:
  principios reales, no esqueleto; el proyecto los adapta). Cubre RF-1, H1.

## 3. Modelo de datos y contratos

```jsonc
// src/lib/templates.ts (ampliación)
{
  "TemplatePhase": "new" | "plan" | "tasks" | "init",
  "TEMPLATES": [ …, { "phase": "init", "dest": "docs/constitution.md", "source": "constitution.md" } ],
  "AGENTS_RULE_SOURCE": "agents-rule.md"   // contenido de append para AGENTS.md
}

// src/lib/state.ts (ampliación)
{ "fileStatus(path): \"missing\" | \"exists\" | \"conflict\"" }

// src/lib/init.ts — estados de archivo en buildLines
{
  "constitutionLine": "\"created\" | \"exists\" | \"empty\"",   // createdLine | existsLine | constitutionEmptyWarn
  "agentsLine": "\"absent\" | \"cited\" | \"appended\"",        // —      | agentsCitedLine | agentsRuleAddedLine
}

// src/lib/messages.ts (nuevos)
{
  "fileExistsLine(path)": "✓ ${path} ya existe",   // existsLine añade barra: es para directorios
  "fileConflictError(path)": "Error: ${path} ya existe y no es un archivo.",
  "constitutionEmptyWarn()": "⚠ docs/constitution.md ya existe pero está vacío",
  "agentsRuleAddedLine()": "✓ Añadida la regla de constitución a AGENTS.md",
  "agentsCitedLine()": "✓ AGENTS.md ya cita docs/constitution.md",
  "appendError(path, detail)": "Error: no se pudo actualizar ${path}: ${detail}"
}

// src/lib/init.ts — InitOptions gana `templatePath?: URL` (inyectable para CL-7)
```

## 4. Estrategia de tests

- `tests/init.test.ts` (tmp dirs reales, como hoy): FIRST_RUN/SECOND_RUN actualizados a los
  bloques nuevos (fixture sin `AGENTS.md` y con él); constitución creada byte a byte vs template;
  existente intacta (checksum); vacía → `⚠`; `constitution.md`/`AGENTS.md` como directorio → error
  y nada creado; parcial `docs/` sin constitución; `AGENTS.md` sin cita → regla añadida al final
  (exacta) y segunda pasada «ya cita»; `AGENTS.md` sin `\n` final; permisos de escritura (skip
  root).
- `tests/templates.test.ts` (+): entrada de init en el manifiesto, `agents-rule.md` con la línea
  exacta, `constitution.md` con los 6 principios («Verificable:»).
- `tests/messages.test.ts` (+): textos nuevos.
- E2E manual del binario (criterios 1–4) + regresión `validate 001…004` (criterio 6).

## 5. Cobertura

| RF | Módulo(s) | Test(s) |
|----|-----------|---------|
| RF-1 | `templates.ts` + `init.ts` | `tests/init.test.ts` (byte a byte) · `tests/templates.test.ts` |
| RF-2 | `init.ts` | `tests/init.test.ts` (existente intacta, vacía → `⚠`) |
| RF-3 | `state.fileStatus` + `init.ts` | `tests/init.test.ts` (directorio) · `tests/messages.test.ts` |
| RF-4 | `init.ts` (append) | `tests/init.test.ts` (regla exacta, sin `\n` final) · `tests/messages.test.ts` |
| RF-5 | `init.ts` | `tests/init.test.ts` (citada, ausente, directorio) |
| RF-6 | `init.ts` (`buildLines`) | `tests/init.test.ts` (bloques exactos FIRST/SECOND/parcial) |
| RF-7 | `init.ts` | `tests/init.test.ts` (rollback, permisos AGENTS) |
| RF-8 | `init.ts` + `index.ts` | tests existentes de la 001 (actualizados solo en bloques) + E2E |

Todos los RF quedan cubiertos por las tareas T1–T3 (ver `tasks.md`).
