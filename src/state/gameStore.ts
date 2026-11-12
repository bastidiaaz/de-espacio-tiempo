import { createStore, type StoreApi } from 'zustand/vanilla';
import type { CardKind } from '../game/systems/narrative';
import type { StickState } from '../game/systems/input';
import type { MixState } from '../game/systems/mix';

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
  /** Hidden objects found in the free roam (ENG-13). Not part of the counter. */
  hiddenFound: readonly string[];
  total: number;
  card: CardView | null;
  cardVisible: boolean;
  whisper: string;
  whisperVisible: boolean;
  reticleNear: boolean;
  /** 0..1 progress of the attention ring. */
  focus: number;
  endingVisible: boolean;
  /** Isi is sitting by the fire, or sitting down / getting up (DIS-07): no walking. */
  seated: boolean;
  /** Short black fade, used instead of camera motion with reduced motion. */
  fade: boolean;
  /** 0..1 how deep into the dark band before the edge (ENG-14), in steps of 0.05: drives the vignette. */
  edge: number;
  stick: StickState;
  /** `#debug` in the URL (ENG-03). Everything below is only published while it is on. */
  debug: boolean;
  debugChapter: number;
  /** Walkable radius around camp right now, and where it is heading (metres, rounded). */
  debugRadius: number;
  debugRadiusTarget: number;
  /** Width of the dark band before the edge (metres, rounded). */
  debugBand: number;
}

export type GameStore = StoreApi<GameUiState>;

export const createGameStore = (): GameStore =>
  createStore<GameUiState>()(() => ({
    phase: 'intro',
    introLede: '',
    remembered: [],
    hiddenFound: [],
    total: 0,
    card: null,
    cardVisible: false,
    whisper: '',
    whisperVisible: false,
    reticleNear: false,
    focus: 0,
    endingVisible: false,
    seated: false,
    fade: false,
    edge: 0,
    stick: { active: false, x: 0, y: 0, dx: 0, dy: 0 },
    debug: false,
    debugChapter: 0,
    debugRadius: 0,
    debugRadiusTarget: 0,
    debugBand: 0,
  }));

/** Commands the UI can send to the engine. */
export interface GameActions {
  wake(): void;
  advanceCard(): void;
  keepWandering(): void;
  restart(): void;
  /** Debug only: earlier chapters remembered, this one active, nothing saved. */
  debugJumpToChapter(chapter: number): void;
  /** Debug only: jump to the item's chapter and stand in front of it; the gaze is up to the player. */
  debugJumpToItem(id: string): void;
  /** Debug only: remember everything that is left, playing the closing sequence. */
  debugCompleteAll(): void;
  /** Debug only: straight into the free roam, standing where the hidden object can be looked at. */
  debugJumpToHidden(id: string): void;
  /** Debug only: straight into the free roam, at the foot of the mirador's ramp or on its summit (ART-08). */
  debugJumpToMirador(where: 'foot' | 'summit'): void;
  /** Debug only: forget the hidden objects found (in memory; nothing is saved in debug). */
  debugResetHidden(): void;
  /** Debug only: force these values of the audio mix (silence, chapter layers, wind, edge), replacing earlier ones; `null` clears it. */
  debugAudio(patch: Partial<MixState> | null): void;
  /** Debug only: play the chorus of "Astronauta" from the top (AUD-01). */
  debugPlayChorus(): void;
}
