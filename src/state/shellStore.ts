import { createStore, type StoreApi } from 'zustand/vanilla';
import { actEvent, track } from '../analytics';
import { STORAGE_KEYS } from '../game/config';
import { storage as defaultStorage, type KeyValueStorage } from '../game/platform';
import { DEFAULT_LOOK, DEFAULT_TEXT, LOOK_LEVELS, parseLevel, snapToLevel, TEXT_LEVELS } from './accessibility';

export type Screen = 'menu' | 'select' | 'act';

/**
 * State of the shell: the layer around the acts (main menu, act select, options, global settings).
 * Knows nothing about any act's world; acts are mounted by `ActHost` from the registry.
 */
export interface ShellState {
  screen: Screen;
  actNumber: number | null;
  /** Bumped on every restart: changes the host's key and forces a fresh mount. */
  mountKey: number;
  optionsOpen: boolean;
  sound: boolean;
  retro: boolean;
  /** Camera sensitivity multiplier, one of `LOOK_LEVELS` (ENG-09). */
  lookSensitivity: number;
  /** Text size scale, one of `TEXT_LEVELS` (ENG-09). */
  textScale: number;
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
  /** Snaps to the nearest level and persists. */
  setLookSensitivity(value: number): void;
  /** Snaps to the nearest level and persists. */
  setTextScale(value: number): void;
  markCompleted(n: number): void;
}

export type ShellStore = StoreApi<ShellState>;

const ACT_COUNT = 6;

function parseActsDone(raw: string | null): number[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= ACT_COUNT);
    return [...new Set(valid)].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

const reloadPage = (): void => location.reload();

/**
 * @param reload Called instead of retrying in place once an act failed to load: a failed chunk stays
 *   failed in this page (cached dynamic import, Vite's preload bookkeeping, or a stale hash after a deploy).
 * @param trackEvent Anonymous analytics (ENG-05): act starts and first completions.
 */
export function createShellStore(
  storage: KeyValueStorage = defaultStorage,
  reload = reloadPage,
  trackEvent: (event: string) => void = track,
): ShellStore {
  return createStore<ShellState>()((set, get) => ({
    screen: 'menu',
    actNumber: null,
    mountKey: 0,
    optionsOpen: false,
    sound: storage.get(STORAGE_KEYS.sound) !== '0',
    retro: storage.get(STORAGE_KEYS.retro) !== '0',
    lookSensitivity: parseLevel(storage.get(STORAGE_KEYS.lookSensitivity), LOOK_LEVELS, DEFAULT_LOOK),
    textScale: parseLevel(storage.get(STORAGE_KEYS.textScale), TEXT_LEVELS, DEFAULT_TEXT),
    actsDone: parseActsDone(storage.get(STORAGE_KEYS.actsDone)),
    loadError: false,

    openSelect: () => set({ screen: 'select' }),
    backToMenu: () => set({ screen: 'menu' }),
    startAct: (n) => {
      if (get().loadError) {
        reload();
        return;
      }
      set({ screen: 'act', actNumber: n, optionsOpen: false });
      trackEvent(actEvent(n, 'inicio'));
    },
    loadFailed: () => set({ screen: 'select', actNumber: null, optionsOpen: false, loadError: true }),
    escape: () => {
      const { screen, optionsOpen } = get();
      if (screen === 'select') set({ screen: 'menu' });
      else if (screen === 'act') set({ optionsOpen: !optionsOpen });
    },
    setOptionsOpen: (open) => set({ optionsOpen: open }),
    exitToMenu: () => set({ screen: 'menu', actNumber: null, optionsOpen: false }),
    restartAct: () => set((s) => ({ mountKey: s.mountKey + 1, optionsOpen: false })),
    toggleSound: () => {
      const sound = !get().sound;
      storage.set(STORAGE_KEYS.sound, sound ? '1' : '0');
      set({ sound });
    },
    toggleRetro: () => {
      const retro = !get().retro;
      storage.set(STORAGE_KEYS.retro, retro ? '1' : '0');
      set({ retro });
    },
    setLookSensitivity: (value) => {
      const lookSensitivity = snapToLevel(value, LOOK_LEVELS);
      storage.set(STORAGE_KEYS.lookSensitivity, String(lookSensitivity));
      set({ lookSensitivity });
    },
    setTextScale: (value) => {
      const textScale = snapToLevel(value, TEXT_LEVELS);
      storage.set(STORAGE_KEYS.textScale, String(textScale));
      set({ textScale });
    },
    markCompleted: (n) => {
      const first = !get().actsDone.includes(n);
      const actsDone = parseActsDone(JSON.stringify([...get().actsDone, n]));
      storage.set(STORAGE_KEYS.actsDone, JSON.stringify(actsDone));
      set({ actsDone });
      if (first && actsDone.includes(n)) trackEvent(actEvent(n, 'completado'));
    },
  }));
}
