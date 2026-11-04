# ADR 0001 — Arquitectura multi-acto

- **Estado:** aceptada (aprobada por el autor el 2026-11-04; pendiente de implementar)
- **Fecha:** 2026-11-04
- **Roadmap:** ENG-01 · resuelve la decisión abierta D1 · desbloquea ENG-12, DIS-04 y el Release 2

## Contexto

Hoy el código modela un solo acto. Al cargar la página, `App.tsx` crea un `Game`, que en su constructor arma el mundo completo del Acto I (semilla, terreno, cielo, objetos, progreso). La intro (`Intro.tsx`) se muestra encima de ese valle, que ya está renderizando.

El juego tendrá 6 actos, uno por canción. Lo que dijo el autor y condiciona esta decisión:

1. **Recorrido.** Al entrar a la web se ve un menú principal con un botón "Seleccionar acto". Ahí aparecen los 6 actos, como un tracklist. Al elegir uno, empieza ese acto. Dentro del juego, Escape o un botón de opciones abre un panel de opciones; una de ellas es "Volver al menú principal".
2. **Habilitación.** Un acto se puede elegir **si existe**, es decir, si su canción ya salió. No depende de haber terminado los anteriores. Los actos que no existen se ven en el tracklist, pero deshabilitados.
3. **Libertad entre actos.** Un acto puede ser algo completamente distinto: otro lugar, un interior, algo abstracto u otra forma de moverse. El Acto II todavía no está definido.

Restricciones (CLAUDE.md): las claves `lvr-seed`, `lvr-retro`, `lvr-sound` y `lvr-mem-<seed>` no cambian; el mundo del Acto I es determinista por semilla; Three.js sigue fijado en 0.160.0; el motor no importa React y la UI no importa `three`; el juego es móvil primero.

## Opciones consideradas

**A. Motor compartido, con el contenido de cada acto como datos.** Se extiende `CHAPTERS`/`MEMORIES` o se le pasa a `Game` un set de contenido por acto. *Descartada:* supone que todos los actos son "caminar por un terreno y sostener la mirada", y el autor dijo explícitamente que un acto puede ser algo completamente distinto.

**B. Carcasa común y cada acto como módulo independiente.** Una capa compartida (menú, tracklist, opciones, ajustes) monta y desmonta actos. Cada acto cumple un contrato mínimo y por dentro hace lo que necesite. **Elegida.**

**C. Una página o app separada por acto.** Máxima independencia, pero se duplican el menú, los ajustes y el build, y volver al menú obliga a recargar la página. *Descartada.*

## Decisión

### 1. La carcasa

Es la capa que existe con o sin acto activo:

- el **menú principal** y la pantalla **"Seleccionar acto"**;
- el **panel de opciones** (Escape o botón), con "Volver al menú principal", sonido y modo retro. Las opciones de ENG-09 (sensibilidad, tamaño de texto) se agregan aquí;
- los **ajustes globales**: sonido y retro, que siguen guardados en `lvr-sound` y `lvr-retro`;
- el **registro de actos** (punto 3).

La carcasa no sabe nada de terrenos, estrellas ni fogatas.

Escape cierra primero lo que esté abierto encima (por ejemplo, el diario del Acto I). Si no hay nada abierto, abre o cierra el panel de opciones. *(Decisión de Claude.)*

**El menú es React puro, sin escena 3D detrás.** *(Decisión de Claude.)* Así la portada carga sin bajar Three.js ni el mundo, y queda libre para la dirección de arte de ART-01 y UI-02: línea blanca sobre negro, como la portada del single.

### 2. Cada acto es un módulo con un contrato mínimo

Cada acto exporta, con carga diferida:

- **Un motor** (`src/game/…`, sin React) con esta forma:
  - `mount(host, ctx)` crea su canvas y su loop dentro de `host`.
  - `dispose()` lo deja todo como antes: loop detenido, *listeners* removidos, geometrías y materiales liberados, contexto WebGL perdido y canvas eliminado.
  - `setPaused(paused)` detiene la simulación y la entrada mientras el panel de opciones está abierto. *(Decisión de Claude: abrir opciones pausa el acto.)*
  - `setSound(on)` y `setRetro(on)` reciben los ajustes globales.
- **Su UI** (`src/ui/…`, sin `three`): los componentes React propios del acto, por ejemplo HUD, tarjetas o diario.
- **Su store y sus acciones.** El puente motor ↔ UI de cada acto sigue el patrón actual de `gameStore` (motor → `setState`, UI → acciones), pero **con un store por acto**. La carcasa tiene su propio store, más chico.

`ctx` es lo que la carcasa le entrega al acto: los ajustes iniciales (sonido, retro), `markCompleted()` para avisar que el acto se terminó y `exitToMenu()` por si el acto necesita salir por su cuenta.

Al cambiar de acto o volver al menú, **se destruye el motor y se crea uno nuevo**. `Game.dispose()` ya existe, así que hay base. No se reutilizan piezas vivas entre actos: hacerlo sería optimizar antes de tiempo.

El código *fuente* sí se puede compartir libremente. Un acto nuevo puede importar `Input`, `AudioEngine`, `platform.ts` o el render retro si le sirven. No hay una clase base obligatoria.

### 3. Registro de actos

Hay una lista única de los 6 actos en `src/acts/registry.ts`, a nivel de aplicación (el mismo nivel que `App.tsx`, que es el único lugar donde se juntan motor y UI). Cada entrada tiene:

- el número y, opcionalmente, el título de la canción. Puede faltar mientras el título no sea público; qué se muestra en ese caso lo decide UI-02;
- `disponible: boolean`, que define si el acto existe;
- `cargar()`, un `import()` dinámico que devuelve el motor, la UI y el store del acto. Solo lo tienen los actos disponibles.

El tracklist se dibuja a partir de esta lista. **Habilitar un acto es poner `disponible: true` y darle su `cargar()`.**

Con el `import()` dinámico, cada acto queda en su propio *chunk* del build: en el teléfono no se baja el Acto VI para jugar el I. Esto también cumple la idea "code-splitting del motor detrás de la intro" de CLAUDE.md.

### 4. El Acto I dentro de este esquema

- El código actual del Acto I **se queda donde está** (`src/game/**`, `src/ui/components/**`, `src/content/**`). Se agrega un **adaptador** que lo expone con el contrato del punto 2. *(Decisión de Claude: se reorganiza en carpetas por acto cuando exista el Acto II y se vea qué se comparte de verdad.)*
- Su intro actual (título del acto, la frase que cambia si es nueva partida, retomada o terminada, y el botón "Despertar") **sigue siendo parte del acto**, encima del valle. El recorrido queda así: menú → seleccionar acto → intro del Acto I → despertar. *(Decisión de Claude. UI-02 puede fusionar estas pantallas si estorban.)*
- `restart()` deja de hacer `location.reload()`: borra el progreso y le pide a la carcasa que vuelva a montar el acto.
- `#w123` (elegir semilla por URL) sigue funcionando: el Acto I lo lee al montarse. `#debug` (ENG-03) también es asunto del acto. No se agrega un router.

### 5. Progreso guardado

| Clave | Dueño | Cambio |
|---|---|---|
| `lvr-sound`, `lvr-retro` | carcasa | ninguno |
| `lvr-seed` | Acto I | ninguno (el nombre es global por historia; no se renombra) |
| `lvr-mem-<seed>` | Acto I | ninguno: se lee y escribe igual que hoy, sin migración |
| `lvr-acts-done` | carcasa | **nueva**: arreglo JSON con los números de los actos terminados, por ejemplo `[1]` |
| `lvr-a<N>-<nombre>` | Acto N (N ≥ 2) | **convención nueva**: cada acto define qué guarda, siempre con este prefijo |

- **Las partidas del Acto I no se tocan.** No hay migración, porque el Acto I sigue usando sus claves tal cual.
- **El determinismo no cambia.** La semilla, `mulberry32`, el terreno y el orden de `rng()` viven dentro del Acto I, y esta decisión no los toca.
- **`lvr-acts-done`** lo escribe la carcasa cuando un acto llama a `markCompleted()`. Se guarda para que el tracklist *pueda* marcar los actos terminados; si se muestra, y cómo, lo decide UI-02. Un jugador que ya terminó el Acto I antes de este cambio aparece como terminado la próxima vez que entre al Acto I, porque `Progress` detecta que está completo al construirse.
- **Al volver a un acto,** se retoma como hoy al recargar la página: los ítems recordados se conservan y Isi aparece en el punto de inicio. *(Decisión de Claude, revisada con el autor.)* No se guarda la posición.
- **Los objetos ocultos** (DIS-04) son progreso del Acto I: van en una clave nueva, `lvr-a1-hidden-<seed>`, con la misma forma que `lvr-mem-<seed>`. Así no cambia el formato de la clave existente ni cuentan en el contador.

### 6. Reglas de arquitectura que cambian en CLAUDE.md

- "Único puente: `src/state/gameStore.ts`" pasa a ser: un store de la carcasa + un store por acto, todos con el mismo patrón (motor → `setState` con valores serializables; UI → acciones).
- Se agrega: la carcasa no importa código de ningún acto salvo a través del registro (`import()` dinámico).
- Se elimina el pendiente "Decisión técnica no tomada" y se apunta a este ADR.

## Consecuencias

**A favor**
- Cada acto puede ser lo que la canción pida, sin forzar el motor del Acto I.
- Las partidas existentes y el determinismo quedan intactos por construcción, no por cuidado.
- El menú carga rápido y cada acto se descarga solo cuando se elige.
- Agregar un acto es: un módulo nuevo + una entrada en el registro.

**En contra / costos**
- `dispose()` pasa a ser crítico. Hoy solo corre al cerrar la página; ahora corre cada vez que se vuelve al menú. Una fuga (un *listener*, un contexto WebGL, un `AudioContext`) se acumula con cada ida y vuelta. Los navegadores limitan los contextos WebGL vivos (alrededor de 16) y en iOS la cantidad de `AudioContext`.
- Hay que tocar `App.tsx`, `gameStore.ts` y `Intro.tsx`, y agregar menú, tracklist y panel de opciones: es trabajo de UI antes de que exista el Acto II.
- Al compartir solo código fuente, cada acto nuevo vuelve a armar su renderer, su loop y su input. Se acepta a cambio de la libertad entre actos.

**Riesgos y cómo se cubren**
- **Fugas al desmontar:** un test E2E (ENG-08) que entre y salga del Acto I varias veces y verifique que sigue funcionando. Si el `AudioContext` da problemas en iOS, la carcasa pasa a ser dueña de uno solo y se lo presta a cada acto. *(Queda a criterio de quien implemente, según lo que se vea en el teléfono.)*
- **Audio en iOS:** el audio se desbloquea con un gesto del usuario. Hoy ese gesto es "Despertar"; con este cambio sigue siéndolo, o el clic en el acto. Hay que verificarlo en el teléfono.

## Qué queda fuera de este ADR

- La mecánica y el contenido del Acto II (DIS-09, DIS-10).
- El diseño visual del menú, el tracklist y el panel de opciones (ART-01, UI-02).
- El formato del archivo de textos (D2 / ENG-02). Este ADR solo fija que el contenido es de cada acto.
- Si se usa React Three Fiber en actos futuros. El contrato del punto 2 no lo impide ni lo exige.

## Verificación (al implementar)

- `npm run lint && npm run typecheck && npm test && npm run build` pasan; `terrain.test.ts` sigue igual.
- Un test fija que `STORAGE_KEYS` mantiene `lvr-seed`, `lvr-retro`, `lvr-sound` y `lvr-mem-<seed>`.
- Un test del registro verifica que hay 6 actos con números del 1 al 6, que solo los disponibles tienen `cargar()` y que el Acto I está disponible.
- Una partida guardada antes del cambio (`lvr-mem-<seed>` con ítems) se retoma igual después del cambio.
- El build genera un *chunk* separado para el Acto I y el menú no carga `three`.
- En el teléfono: menú → Acto I → opciones → menú → Acto I, varias veces, sin pérdida de rendimiento ni de sonido.
