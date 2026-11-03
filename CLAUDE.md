# CLAUDE.md — guía para trabajar en Lumen Vale

## Comandos

- `npm run dev` · `npm test` · `npm run lint` · `npm run typecheck` · `npm run build`
- Antes de dar algo por terminado: `npm run lint && npm run typecheck && npm test && npm run build` (es lo que corre CI).

## Arquitectura (reglas)

1. **Separación motor / UI.** `src/game/**` es TypeScript + Three.js imperativo y no importa React. `src/ui/**` es React y no importa `three`.
2. **Único puente:** `src/state/gameStore.ts`.
   - Motor → UI: `store.setState(...)` con valores serializables. Solo publicar cuando el valor cambia (el loop corre a 60 fps).
   - UI → motor: métodos de `GameActions`, expuestos con `useGameActions()`.
   - En componentes: `useGameState(selector)`. El selector debe devolver primitivos o referencias estables (zustand v5 entra en bucle con objetos nuevos).
3. **`Game.ts` orquesta, no implementa.** La lógica vive en `world/`, `story/` y `systems/`. Cada sistema recibe sus dependencias por constructor (sin singletons globales). Los sistemas sin Three.js (`progress`, `narrative`) deben seguir siendo testeables en Node.
4. **Contenido como datos.** La historia y los textos están en `src/content/`. Para añadir una memoria: agrega una entrada a `MEMORIES`, crea su objeto en `story/storyWorld.ts` y regístralo en `objects`.
5. El orden del loop en `Game.frame` importa (cámara → atención → narrativa). No lo reordenes sin motivo.

## Invariantes (no romper)

- **Determinismo del mundo.** Una misma semilla debe generar el mismo mundo. No cambies `mulberry32`, `makeNoise`, `TerrainField`, ni **el orden de las llamadas a `rng()`** en `chunks.ts` / `storyWorld.ts` / `sky.ts`. `src/game/world/terrain.test.ts` compara contra valores generados por la versión original. Si un cambio intencional lo rompe, regenera el fixture y documenta que las semillas antiguas cambian.
- **Claves de localStorage** (`lvr-seed`, `lvr-retro`, `lvr-sound`, `lvr-mem-<seed>`): cambiarlas borra el progreso de los jugadores.
- **Three.js fijado en 0.160.0** (sin `^`). Subir de versión puede alterar luces, colorimetría o el shader del cielo (`#include <colorspace_fragment>`). Hazlo en un PR aparte, con comparación visual.
- **Móvil primero:** sin sombras en tiempo real, instancing por chunk, radio de chunks 2 en pantallas táctiles, render retro a 460 px de alto.
- `reference/lumen-vale-remember.html` es la versión original. Solo referencia; no la edites.

## Diferencias conocidas con la versión original

- **Corregido:** el aviso de pista tras 45 s ya no lanza una excepción cuando el jugador espera en la pantalla final (`Game.frame`, guard `chapter < CHAPTERS.length`).
- **Pendiente (se mantiene igual que el original a propósito):** con la tarjeta enfocada por teclado, Enter avanza dos veces (handler de la tarjeta + listener global de `Input`).

## Ideas de evolución (no hechas)

- Migrar escena a React Three Fiber de forma incremental (empezar por `Sky`/`Water`, que no tienen estado de juego).
- Code-splitting del motor detrás de la intro.
- Tests E2E con Playwright (WebGL vía SwiftShader).
