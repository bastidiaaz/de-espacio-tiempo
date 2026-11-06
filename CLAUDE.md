# CLAUDE.md — guía para trabajar en De Espacio-Tiempo

## Qué es este proyecto

- **Adaptación jugable del álbum _despacio-tiempo_**: un acto del juego por canción, en el mismo orden del tracklist.
- El juego se llama **"De Espacio-Tiempo"** (juego de palabras: "despacio" + "espacio-tiempo"). Antes se llamaba "Lumen Vale — Remember": ese es el MVP del que viene todo el código actual.
- Protagonista: **Isi**. Idioma in-game: **español**.
- **Dispositivo narrativo (canon revisado el 2026-11-05):** Isi despierta en un planeta desconocido sin recordar cómo llegó, y mirar los objetos le devuelve la memoria. El radio que crece sigue siendo miedo: no se atreve a mirar más allá todavía. Cada acto puede redefinir qué significa sostener la mirada sin tocar la mecánica.
- **Fuente de verdad narrativa:** los briefs en `docs/superpowers/specs/*-de-espacio-tiempo-acto*-design.md`, leídos en orden de acto. El código **no** es fuente de verdad narrativa.
- Para redactar el brief de un acto nuevo: skill `generating-act-briefs` (`.claude/skills/generating-act-briefs/SKILL.md`). Exige la letra completa de la canción y diálogo con el autor; nunca se redacta unilateralmente desde un resumen temático.
- **Hilos reservados** (no resolverlos antes de su acto): el despegue (si se atreve a subir a la nave y salir; el Acto I ya deja claro que quiere) → Acto 6 ("el regreso"); a quién le habla Isi cuando transmite → acto futuro, sin asignar.

## Estado actual vs. canon

- **Implementado:** el motor completo + el Acto I ("Astronauta") según su brief: todo el texto in-game en español, 11 ítems en 6 capítulos (DIS-07 sumó la vuelta a la fogata antes de la estrella; Isi se sienta, la cámara guiada sigue a la cita y el acto se da por terminado al aparecer la pantalla final, no al mirar la estrella). Los textos marcados `[PENDIENTE]` en `acto1.json` los escribe el autor. Los textos son los que reescribió el autor (DIS-02), con el canon revisado: Isi recupera la memoria, tiene familia, cayó porque dudó y cierra sabiendo que lo difícil es atreverse a salir.
- **Decisiones de implementación del Acto I que no están en el brief:** el cielo ya no amanece — `PRE_DAWN` (`Game.ts`) bajó de 0.6 a 0.12 y además es el tope al terminar, porque el amanecer rosado leía como sanación y el álbum guarda el amanecer para el Acto 6; `seeds` (transmisor) y `beacon` (pieza de motor) se reinterpretaron solo por texto; su forma nueva (walkie-talkie y rejilla con polvo), igual que la de `thermos`, `photo` y `recorder`, quedó aprobada en DIS-03 (tabla en el brief) y el modelo está pendiente en ART-07; la intro muestra `COPY.act` ("Acto I — Astronauta") bajo el título; la estrella lenta de `sky.shipStar` se mantiene a la deriva, ya no como nave que llega sino como estrella a la que Isi sostiene la mirada.
- **Sin brief todavía:** del Acto II en adelante. El brief del Acto I ya adelanta de qué trata la canción #2 ("Despacio": contemplación, refugio, saberse rebelde), pero eso es contexto, no un brief — hay que generarlo con la skill, la letra completa y el diálogo con el autor.
- **Roadmap:** `docs/roadmap.md` (tareas con inputs/outputs, decisiones abiertas y lo que no se toca). Los textos in-game los escribe el autor; Claude orienta y revisa. Para auditar y rehacer el roadmap: skill `running-roadmap-audits` (`.claude/skills/running-roadmap-audits/SKILL.md`).
- **Regla práctica:** si un texto de `src/content/` contradice un brief, **manda el brief** — el código se corrige, no el canon.
- **Pendientes conocidos:**
  - **Arquitectura multi-acto implementada:** `docs/adr/0001-multi-acto.md`. El juego abre en un menú (carcasa) → "Seleccionar acto" → el acto elegido; Escape o el botón Opciones pausan el acto y permiten volver al menú. Para agregar un acto: un módulo que cumpla `ActModule` (`src/acts/types.ts`) + `available: true` y `load` en `src/acts/registry.ts`. Los textos de la carcasa (`src/content/shellCopy.ts`) son provisionales hasta UI-02.

## Comandos

- `npm run dev` · `npm test` · `npm run lint` · `npm run typecheck` · `npm run build`
- **Modo debug (ENG-03):** abre el Acto I con `#debug` en la URL (`#w123&debug` fija además la semilla). Panel para saltar a un capítulo o quedar frente a un ítem, "marcar todo" para ver el final, y un anillo en el suelo con el borde caminable. En debug no se guarda progreso ni se marca el acto como completado. Lógica pura en `src/game/debug.ts`.
- **Deploy (ENG-04):** cada push a `main` con CI en verde publica `dist/` en GitHub Pages (job `deploy` de `.github/workflows/ci.yml`). Los PR solo corren los checks. URL: `https://play.tiannmusica.com/` (dominio propio: CNAME `play` → `bastidiaaz.github.io` en el DNS Manager de Bandzoogle, y TXT de verificación `_github-pages-challenge-bastidiaaz`, que no se borra). La URL de `github.io` redirige ahí.
- **Analítica (ENG-05):** GoatCounter, sin cookies ni banner. `src/analytics.ts` carga `count.js` solo en el build de producción y nunca con `#debug` (sitio `tiann-play.goatcounter.com`; con `GOATCOUNTER_ENDPOINT = null` queda apagada). Eventos: `acto-N/inicio` (al entrar a un acto desde el selector), `acto-N/completado` (la primera vez en ese navegador; los emite `shellStore`) y `acto-N/escuchar` (clic en ffm.to). Un acto nuevo emite `escuchar` desde su invitación.
- Antes de dar algo por terminado: `npm run lint && npm run typecheck && npm test && npm run build` (es lo que corre CI).

## Arquitectura (reglas)

1. **Separación motor / UI.** `src/game/**` es TypeScript + Three.js imperativo y no importa React. `src/ui/**` es React y no importa `three`.
2. **Puentes motor ↔ UI:** un store por capa, todos con el mismo patrón. La carcasa usa `src/state/shellStore.ts` (`useShell(selector)`); el Acto I usa `src/state/gameStore.ts`. Cada acto nuevo trae su propio store.
   - Motor → UI: `store.setState(...)` con valores serializables. Solo publicar cuando el valor cambia (el loop corre a 60 fps).
   - UI → motor: métodos de `GameActions`, expuestos con `useGameActions()`.
   - En componentes: `useGameState(selector)`. El selector debe devolver primitivos o referencias estables (zustand v5 entra en bucle con objetos nuevos).
   - La carcasa solo llega al código de un acto a través de `src/acts/registry.ts` (`import()` dinámico: cada acto es su propio chunk y el menú no carga `three`). `src/App.tsx`, `src/ActHost.tsx` y `src/acts/**` son la única capa que junta motor y UI.
   - Cada motor de acto implementa `ActEngine` (`src/game/engine.ts`): `setPaused`, `setSound`, `setRetro` y `dispose`. `dispose()` corre cada vez que se vuelve al menú: no puede dejar loops, listeners, recursos GPU, `AudioContext` ni canvas.
3. **`Game.ts` orquesta, no implementa.** La lógica vive en `world/`, `story/` y `systems/`. Cada sistema recibe sus dependencias por constructor (sin singletons globales). Los sistemas sin Three.js (`progress`, `narrative`, `gaze`) deben seguir siendo testeables en Node; `attention.ts` solo proyecta con la cámara y delega la regla de la mirada en `gaze.ts`.
4. **Contenido como datos.** Los textos del Acto I viven en `src/content/acto1.json` (un `.json` por acto; guía para el autor en `docs/editar-textos.md`). `story.ts` y `copy.ts` solo guardan lo estructural (ids, capítulos, geometría, radios) y ensamblan `MEMORIES`, `CHAPTERS` y `COPY` con el loader validado `acto1Texts.ts`; los importadores no cambian. Para añadir una memoria: agrega su estructura a `MEMORY_STRUCT` en `story.ts`, su `titulo`/`texto` bajo `memorias` en `acto1.json`, crea su objeto en `story/storyWorld.ts` y regístralo en `objects`. `src/content/acto1.test.ts` falla si falta o sobra un id. `shellCopy.ts` (carcasa) sigue en TS hasta UI-02.
5. **Modelos 3D (ENG-10):** los `.glb` van en `public/models/`, se registran en `MODELS` (`src/game/assets/models.ts`) y en `CREDITS.md`, y se cargan con `loadModel` (`src/game/three/gltf.ts`), que les pone el Lambert flat del juego. `models.test.ts` hace cumplir el presupuesto de triángulos, los colores por vértice, el "sin texturas ni Draco" y los créditos. Flujo completo y licencia: `docs/assets.md`.
6. El orden del loop en `Game.frame` importa (cámara → atención → narrativa). No lo reordenes sin motivo.

## Invariantes (no romper)

- **Determinismo del mundo.** Una misma semilla debe generar el mismo mundo. No cambies `mulberry32`, `makeNoise`, `TerrainField`, ni **el orden de las llamadas a `rng()`** en `chunks.ts` / `storyWorld.ts` / `sky.ts`. `src/game/world/terrain.test.ts` compara contra valores generados por la versión original. Si un cambio intencional lo rompe, regenera el fixture y documenta que las semillas antiguas cambian.
- **Claves de localStorage** (`lvr-seed`, `lvr-retro`, `lvr-sound`, `lvr-mem-<seed>`, `lvr-acts-done`): cambiarlas borra el progreso de los jugadores. Las claves de actos nuevos usan el prefijo `lvr-a<N>-`; `src/game/config.test.ts` fija las existentes.
- **Three.js fijado en 0.160.0** (sin `^`). Subir de versión puede alterar luces, colorimetría o el shader del cielo (`#include <colorspace_fragment>`). Hazlo en un PR aparte, con comparación visual.
- **Móvil primero:** sin sombras en tiempo real, instancing por chunk, radio de chunks 2 en pantallas táctiles, render retro a 460 px de alto.
- `reference/lumen-vale-remember.html` es la versión original. Solo referencia; no la edites.

## Diferencias conocidas con la versión original

- **Corregido:** el aviso de pista tras 45 s ya no lanza una excepción cuando el jugador espera en la pantalla final (`Game.frame`, guard `chapter < CHAPTERS.length`).
- **Corregido (ENG-06):** con la tarjeta enfocada por teclado, Enter avanzaba dos veces (handler de la tarjeta + listener global de `Input`). `MemoryCard` ahora detiene la propagación del evento.

## Ideas de evolución (no hechas)

- Migrar escena a React Three Fiber de forma incremental (empezar por `Sky`/`Water`, que no tienen estado de juego).
- Tests E2E con Playwright (WebGL vía SwiftShader).
