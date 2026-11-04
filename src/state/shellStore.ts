import { createStore, type StoreApi } from 'zustand/vanilla';
import { STORAGE_KEYS } from '../game/config';
import { storage as defaultStorage, type KeyValueStorage } from '../game/platform';

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
 */
export function createShellStore(storage: KeyValueStorage = defaultStorage, reload = reloadPage): ShellStore {
  return createStore<ShellState>()((set, get) => ({
    screen: 'menu',
    actNumber: null,
    mountKey: 0,
    optionsOpen: false,
    sound: storage.get(STORAGE_KEYS.sound) !== '0',
    retro: storage.get(STORAGE_KEYS.retro) !== '0',
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
    markCompleted: (n) => {
      const actsDone = parseActsDone(JSON.stringify([...get().actsDone, n]));
      storage.set(STORAGE_KEYS.actsDone, JSON.stringify(actsDone));
      set({ actsDone });
    },
  }));
}
