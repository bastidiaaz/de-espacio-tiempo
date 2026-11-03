# Lumen Vale — Remember

Juego narrativo de exploración low-poly. Una astronauta despierta junto a una fogata sin recordar quién es; para avanzar debe **recordar a través de la atención**: quedarse quieta y sostener la mirada sobre las cosas.

Construido con **React 18 + Three.js 0.160 + TypeScript + Vite**. Mundo procedural determinista por semilla, compatible con móvil.

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
reference/                   versión original de un solo archivo (solo referencia, no editar)
```

## Despliegue

`vite.config.ts` usa `base: './'`, así que `dist/` funciona en cualquier hosting estático (GitHub Pages, Netlify, itch.io).
