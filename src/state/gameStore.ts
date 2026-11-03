import { createStore, type StoreApi } from 'zustand/vanilla';
import type { CardKind } from '../game/systems/narrative';
import type { StickState } from '../game/systems/input';

export type Phase = 'intro' | 'waking' | 'play';

export interface CardView {
  title: string;
  text: string;
  kind: CardKind;
  /** Typed-out portion. */
  shown: string;
  done: boolean;
}

/**
 * Everything the React UI needs to render. The game engine writes it; React only reads it
 * (and calls GameActions to talk back).
 */
export interface GameUiState {
  phase: Phase;
  introLede: string;
  /** Remembered memory ids. */
  remembered: readonly string[];
  total: number;
  card: CardView | null;
  cardVisible: boolean;
  whisper: string;
  whisperVisible: boolean;
  reticleNear: boolean;
  /** 0..1 progress of the attention ring. */
  focus: number;
  endingVisible: boolean;
  sound: boolean;
  retro: boolean;
  stick: StickState;
}

export type GameStore = StoreApi<GameUiState>;

export const createGameStore = (): GameStore =>
  createStore<GameUiState>()(() => ({
    phase: 'intro',
    introLede: '',
    remembered: [],
    total: 0,
    card: null,
    cardVisible: false,
    whisper: '',
    whisperVisible: false,
    reticleNear: false,
    focus: 0,
    endingVisible: false,
    sound: true,
    retro: true,
    stick: { active: false, x: 0, y: 0, dx: 0, dy: 0 },
  }));

/** Commands the UI can send to the engine. */
export interface GameActions {
  wake(): void;
  advanceCard(): void;
  toggleSound(): void;
  toggleRetro(): void;
  keepWandering(): void;
  restart(): void;
}
