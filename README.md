# sdd

CLI del **flujo SDD** (Spec-Driven Development): de la spec al código, con trazabilidad y sin
sorpresas. Diseñado para usarse junto a OpenCode, cuyos agentes (`/sdd-spec`, `/sdd-quick`, …)
siguen el mismo flujo.

- **Sin dependencias de runtime**: solo Node estándar (`fs`, `path`, `child_process`).
- **Textos en castellano**, identificadores en inglés (constitución del proyecto).
- **Idempotente y no destructivo**: repetir un comando nunca pisa trabajo existente.
- **Specs = fuente de verdad**: `specs/NNN-<slug>/spec.md` manda; el código la referencia.

## Requisitos

- Node ≥ 20 (el desarrollo usa type stripping de Node moderno).
- pnpm para trabajar en este repo (hay `pnpm-lock.yaml`: **pnpm, no npm**).

## Instalación del CLI

Cualquiera de las dos vías; **npm no es obligatorio**.

### Opción A — bash (sin npm)

Un wrapper que apunta al binario compilado:

```bash
cd ~/Proyectos/sdd && pnpm run build

mkdir -p ~/.local/bin
cat > ~/.local/bin/sdd <<'EOF'
#!/usr/bin/env bash
exec node /home/tomiban/Proyectos/sdd/dist/index.js "$@"
EOF
chmod +x ~/.local/bin/sdd
```

Asegúrate de que `~/.local/bin` está en el `PATH`. Para actualizar tras un `git pull`: `pnpm run
build` (el wrapper siempre usa `dist/`).

### Opción B — global con pnpm/npm

```bash
cd ~/Proyectos/sdd && pnpm run build
pnpm add -g .        # o: npm link
```

Esto registra el comando `sdd` (vía el campo `bin` del paquete). Para actualizar: rebuild +
reinstalar (o `npm link` de nuevo).

## Agentes y comandos de OpenCode

El repo trae `.opencode/` provisionado y `sdd init` **lo instala automáticamente** en el proyecto
(desde `templates/opencode/`, sin sobrescribir archivos tuyos). Para usar los agentes **en todos
los proyectos**:

```bash
mkdir -p ~/.config/opencode/agents ~/.config/opencode/commands
cp .opencode/agents/*.md    ~/.config/opencode/agents/
cp .opencode/commands/*.md  ~/.config/opencode/commands/
```

OpenCode descubre agentes en `~/.config/opencode/agents/<nombre>.md` (globales) y en
`.opencode/agents/<nombre>.md` (por proyecto, el proyecto pisa al global); los comandos siguen la
misma convención en `commands/`. La skill del flujo vive en `.opencode/skills/sdd/`.

| Agente | Comando | Fase |
|---|---|---|
| `sdd-spec` | `/sdd-spec` | 1 — spec (entrevista mínima, RF en EARS) |
| `sdd-qa` | `/sdd-qa` | 2 — revisión crítica (ambigüedades, casos límite) |
| `sdd-plan` | `/sdd-plan` | 3 — plan técnico (resoluciones, decisiones, contratos) |
| `sdd-tasks` | `/sdd-tasks` | 4 — tareas verificables (`Hecho cuando:`) |
| `sdd-implement` | `/sdd-implement` | 5 — implementación en orden, verdes por tarea |
| `sdd-validate` | `/sdd-validate` | 6 — validación (opcional) |
| `sdd-quick` | `/sdd-quick` | Cambios pequeños **sin** artefactos SDD |

## Uso

```bash
sdd init              # estructura + docs/constitution.md + AGENTS.md
sdd new <slug>        # specs/NNN-<slug>/spec.md (número automático)
sdd plan <NNN>        # specs/NNN-<slug>/plan.md (exige spec.md)
sdd tasks <NNN>       # specs/NNN-<slug>/tasks.md (exige plan.md)
sdd validate <NNN>    # veredicto LISTO / NO LISTO (ejecuta los verdes de sdd.json)
sdd status            # vista del flujo en solo lectura
```

`sdd init` es idempotente y **nunca sobrescribe**: crea lo que falta, siembra los **principios
inexorables** en `docs/constitution.md` (el proyecto los adapta) y, si existe `AGENTS.md` sin
mencionar la constitución, le añade una única regla pidiendo leerla antes de tocar código.

```console
$ sdd status
Estado SDD…

✓ Estructura: docs/ · specs/ · .opencode/
✓ docs/constitution.md
✓ AGENTS.md

specs/001-sdd-init — spec ✓ · plan ✓ · tasks ✓ 13/13
specs/002-sdd-new — spec ✓ · plan ✓ · tasks ✓ 12/12

2 specs · 2 listas
```

```console
$ sdd validate 002
Validando spec 002-sdd-new…

✓ Artefactos: spec.md, plan.md, tasks.md
✓ Estructura: todas las secciones de la plantilla
✓ Trazabilidad: todos los RF cubiertos en plan.md y tasks.md
✓ Tareas: 12/12 completadas
✓ Constitución: docs/constitution.md (citada en spec/plan/tasks)
✓ Verdes: 3/3 comandos

Spec 002-sdd-new: LISTO
```

**Códigos de salida**: `0` éxito (o veredicto LISTO); `1` error o NO LISTO. Los errores van a
stderr y el informe/éxito a stdout.

### Flujo completo

```text
/sdd-spec → /sdd-qa → /sdd-plan → /sdd-tasks → /sdd-implement   (formal, con artefactos)
/sdd-quick                                                       (cambios pequeños, en conversación)
```

El flujo formal deja sus artefactos en `specs/NNN-<slug>/` (`spec.md`, `plan.md`, `tasks.md`) —
no los edites a mano salvo petición explícita. Para cambios pequeños, `/sdd-quick` traslada la
especificación mínima a la conversación (explora → pregunta lo mínimo → define → confirma →
implementa → valida → resume) y deriva al flujo formal si detecta complejidad (migraciones,
contratos de API, auth, arquitectura…).

## `sdd.json` — verdes de verificación

`sdd validate` ejecuta los comandos declarados en la raíz del proyecto (campos extra se ignoran):

```json
{
  "verify": ["pnpm run build", "pnpm run typecheck", "pnpm test"]
}
```

## Desarrollo del CLI

```bash
pnpm run dev          # node --watch src/index.ts
pnpm run build        # tsc → dist/
pnpm run typecheck    # tsc --noEmit
pnpm test             # vitest
```

- Lógica pura en `src/lib/` con tests de Vitest; `src/index.ts` solo hace de dispatch.
- Los contenidos que genera el CLI viven en `templates/` y se copian vía manifiesto
  (`src/lib/templates.ts`): cero strings de contenido desperdigados en el código.
- Los principios innegociables de este repo están en `docs/constitution.md`; el desarrollo sigue
  su propio flujo (ver `specs/`).
