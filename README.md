# De Espacio-Tiempo

Juego narrativo de exploración low-poly: la adaptación jugable del álbum _despacio-tiempo_, un acto por canción, en el orden del tracklist. Isi aterrizó en un valle alienígena por decisión propia y no logró volver a despegar; para avanzar debe **atreverse a mirar**: quedarse quieta y sostener la mirada sobre las cosas que ha estado evitando.

Construido con **React 18 + Three.js 0.160 + TypeScript + Vite**. Mundo procedural determinista por semilla, compatible con móvil.

> El juego implementa el **Acto I ("Astronauta")**, en español. El canon narrativo vive en [`docs/superpowers/specs/`](./docs/superpowers/specs) y está resumido en [`CLAUDE.md`](./CLAUDE.md); si un texto del juego contradice un brief, manda el brief.

## Empezar

```bash
nvm use            # Node 20
npm install
npm run dev        # http://localhost:5173
```

| Comando                                                 | Qué hace                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                                           | Servidor de desarrollo con HMR                               |
| `npm run build`                                         | Typecheck + build de producción en `dist/`                   |
| `npm run preview`                                       | Sirve el build                                               |
| `npm test`                                              | Tests (incluye la prueba de paridad del generador de mundos) |
| `npm run lint` / `npm run typecheck` / `npm run format` | Calidad de código                                            |

Para jugar un mundo concreto: `http://localhost:5173/#w12345`.

## Trabajar con Claude Code

El repo trae su configuración de Claude Code. Al abrirlo por primera vez, Claude Code pide confirmar que confías en la carpeta y luego ofrece instalar lo que falte:

| Qué                                                                     | Dónde se declara        | Para qué                                             |
| ----------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------- |
| Skills del proyecto (`generating-act-briefs`, `running-roadmap-audits`) | `.claude/skills/`       | Briefs de acto y auditorías del roadmap              |
| Plugin **superpowers** (marketplace oficial)                            | `.claude/settings.json` | Lo exige `generating-act-briefs` (brainstorming)     |
| Plugin **impeccable** (`pbakaus/impeccable`)                            | `.claude/settings.json` | Diseño y revisión de UI                              |
| MCP **polyfork**                                                        | `.mcp.json`             | Buscar y descargar modelos 3D (ver `docs/assets.md`) |

polyfork necesita una clave personal (cada persona la suya; nunca se commitea). Créala en [polyfork.dev](https://polyfork.dev) y déjala como variable de entorno **antes** de abrir Claude Code:

```bash
# PowerShell (persistente):  setx POLYFORK_API_KEY "pf_..."
# bash/zsh:                  export POLYFORK_API_KEY=pf_...
```

Ajustes personales (permisos, etc.) van en `.claude/settings.local.json`, que está en `.gitignore`.

## Arquitectura en una imagen

```
React (UI: intro, HUD, tarjetas, diario, final)
   ▲  lee estado (zustand)        │ llama acciones (GameActions)
   │                              ▼
Game.ts  ── orquesta el loop y los sistemas ── Three.js (escena imperativa)
   ├─ world/    terreno procedural, chunks, cielo, agua, partículas, atmósfera
   ├─ story/    objetos de la historia (fogata, nave, pertenencias), ítems recordables
   ├─ systems/  atención, narrativa, progreso, jugador, input, audio
   └─ content/  historia y textos (datos puros, editables sin tocar el motor)
```

El motor **no conoce React** y React **no conoce Three.js**. La comunicación pasa por `src/state/gameStore.ts`.
Detalle completo, invariantes y convenciones en [`CLAUDE.md`](./CLAUDE.md).

## Estructura

```
src/
  main.tsx, App.tsx          montaje de React y del motor
  content/                   story.ts (memorias, capítulos, líneas) · copy.ts (textos de UI)
  state/gameStore.ts         puente motor ⇄ UI
  game/
    Game.ts                  loop + orquestación
    config.ts, platform.ts   constantes, detección de dispositivo, storage seguro
    math/                    PRNG, ruido simplex, utilidades
    three/helpers.ts         fábricas de mallas/materiales/instancing
    world/                   terrain, palette, chunks, props, sky, atmosphere, water, particles, collision, seed
    story/                   storyWorld (set), campfire, items
    systems/                 attention, narrative, progress, player, input, audio
  ui/components/             un componente + CSS por pieza de UI
  styles/                    tokens y estilos base
docs/superpowers/specs/      briefs narrativos por acto (fuente de verdad de la historia)
reference/                   versión original de un solo archivo (solo referencia, no editar)
```

## Despliegue

`vite.config.ts` usa `base: './'`, así que `dist/` funciona en cualquier hosting estático (GitHub Pages, Netlify, itch.io).
