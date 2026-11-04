import type { ActEntry } from './types';

/**
 * The six acts, one per song of the album. The shell draws the tracklist from this list and reaches
 * an act's code only through `load()` (a dynamic import, so each act is its own build chunk).
 * Enabling an act = `available: true` + its `load`.
 */
export const ACTS: readonly ActEntry[] = [
  { number: 1, roman: 'I', title: 'Astronauta', available: true, load: () => import('./act1').then((m) => m.act1) },
  { number: 2, roman: 'II', title: 'Despacio', available: false },
  { number: 3, roman: 'III', available: false },
  { number: 4, roman: 'IV', available: false },
  { number: 5, roman: 'V', available: false },
  { number: 6, roman: 'VI', available: false },
];

export const actByNumber = (n: number): ActEntry | undefined => ACTS.find((a) => a.number === n);
