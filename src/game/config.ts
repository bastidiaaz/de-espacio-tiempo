/** World + gameplay tuning. Changing world values changes every seed's world. */
export const WATER = -1.2;
export const CHUNK_SIZE = 56;
export const CHUNK_SEGMENTS = 16;
export const CHUNK_STEP = CHUNK_SIZE / CHUNK_SEGMENTS;
export const CAMP_HEIGHT = 2.4;
export const SHIP_HEIGHT = 2.0;
export const SHIP_DISTANCE = 110;

/** Seconds of steady gaze needed to remember something. */
export const DWELL_SECONDS = 1.7;
/** Seconds without progress before a chapter hint appears. */
export const HINT_DELAY = 45;
/** Walkable radius once the player chooses to keep wandering. */
export const FREE_ROAM_RADIUS = 400;

/** Chunks loaded around the player (per axis, each side). */
export const viewRadiusFor = (coarsePointer: boolean): number => (coarsePointer ? 2 : 3);

export const STORAGE_KEYS = {
  seed: 'lvr-seed',
  retro: 'lvr-retro',
  sound: 'lvr-sound',
  memory: (seed: number) => `lvr-mem-${seed}`,
  /** JSON array of finished act numbers, e.g. `[1]`. Owned by the shell. */
  actsDone: 'lvr-acts-done',
} as const;
