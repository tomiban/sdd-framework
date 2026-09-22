# Plan — Spec 008 `sdd init` popula `.opencode/`

## 0. Cambios de persistencia derivados de la spec

Ninguno. Se amplía el contenido generado en el proyecto del usuario (`.opencode/`).

## 1. Resolución de ambigüedades (revisión QA de la spec)

| # | Ambigüedad / hallazgo | Resolución | RF |
|---|------------------------|------------|----|
| A1 | ¿Líneas de salida por archivo copiado? | Ninguna: 16+ archivos serían ruido y forzarían una 4ª sustitución de los bloques exactos; el contenido forma parte de los elementos `.opencode/…` ya informados (RF-2). | RF-2 |
| A2 | Duplicación `templates/opencode/` ≡ `.opencode/` del repo | Se acepta con **test de sincronía** byte a byte (patrón QA A2 de la 006). | NFR-1 |
| A3 | Mecanismo de copia de árboles en el manifiesto | `TemplateEntry` gana `kind: "file" | "tree"` (por defecto `file`); el árbol se recorre y cada archivo se copia por ruta relativa. | RF-1 |
| A4 | ¿«createdAny» cuenta las copias del árbol? | Sí (coherente con A9 de la 005): si solo faltaban archivos de `.opencode/`, el mensaje es «SDD inicializado correctamente.» (RF-4). | RF-4 |
| A5 | Rollback en copias de árbol | Por archivo (patrón A11 de la 005 / A6 de la 006): se elimina el archivo parcial propio; los ya copiados se conservan (best-effort por elemento). | RF-3, CL-4 |

## 2. Decisiones técnicas

- **D1** — `templates/opencode/{agents,commands,skills}` como masters (copiados del `.opencode/` de
  este repo). Cubre RF-1, NFR-1.
- **D2** — `src/lib/templates.ts`: `TemplateEntry.kind` y entrada
  `{ phase: "init", dest: ".opencode", source: "opencode", kind: "tree" }`. Cubre RF-1, A3.
- **D3** — `src/lib/init.ts`: el bucle de plantillas resuelve `kind: "tree"` recorriendo la fuente
  (`readdir` recursivo) y copiando solo archivos ausentes, con rollback por archivo (A5) y
  `createdAny` ampliado (A4). Sin mensajes nuevos. Cubre RF-1…RF-4.
- **D4** — `tests/templates.test.ts` (+): test de sincronía recursivo `templates/opencode/` ≡
  `.opencode/` (A2).

## 3. Modelo de datos y contratos

```jsonc
// src/lib/templates.ts (ampliación)
{
  "TemplateEntry": {
    "phase": "new" | "plan" | "tasks" | "init",
    "dest": "spec.md",           // relativo al destino de la fase
    "source": "spec.md",         // relativo a templates/
    "kind": "file" | "tree"      // opcional; por defecto "file"
  },
  "TEMPLATES": [ …, { "phase": "init", "dest": ".opencode", "source": "opencode", "kind": "tree" } ]
}
```

## 4. Estrategia de tests

- `tests/init.test.ts` (+): CL-1 (piloto: `.opencode/` vacío → árbol completo, skill incluida,
  byte a byte); CL-2 (archivo del usuario intacto + faltantes copiados); CL-3 (parcial); CL-4
  (fallo con `templatePath` inválido → rollback). Los fixtures de estado completo pasan a usar un
  `initialize()` previo (bootstrap realista, A4).
- `tests/templates.test.ts` (+): sincronía recursiva (A2) y entrada `kind: "tree"` en el manifiesto.

## 5. Cobertura

| RF | Módulo(s) | Test(s) |
|----|-----------|---------|
| RF-1 | `templates.ts` + `init.ts` | `tests/init.test.ts` (CL-1, CL-3) |
| RF-2 | `init.ts` | `tests/init.test.ts` (bloques sin cambios, CL-2) |
| RF-3 | `init.ts` | `tests/init.test.ts` (CL-4) |
| RF-4 | `init.ts` | `tests/init.test.ts` (A4) |
| NFR-1 | `templates.ts` | `tests/templates.test.ts` (sincronía) |
