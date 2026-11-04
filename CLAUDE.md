# CLAUDE.md — guía para trabajar en De Espacio-Tiempo

## Qué es este proyecto

- **Adaptación jugable del álbum _despacio-tiempo_**: un acto del juego por canción, en el mismo orden del tracklist.
- El juego se llama **"De Espacio-Tiempo"** (juego de palabras: "despacio" + "espacio-tiempo"). Antes se llamaba "Lumen Vale — Remember": ese es el MVP del que viene todo el código actual.
- Protagonista: **Isi**. Idioma in-game: **español**.
- **Dispositivo narrativo: no es amnesia.** Isi recuerda perfectamente lo que pasó; lo que no puede es mirarlo de frente. En el Acto I, sostener la mirada es "atreverse a admitir una verdad que ya conoce"; cada acto puede redefinir qué significa el gesto sin tocar la mecánica. El radio que crece es miedo, no memoria.
- **Fuente de verdad narrativa:** los briefs en `docs/superpowers/specs/*-de-espacio-tiempo-acto*-design.md`, leídos en orden de acto. El código **no** es fuente de verdad narrativa.
- Para redactar el brief de un acto nuevo: skill `generating-act-briefs` (`.claude/skills/generating-act-briefs/SKILL.md`). Exige la letra completa de la canción y diálogo con el autor; nunca se redacta unilateralmente desde un resumen temático.
- **Hilos reservados** (no resolverlos antes de su acto): "¿volverá a volar?" → Acto 6 ("el regreso"); a quién le habla Isi cuando transmite → acto futuro, sin asignar.

## Estado actual vs. canon

- **Implementado:** el motor completo + el Acto I ("Astronauta") según su brief: todo el texto in-game en español, premisa de duda (no de amnesia), 10 ítems en 5 capítulos, cierre en quietud junto al fuego.
- **Decisiones de implementación del Acto I que no están en el brief:** el cielo ya no amanece — `PRE_DAWN` (`Game.ts`) bajó de 0.6 a 0.12 y además es el tope al terminar, porque el amanecer rosado leía como sanación y el álbum guarda el amanecer para el Acto 6; `seeds` (transmisor) y `beacon` (pieza de motor) se reinterpretaron solo por texto, sin tocar su geometría; la intro muestra `COPY.act` ("Acto I — Astronauta") bajo el título; la estrella lenta de `sky.shipStar` se mantiene a la deriva, ya no como nave que llega sino como estrella a la que Isi sostiene la mirada.
- **Sin brief todavía:** del Acto II en adelante. El brief del Acto I ya adelanta de qué trata la canción #2 ("Despacio": contemplación, refugio, saberse rebelde), pero eso es contexto, no un brief — hay que generarlo con la skill, la letra completa y el diálogo con el autor.
- **Roadmap:** `docs/roadmap.md` (tareas con inputs/outputs, decisiones abiertas y lo que no se toca). Los textos in-game los escribe el autor; Claude orienta y revisa. Para auditar y rehacer el roadmap: skill `running-roadmap-audits` (`.claude/skills/running-roadmap-audits/SKILL.md`).
- **Regla práctica:** si un texto de `src/content/` contradice un brief, **manda el brief** — el código se corrige, no el canon.
- **Pendientes conocidos:**
  - **Decisión técnica no tomada:** hoy el código modela un solo acto. Antes de implementar un segundo hay que decidir cómo coexisten — extender `CHAPTERS`/`MEMORIES` con más capítulos y radio continuo, o escena/ruta separada con su propio set de contenido — y qué pasa con `lvr-mem-<seed>` en cada caso. No es una decisión narrativa.

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
