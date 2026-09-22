# Plan — Spec 006 `sdd init` crea `AGENTS.md`

## 0. Cambios de persistencia derivados de la spec

Ninguno. Se amplía el contenido generado en el proyecto del usuario (`AGENTS.md`).

## 1. Resolución de ambigüedades (revisión QA de la spec)

| # | Ambigüedad / hallazgo | Resolución | RF |
|---|------------------------|------------|----|
| A1 | Orden del flujo | Dentro del paso de plantillas de init (005): se copian, en orden del manifiesto, las plantillas cuyo destino falta (`docs/constitution.md`, `AGENTS.md`), con rollback por archivo; después, la enmienda aditiva de `AGENTS.md` solo si ya existía sin cita. | RF-1, RF-2, RF-4 |
| A2 | La línea de la regla vive en dos plantillas (`agents-rule.md` para enmienda, `agents.md` para creación) | Se acepta la duplicación dentro de `templates/` con **test de sincronía**: `agents.md` debe contener la línea exacta de `agents-rule.md`. | NFR-2 |
| A3 | Estados de `AGENTS.md` | `created` (recién copiado) | `cited` (existía con mención) | `appended` (existía sin cita y se le añadió la regla). El estado `absent` desaparece: siempre queda `AGENTS.md`. | RF-1…RF-3 |
| A4 | `AGENTS.md` vacío | Cuenta como sin cita → se le añade la regla (CL-5). | RF-2 |
| A5 | Bloques de salida | Primera ejecución = bloque de la 005 con la línea de AGENTS (`✓ Creado AGENTS.md` / regla añadida / ya cita) siempre presente; segunda ejecución = bloque de la 005 sin cambios. | RF-3 |
| A6 | Fallo al copiar `AGENTS.md` después de haber creado la constitución | Rollback solo del archivo propio (patrón 005/A11): la constitución ya creada se conserva (best-effort por elemento, sin rollback entre elementos, 001/D6). | RF-4 |

## 2. Decisiones técnicas

- **D1** — `templates/agents.md` con la forma del AGENTS.md del equipo (título, descripción,
  conventions, pitfalls, `## Reglas` con 3 reglas, la primera = lectura de la constitución) y
  marcas `<…>` para que el proyecto lo adapte. Cubre RF-1, H1.
- **D2** — `src/lib/templates.ts`: entrada `{ phase: "init", dest: "AGENTS.md", source: "agents.md" }`
  en `TEMPLATES` (la copia la decide init por estado de destino). Cubre RF-1, NFR-2.
- **D3** — `src/lib/init.ts`: `AgentsStatus = "created" | "cited" | "appended"`; el bucle de
  plantillas de init copia las faltantes con rollback por archivo (A1/A6) y `buildLines` emite la
  línea correspondiente. `createdAny` incluye `created`. Cubre RF-1…RF-5.
- **D4** — Sin mensajes nuevos: `fileCreatedLine("AGENTS.md")` produce `✓ Creado AGENTS.md`.

## 3. Modelo de datos y contratos

```jsonc
// src/lib/templates.ts (ampliación)
{ "TEMPLATES": [ …, { "phase": "init", "dest": "AGENTS.md", "source": "agents.md" } ] }

// src/lib/init.ts
{ "AgentsStatus": "\"created\" | \"cited\" | \"appended\"" }   // absent eliminado (A3)
```

## 4. Estrategia de tests

- `tests/init.test.ts`: FIRST_RUN con `✓ Creado AGENTS.md` (y creado byte a byte == template);
  segunda ejecución sin cambios; preexistente sin cita → regla añadida (una vez); con cita →
  intacto; vacío → regla añadida (CL-5); como directorio → error (CL-3); rollback con
  `templatePath` inválido (CL-4, ambos archivos ausentes).
- `tests/templates.test.ts` (+): entrada de `agents.md`, contenido con `## Reglas` y **sincronía**
  con la línea de `agents-rule.md` (A2).

## 5. Cobertura

| RF | Módulo(s) | Test(s) |
|----|-----------|---------|
| RF-1 | `templates.ts` + `init.ts` | `tests/init.test.ts` (byte a byte) · `tests/templates.test.ts` |
| RF-2 | `init.ts` | `tests/init.test.ts` (sin cita / con cita / vacío) |
| RF-3 | `init.ts` (`buildLines`) | `tests/init.test.ts` (bloques exactos) |
| RF-4 | `init.ts` | `tests/init.test.ts` (rollback) |
| RF-5 | `init.ts` + `index.ts` | tests existentes de 001/005 (sin cambios) |
