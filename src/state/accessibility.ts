/**
 * Accessibility options (ENG-09): camera sensitivity and text size. Discrete levels so every value
 * a player can save is one the UI can show; anything else in storage falls back to the default.
 */

/** Multiplier on the engine's base look speed (mouse and touch alike). */
export const LOOK_LEVELS = [0.5, 0.75, 1, 1.5, 2] as const;
export const DEFAULT_LOOK = 1;

/** Root font-size scale. Every UI font size is in `rem`, so this scales all in-game and shell text. */
export const TEXT_LEVELS = [1, 1.25, 1.5] as const;
export const DEFAULT_TEXT = 1;

/** Parses a stored value; returns `fallback` unless it is exactly one of `levels`. */
export function parseLevel(raw: string | null, levels: readonly number[], fallback: number): number {
  if (raw === null || raw.trim() === '') return fallback;
  const n = Number(raw);
  return levels.includes(n) ? n : fallback;
}

/** The level closest to `value` (ties go to the lower one). */
export function snapToLevel(value: number, levels: readonly number[]): number {
  if (!Number.isFinite(value)) return levels[0];
  return levels.reduce((best, l) => (Math.abs(l - value) < Math.abs(best - value) ? l : best), levels[0]);
}
