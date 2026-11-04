import type { ReactNode } from 'react';
import type { ActEngine, ActSettings } from '../game/engine';

export type { ActEngine, ActSettings } from '../game/engine';

/** What the shell gives an act when mounting it. */
export interface ActContext {
  settings: ActSettings;
  markCompleted(): void;
  exitToMenu(): void;
  restart(): void;
}

export interface MountedAct {
  engine: ActEngine;
  ui: ReactNode;
}

/** The contract every act fulfils. See docs/adr/0001-multi-acto.md. */
export interface ActModule {
  mount(host: HTMLElement, ctx: ActContext): MountedAct;
}

export interface ActEntry {
  /** 1..6, album tracklist order. */
  number: number;
  roman: string;
  /** Optional while the song title isn't public. */
  title?: string;
  /** The act exists (its song is out). Nothing else gates it. */
  available: boolean;
  load?: () => Promise<ActModule>;
}
