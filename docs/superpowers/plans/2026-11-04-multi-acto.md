# Multi-acto (carcasa + registro + Acto I como módulo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el juego abra en un menú principal con "Seleccionar acto" (6 actos, solo el I habilitado), monte el Acto I al elegirlo y permita volver al menú desde un panel de opciones, sin tocar partidas guardadas ni el determinismo.

**Architecture:** Una carcasa React (menú, selección, panel de opciones, ajustes de sonido/retro) con su propio store zustand monta y desmonta actos. Cada acto se carga con `import()` dinámico desde un registro y cumple el contrato `ActModule` → `{ engine: ActEngine, ui: ReactNode }`. El Acto I es el `Game` actual más un adaptador; su código no cambia de carpeta.

**Tech Stack:** React 18, zustand 5 (vanilla), Three.js 0.160.0, Vite 6, Vitest 3 (entorno `node`), TypeScript 5.

**Spec:** `docs/adr/0001-multi-acto.md`

## Global Constraints

- Claves de localStorage que **no cambian**: `lvr-seed`, `lvr-retro`, `lvr-sound`, `lvr-mem-<seed>`. Clave nueva: `lvr-acts-done` (arreglo JSON de números de acto, p. ej. `[1]`).
- No tocar `mulberry32`, `makeNoise`, `TerrainField` ni el orden de llamadas a `rng()`; `src/game/world/terrain.test.ts` debe seguir pasando sin regenerar el fixture.
- `three` sigue en `0.160.0` exacto. No se agregan dependencias.
- `src/game/**` no importa React; `src/ui/**` no importa `three`. Solo `src/App.tsx` y `src/acts/**` (nivel aplicación) pueden importar ambos lados.
- La carcasa solo llega al código de un acto mediante `import()` dinámico del registro (`src/acts/registry.ts`).
- Textos de interfaz nuevos: solo las etiquetas que dio el autor ("Seleccionar acto", "Volver al menú principal") más etiquetas funcionales mínimas, todas en `src/content/shellCopy.ts` y marcadas como provisionales. El autor escribe los textos finales (UI-02); no inventar frases narrativas.
- Móvil primero: el panel de opciones debe poder abrirse con un botón táctil, no solo con Escape.
- Antes de dar algo por terminado: `npm run lint && npm run typecheck && npm test && npm run build`.

## Review Focus

1. **Montar/desmontar repetido** (incluido el doble montaje de `StrictMode` en dev): tras menú → Acto I → menú → Acto I varias veces, hay exactamente un `<canvas id="world">`, el juego responde y el sonido no se duplica. → Task 5, paso de verificación manual.
2. **Falla al descargar el chunk del acto** (sin red): la carcasa vuelve a "Seleccionar acto" con un aviso en vez de quedar en negro. → Task 1 (`loadFailed`) y Task 5 (`ActHost` llama a `loadFailed`).
3. **Escape con el diario abierto** cierra solo el diario, no abre opciones. → Task 4 (captura + `preventDefault`) y Task 5 (la carcasa ignora `defaultPrevented`).
4. **Partida terminada antes del cambio** (`lvr-mem-<seed>` con los 10 ítems): al entrar al Acto I se escribe `lvr-acts-done = [1]` y la intro muestra la frase de partida completa. → Task 3 (`onComplete` en el constructor).
5. **Entrada mientras el panel está abierto:** Enter/E no avanzan tarjetas y arrastrar no mueve la cámara. → Task 3 (`setPaused`).

---

### Task 1: Store de la carcasa

**Files:**
- Modify: `src/game/config.ts` (agregar clave a `STORAGE_KEYS`)
- Modify: `src/game/platform.ts` (exportar el tipo de `storage`)
- Create: `src/game/config.test.ts`
- Create: `src/state/shellStore.ts`
- Test: `src/state/shellStore.test.ts`

**Interfaces:**
- Produces:
  - `STORAGE_KEYS.actsDone === 'lvr-acts-done'` (las otras claves, iguales).
  - `export type KeyValueStorage = typeof storage` en `platform.ts`.
  - En `shellStore.ts`:
    ```ts
    export type Screen = 'menu' | 'select' | 'act';
    export interface ShellState {
      screen: Screen;
      actNumber: number | null;
      /** Sube en cada reinicio: cambia la key del host y fuerza un montaje nuevo. */
      mountKey: number;
      optionsOpen: boolean;
      sound: boolean;
      retro: boolean;
      actsDone: readonly number[];
      loadError: boolean;
      openSelect(): void;
      backToMenu(): void;
      startAct(n: number): void;
      loadFailed(): void;
      escape(): void;
      setOptionsOpen(open: boolean): void;
      exitToMenu(): void;
      restartAct(): void;
      toggleSound(): void;
      toggleRetro(): void;
      markCompleted(n: number): void;
    }
    export type ShellStore = StoreApi<ShellState>;
    export function createShellStore(storage?: KeyValueStorage): ShellStore; // default: platform `storage`
    ```

- [ ] **Step 1: Escribir los tests que fallan**

`src/game/config.test.ts`:
```ts
it('keeps the legacy storage keys', () => {
  expect(STORAGE_KEYS.seed).toBe('lvr-seed');
  expect(STORAGE_KEYS.retro).toBe('lvr-retro');
  expect(STORAGE_KEYS.sound).toBe('lvr-sound');
  expect(STORAGE_KEYS.memory(12345)).toBe('lvr-mem-12345');
  expect(STORAGE_KEYS.actsDone).toBe('lvr-acts-done');
});
```

`src/state/shellStore.test.ts`, con un storage falso respaldado por un `Map` (`get` → `map.get(k) ?? null`, `set`, `remove`):
- `starts on the menu with sound and retro on` → `screen 'menu'`, `actNumber null`, `sound true`, `retro true`, `actsDone []`, `optionsOpen false`, `loadError false`.
- `reads saved settings` → con `lvr-sound='0'` y `lvr-retro='0'`: `sound false`, `retro false`.
- `persists toggles` → `toggleSound()` → `sound false` y `lvr-sound === '0'`; otra vez → `'1'`. Igual con `toggleRetro`/`lvr-retro`.
- `marks acts done once, sorted` → `markCompleted(3); markCompleted(1); markCompleted(1)` → `actsDone [1, 3]` y `lvr-acts-done === '[1,3]'`.
- `ignores a corrupt acts-done value` → para `'nope'`, `'{"a":1}'` y `'[1,"x",9]'`: `actsDone` es `[]`, `[]` y `[1]` (solo enteros del 1 al 6).
- `navigates menu → select → act` → `openSelect()` → `'select'`; `startAct(1)` → `screen 'act'`, `actNumber 1`, `optionsOpen false`, `loadError false`.
- `escape depends on the screen` → en `'menu'` no cambia nada; en `'select'` vuelve a `'menu'`; en `'act'` alterna `optionsOpen` (`true`, después `false`).
- `exits to the menu` → desde un acto con opciones abiertas, `exitToMenu()` → `screen 'menu'`, `actNumber null`, `optionsOpen false`.
- `restarts the act` → `restartAct()` → `mountKey` sube en 1, `optionsOpen false`, `screen 'act'`, `actNumber` igual.
- `recovers from a failed load` → `startAct(1); loadFailed()` → `screen 'select'`, `actNumber null`, `loadError true`; un `startAct(1)` posterior → `loadError false`.

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/state/shellStore.test.ts src/game/config.test.ts`
Expected: FAIL (`createShellStore` no existe; `actsDone` es `undefined`).

- [ ] **Step 3: Implementar**

Agregar `actsDone: 'lvr-acts-done'` a `STORAGE_KEYS` y exportar `KeyValueStorage`. En `createShellStore`, usar `createStore` de `zustand/vanilla` (igual que `gameStore.ts`). Leer los ajustes con la misma regla que hoy usa `Game` (`!== '0'` → `true`). Para parsear `actsDone`: JSON → arreglo → filtrar enteros entre 1 y 6 → sin duplicados → ordenado; ante cualquier error, `[]`. Cada acción que cambia `sound`, `retro` o `actsDone` lo persiste en el mismo momento.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npx vitest run src/state/shellStore.test.ts src/game/config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/config.ts src/game/config.test.ts src/game/platform.ts src/state/shellStore.ts src/state/shellStore.test.ts
git commit -m "Add shell store with settings, act navigation and acts-done"
```

---

### Task 2: Contrato de acto y registro

**Files:**
- Create: `src/acts/types.ts`
- Create: `src/acts/registry.ts`
- Test: `src/acts/registry.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  import type { ReactNode } from 'react';
  export interface ActSettings { sound: boolean; retro: boolean }
  export interface ActContext {
    settings: ActSettings;
    markCompleted(): void;
    exitToMenu(): void;
    restart(): void;
  }
  export interface ActEngine {
    setPaused(paused: boolean): void;
    setSound(on: boolean): void;
    setRetro(on: boolean): void;
    dispose(): void;
  }
  export interface MountedAct { engine: ActEngine; ui: ReactNode }
  export interface ActModule { mount(host: HTMLElement, ctx: ActContext): MountedAct }
  export interface ActEntry {
    number: number;      // 1..6
    roman: string;       // 'I'..'VI'
    title?: string;      // opcional mientras el título no sea público
    available: boolean;
    load?: () => Promise<ActModule>;
  }
  ```
- Produces (`registry.ts`): `export const ACTS: readonly ActEntry[]` y `export function actByNumber(n: number): ActEntry | undefined`.
- Valores fijos: 1 `'I'` `'Astronauta'` disponible con `load: () => import('./act1').then((m) => m.act1)`; 2 `'II'` `'Despacio'` no disponible; 3–6 `'III'`–`'VI'` sin título, no disponibles.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
it('lists six acts numbered 1..6 with roman labels', () => {
  expect(ACTS.map((a) => a.number)).toEqual([1, 2, 3, 4, 5, 6]);
  expect(ACTS.map((a) => a.roman)).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI']);
});
it('has a loader exactly when an act is available', () => {
  for (const a of ACTS) expect(typeof a.load === 'function').toBe(a.available);
});
it('only Act I is available, titled Astronauta', () => {
  expect(ACTS.filter((a) => a.available).map((a) => a.number)).toEqual([1]);
  expect(actByNumber(1)?.title).toBe('Astronauta');
  expect(actByNumber(7)).toBeUndefined();
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/acts/registry.test.ts`
Expected: FAIL (no existe el módulo).

- [ ] **Step 3: Implementar `types.ts` y `registry.ts`**

`./act1` todavía no existe (Task 4). Para que typecheck pase en esta task, crear `src/acts/act1.tsx` como stub con `export const act1: ActModule = { mount() { throw new Error('Act I not wired yet'); } };`. Task 4 lo reemplaza. El test no ejecuta `load()`, así que no carga React ni Three en Node.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npx vitest run src/acts/registry.test.ts && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/acts
git commit -m "Add act contract and registry of the six acts"
```

---

### Task 3: `Game` cumple `ActEngine`

**Files:**
- Modify: `src/game/Game.ts` (constructor, acciones, `frame`, `remember`, `restart`)
- Modify: `src/state/gameStore.ts` (quitar `sound`/`retro` del estado y `toggleSound`/`toggleRetro` de `GameActions`)
- Modify: `src/ui/components/Hud.tsx` (quitar los botones Sonido y Píxeles; queda Diario)
- Modify: `src/App.tsx` (solo lo necesario para compilar con la nueva firma; se reescribe en Task 5)
- Create: `src/game/engine.ts`; Modify: `src/acts/types.ts` (reexporta)

**Interfaces:**
- Consumes: `ActEngine` y `ActSettings`, que se **mueven** de `src/acts/types.ts` a un archivo nuevo, `src/game/engine.ts`. `types.ts` los reexporta (`export type { ActEngine, ActSettings } from '../game/engine'`), así `src/game/**` nunca importa nada que toque React.
- Produces:
  ```ts
  export interface GameOptions {
    settings: ActSettings;
    onComplete(): void;
    onRestart(): void;
  }
  export class Game implements GameActions, ActEngine {
    constructor(container: HTMLElement, store: GameStore, options: GameOptions);
    setPaused(paused: boolean): void;
    setSound(on: boolean): void;
    setRetro(on: boolean): void;
    dispose(): void;
  }
  ```
  `GameActions` queda con `wake`, `advanceCard`, `keepWandering`, `restart`.

- [ ] **Step 1: Cambiar el constructor**

`retro` y `sound` salen de `options.settings` (ya no se lee `lvr-retro`/`lvr-sound` en `Game`; ahora es responsabilidad de la carcasa). Si al construirse `this.progress.isFinished` es `true`, llamar a `options.onComplete()` (Review Focus 4).

- [ ] **Step 2: Reemplazar `toggleSound`/`toggleRetro` por `setSound(on)`/`setRetro(on)`**

Mismo efecto que hoy sobre `audio.setEnabled` y `resize()`, pero sin escribir en storage ni en el store.

- [ ] **Step 3: Implementar `setPaused`**

Con `paused` en `true`: `frame` sigue renderizando la escena, pero no avanza `time`, jugador, atención, narrativa ni efectos; `Input.enabled()` devuelve `false`; `onKey` ignora Enter/E (Review Focus 5). Al reanudar, resetear `this.last = performance.now()`. El audio ambiente sigue sonando *(decisión de Claude)*.

- [ ] **Step 4: Completar y reiniciar mediante callbacks**

En `remember`, cuando `progress.isFinished` pasa a `true`, llamar a `options.onComplete()`. `restart()` borra `this.memoryKey` y llama a `options.onRestart()`, en vez de `location.reload()`. `onHashChange` sigue recargando la página (vuelve al menú: es aceptable).

- [ ] **Step 5: Ajustar el store del Acto I, `Hud` y `App`**

Quitar `sound`/`retro` de `GameUiState` y de `createGameStore`, y los dos botones de `Hud`. En `App.tsx`, construir `Game` con `{ settings: { sound: storage.get(STORAGE_KEYS.sound) !== '0', retro: storage.get(STORAGE_KEYS.retro) !== '0' }, onComplete: () => {}, onRestart: () => location.reload() }` y quitar las dos acciones del `useMemo`. Este estado es transitorio hasta Task 5.

- [ ] **Step 6: Verificar**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: todo pasa; `terrain.test.ts`, `progress.test.ts` y `narrative.test.ts` sin cambios.

- [ ] **Step 7: Commit**

```bash
git add src/game/Game.ts src/game/engine.ts src/acts/types.ts src/state/gameStore.ts src/ui/components/Hud.tsx src/App.tsx
git commit -m "Make Game an ActEngine: injected settings, pause, completion and restart callbacks"
```

---

### Task 4: Adaptador del Acto I

**Files:**
- Modify: `src/acts/act1.tsx` (reemplaza el stub)
- Create: `src/ui/Act1Ui.tsx` (la composición de capas que hoy está en `App.tsx`)
- Modify: `src/ui/components/Journal.tsx` (Escape en fase de captura)

**Interfaces:**
- Consumes: `ActModule`, `ActContext`, `MountedAct` (Task 2); `Game`, `GameOptions` (Task 3); `createGameStore`, `GameActions` (`gameStore.ts`); `GameContext` (`src/ui/GameContext.tsx`).
- Produces: `export const act1: ActModule` en `src/acts/act1.tsx`; `export function Act1Ui(): JSX.Element` en `src/ui/Act1Ui.tsx`.

- [ ] **Step 1: Mover la composición a `Act1Ui`**

`Act1Ui` renderiza, en el mismo orden de DOM que hoy (el orden define el apilado): `Blink`, `Reticle`, `Whisper`, `MemoryCard`, `Hud`, `Intro`, `Journal`, `Ending`, `Stick`. El estado `journalOpen` se mueve aquí. No renderiza el `<div>` host.

- [ ] **Step 2: Escape en `Journal`**

Mientras `open` es `true`, registrar `addEventListener('keydown', h, true)` en `window` (fase de captura); `h` hace `preventDefault()` y `onClose()` si `e.key === 'Escape'`. Limpiar el listener en el cleanup del efecto (Review Focus 3).

- [ ] **Step 3: Implementar `act1.mount(host, ctx)`**

Crear el store con `createGameStore()`, el `Game` con `{ settings: ctx.settings, onComplete: ctx.markCompleted, onRestart: ctx.restart }` y las `GameActions` delegando en el `Game`. Devolver `{ engine: game, ui: <GameContext.Provider value={{ store, actions }}><Act1Ui /></GameContext.Provider> }`.

- [ ] **Step 4: Verificar**

Run: `npm run lint && npm run typecheck && npm test`
Expected: PASS (todavía no hay quien llame a `act1`; se prueba en Task 5).

- [ ] **Step 5: Commit**

```bash
git add src/acts/act1.tsx src/ui/Act1Ui.tsx src/ui/components/Journal.tsx
git commit -m "Wrap Act I as an act module"
```

---

### Task 5: Carcasa en pantalla (menú, selección, opciones, host)

**Files:**
- Create: `src/content/shellCopy.ts`
- Create: `src/ui/shell/ShellContext.tsx` (contexto + `useShell(selector)`, mismo patrón que `GameContext.tsx`)
- Create: `src/ui/shell/MainMenu.tsx`, `src/ui/shell/ActSelect.tsx`, `src/ui/shell/OptionsPanel.tsx`, `src/ui/shell/Shell.css`
- Create: `src/ActHost.tsx` (nivel aplicación: monta el acto)
- Modify: `src/App.tsx` (reescritura)

**Interfaces:**
- Consumes: `createShellStore`, `ShellState` (Task 1); `ACTS`, `actByNumber`, `ActEngine`, `ActContext` (Task 2); `act1` vía `load()` (Task 4).
- Produces: `SHELL_COPY` en `shellCopy.ts`:
  ```ts
  // Provisional: el autor reescribe en UI-02.
  export const SHELL_COPY = {
    selectAct: 'Seleccionar acto',
    back: 'Volver',
    actLabel: (roman: string, title?: string) => (title ? `Acto ${roman} — ${title}` : `Acto ${roman}`),
    loadError: 'No se pudo cargar el acto.',
    options: 'Opciones',
    resume: 'Continuar',
    sound: 'Sonido',
    pixels: 'Píxeles',
    toMenu: 'Volver al menú principal',
  } as const;
  ```

- [ ] **Step 1: Componentes de pantalla**

- `MainMenu`: `COPY.title` (de `copy.ts`) y un botón `.primary` con `selectAct` → `openSelect()`.
- `ActSelect`: un botón por entrada de `ACTS`, con `actLabel(roman, title)`. Los no disponibles van con `disabled`. Clic → `startAct(number)`. Botón `.quiet` `back` → `backToMenu()`. Si `loadError`, mostrar `loadError` encima de la lista.
- `OptionsPanel`: visible si `screen === 'act'`. Siempre muestra un botón `options` (táctil, fijo, sin tapar el contador ni el botón Diario del HUD) que abre el panel. Con el panel abierto: `resume` (cierra), `sound` y `pixels` (con `aria-pressed`, alternan en el store) y `toMenu` → `exitToMenu()`.
- Reutilizar `.veil`, `.card`, `.primary` y `.quiet` de `base.css`. `Shell.css` solo agrega lo mínimo (lista de actos, botón de opciones). El diseño final es ART-01/UI-02.

- [ ] **Step 2: `ActHost`**

`<ActHost number mountKey />` renderiza un `<div>` host y la `ui` del acto. En un efecto sobre `[number, mountKey]`:
1. Llamar a `actByNumber(number)!.load!()`.
2. Si el efecto ya se limpió, no montar; si no, `mount(host, ctx)`, guardar el `engine` en un ref y la `ui` en estado.
3. Si falla la carga, llamar a `loadFailed()`.
4. En el cleanup: marcar cancelado, `engine.dispose()`, ref a `null` y `ui` a `null`.

`ctx`: `settings` leídos del store en ese momento; `markCompleted: () => markCompleted(number)`; `exitToMenu`; `restart: restartAct`. Otros efectos sincronizan `optionsOpen` → `engine.setPaused`, `sound` → `setSound` y `retro` → `setRetro`. Debe funcionar con el doble montaje de `StrictMode` (Review Focus 1).

- [ ] **Step 3: Reescribir `App`**

Crear el store de la carcasa con `useState(() => createShellStore())` y proveerlo. Según `screen`, renderizar `MainMenu`, `ActSelect` o `<ActHost key={mountKey} number={actNumber!} mountKey={mountKey} />` + `OptionsPanel`. Registrar un `keydown` en `window` (fase de burbuja): si `e.key === 'Escape' && !e.defaultPrevented`, llamar a `escape()`. `App` ya no importa `Game` ni nada de `src/game/**` salvo `platform`/`config`.

- [ ] **Step 4: Verificar el build y la separación de chunks**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Then: `grep -c "three" dist/index.html`
Expected: todo pasa y el grep da `0`: `index.html` no precarga el chunk de `three`. Si Vite lo precarga por el `manualChunks`, quitar `three` de `manualChunks` en `vite.config.ts` y repetir.

- [ ] **Step 5: Verificación manual en el navegador (`npm run dev`)**

1. Al abrir: menú → "Seleccionar acto" → 6 actos; solo "Acto I — Astronauta" está habilitado.
2. Acto I → la intro del Acto I se ve sobre el valle → Despertar → se juega.
3. Escape → panel de opciones; Enter y arrastrar no hacen nada; Continuar → sigue igual.
4. Diario abierto + Escape → se cierra solo el diario.
5. Opciones → "Volver al menú principal" → menú. Repetir menú ↔ Acto I 5 veces: `document.querySelectorAll('canvas').length === 1`, sin errores en consola, una sola capa de sonido.
6. Con progreso a medias: salir y volver conserva los ítems (Isi aparece en el punto de inicio).
7. Con DevTools en modo offline, desde el menú en un build recién cargado (`npm run preview`): elegir Acto I → vuelve a la selección con "No se pudo cargar el acto."
8. Con `lvr-mem-<seed>` completo de antes: entrar al Acto I → `localStorage['lvr-acts-done'] === '[1]'`.
9. Viewport de teléfono: el botón de opciones se puede tocar y no tapa el HUD.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/ActHost.tsx src/ui/shell src/content/shellCopy.ts vite.config.ts
git commit -m "Add main menu, act select and options panel shell"
```

---

### Task 6: Documentación

**Files:**
- Modify: `CLAUDE.md` (Arquitectura reglas 1–2; "Estado actual"; "Ideas de evolución")
- Modify: `docs/adr/0001-multi-acto.md` (estado)
- Modify: `docs/roadmap.md` (nota en ENG-01)

- [ ] **Step 1: Actualizar `CLAUDE.md`**

- La regla 2 pasa a: el store de la carcasa (`src/state/shellStore.ts`) + un store por acto (el del Acto I es `src/state/gameStore.ts`), con el mismo patrón.
- Agregar: la carcasa solo llega a un acto mediante `src/acts/registry.ts` (`import()` dinámico); `src/acts/**` y `App.tsx` son la única capa que junta motor y UI.
- Agregar `lvr-acts-done` a la lista de claves.
- Reemplazar el pendiente "Arquitectura multi-acto decidida, sin implementar" por "implementada".
- En "Ideas de evolución", quitar "Code-splitting del motor detrás de la intro" (hecho).

- [ ] **Step 2: Estado del ADR y del roadmap**

ADR: `- **Estado:** aceptada e implementada (2026-11-04)`. Roadmap ENG-01: `✅ hecho (2026-11-04): ADR aprobado e implementado`.

- [ ] **Step 3: Verificar y hacer commit**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: PASS

```bash
git add CLAUDE.md docs/adr/0001-multi-acto.md docs/roadmap.md
git commit -m "Document multi-act shell architecture"
```
