# Plan — Spec 007 `sdd status`

## 0. Cambios de persistencia derivados de la spec

Ninguno: el comando es de solo lectura.

## 1. Resolución de ambigüedades (revisión QA de la spec)

| # | Ambigüedad / hallazgo | Resolución | RF |
|---|------------------------|------------|----|
| A1 | ¿«lista» exige tasks con checkboxes? | Sí: 3 fases presentes + ≥1 checkbox + 0 pendientes (CL-3). | RF-4 |
| A2 | ¿`tasks ✗ n/m` cuando falta el archivo? | Sin conteo: `tasks ✗` (CL-3). | RF-3 |
| A3 | ¿Plurales del resumen y de faltantes? | Singular/plural según cantidad (`1 spec · 1 lista`, `falta …`/`faltan …`). | RF-2, RF-4 |
| A4 | Nombres de raíces en la línea de estructura | Derivados de `SDD_STRUCTURE` (NFR-3). | RF-2 |
| A5 | Código de salida ante proyecto sin inicializar | 0: informar es el trabajo del comando; 1 solo para errores de uso (RF-5). | RF-1, RF-5 |
| A6 | Conteo de tareas | `parseTasks` de `analysis.ts` (checkboxes ↔ bloques `## Tn`), sin duplicar lógica. | RF-3 |

## 2. Decisiones técnicas

- **D1** — `src/lib/status.ts`: `statusReport({ root, args })` → `{ ok, lines, exitCode }` (mismo
  shape que `ValidateResult`); reutiliza `detectInitState`/`fileStatus`, `flattenStructure`,
  `parseTasks`. Cubre RF-1…RF-5.
- **D2** — Mensajes nuevos en `src/lib/messages.ts` (`statusTitle`, `structureOk`,
  `notInitializedLine`, `structureIncomplete`, `constitutionStatusLine`, `agentsStatusLine`,
  `specStatusLine`, `noSpecsLine`, `statusSummary`, `statusUsageError`) y actualización de
  `unknownCommandError` (RF-6). Cubre RF-2…RF-6.
- **D3** — «Lista» se calcula en `src/lib/status.ts` (`isSpecReady`) con lógica pura testeable.
- **D4** — Dispatch `status` en `src/index.ts` (sin argumentos).

## 3. Modelo de datos y contratos

```jsonc
// src/lib/status.ts
{
  "isSpecReady(spec: boolean, plan: boolean, tasks: TaskSummary | null): boolean",
  // statusReport({ root, args }): Promise<{ ok: true, lines, exitCode: 0 } | { ok: false, message, exitCode: 1 }>
}

// src/lib/messages.ts (nuevos)
{
  "statusTitle()": "Estado SDD…",
  "structureOk(roots)": "✓ Estructura: docs/ · specs/ · .opencode/",
  "notInitializedLine()": "✗ Proyecto sin inicializar. Ejecuta primero: sdd init",
  "structureIncomplete(missing)": "✗ Estructura incompleta: faltan specs/, …",
  "constitutionStatusLine(present)": "✓ docs/constitution.md" | "✗ falta docs/constitution.md",
  "agentsStatusLine(present)": "✓ AGENTS.md" | "✗ falta AGENTS.md",
  "specStatusLine(dir, spec, plan, tasks)": "specs/001-x — spec ✓ · plan ✗ · tasks ✓ 2/3",
  "noSpecsLine()": "sin specs todavía",
  "statusSummary(total, ready)": "2 specs · 1 lista",
  "statusUsageError()": "Error: argumentos no soportados.\\nUso: sdd status"
}
```

## 4. Estrategia de tests

- `tests/status.test.ts` (tmp dirs): bloque exacto LISTO de referencia (CL-5), proyecto vacío
  (CL-1), parcial (CL-2), fases incompletas y `0/0` (CL-3), pendientes `2/3` (CL-4), args (CL-6);
  exitCode en todos; `isSpecReady` como puro.
- `tests/messages.test.ts` (+): textos nuevos con plurales y el RF-6.

## 5. Cobertura

| RF | Módulo(s) | Test(s) |
|----|-----------|---------|
| RF-1 | `status.ts` | `tests/status.test.ts` (bloque exacto) |
| RF-2 | `status.ts` + `state.ts` | `tests/status.test.ts` (CL-1, CL-2) |
| RF-3 | `status.ts` + `analysis.parseTasks` | `tests/status.test.ts` (CL-3, CL-4) |
| RF-4 | `status.isSpecReady` | `tests/status.test.ts` (CL-3…CL-5) |
| RF-5 | `status.ts` | `tests/status.test.ts` (CL-6) |
| RF-6 | `messages.ts` | `tests/messages.test.ts` |
