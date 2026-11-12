/**
 * Boiling line (ART-01): the hand-drawn line never sits still, as if each frame had been redrawn.
 *
 * A boil is a short loop of "drawings". Each drawing is an SVG filter that displaces the element by
 * a different noise field; a stepped CSS animation swaps one filter for the next a few times per
 * second. Nothing runs in JS per frame, and the browser only repaints the boiling elements.
 *
 * This file is the pure part (ids, CSS text); `BoilFilters.tsx` renders it.
 */

/** Drawings per loop. Three or four is what hand animation uses; more only costs filters. */
export const BOIL_FRAMES = 4;

/** Displacement in px (`feDisplacementMap` scale; a point moves up to half of it either way). */
export const BOIL_LEVELS = {
  /** Strokes: frames, rules, stars. */
  boil: 3.2,
  /** Text and small drawings, where legibility comes first. */
  'boil-soft': 1.5,
} as const;

export type BoilLevel = keyof typeof BOIL_LEVELS;

export const boilFilterId = (level: BoilLevel, frame: number): string => `sk-${level}-${frame}`;

/**
 * The `@keyframes` behind the `.sk-boil` / `.sk-boil-soft` classes of `styles/sketch.css`.
 *
 * It has to be emitted inline, next to the filters: `url(#id)` inside an external stylesheet is
 * resolved against that file's URL by some browsers, where the filters don't exist. Without it the
 * classes do nothing, so a screen that forgets `<BoilFilters />` just gets a still line.
 */
export function boilCss(): string {
  return (Object.keys(BOIL_LEVELS) as BoilLevel[])
    .map((level) => {
      const steps = Array.from({ length: BOIL_FRAMES }, (_, frame) => {
        const at = Math.round((frame / BOIL_FRAMES) * 10000) / 100;
        return `${at}%{filter:url(#${boilFilterId(level, frame)})}`;
      });
      return `@keyframes sk-${level}{${steps.join('')}}`;
    })
    .join('');
}
