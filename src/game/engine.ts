/** Global settings the shell hands to every act. */
export interface ActSettings {
  sound: boolean;
  retro: boolean;
}

/** What the shell can ask of a running act's engine. No React here: engines stay UI-agnostic. */
export interface ActEngine {
  /** Stops simulation and input (rendering may continue) while the options panel is open. */
  setPaused(paused: boolean): void;
  setSound(on: boolean): void;
  setRetro(on: boolean): void;
  /** Leaves no loop, listener, GPU resource, audio context or canvas behind. */
  dispose(): void;
}
