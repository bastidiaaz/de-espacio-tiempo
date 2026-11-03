import { STORAGE_KEYS } from '../config';
import { storage } from '../platform';

/** Seed priority: `#w123` in the URL, then the last seed played, then a new random one. */
export function resolveSeed(): number {
  const hm = location.hash.match(/^#w(\d{1,9})$/);
  const seed = hm
    ? parseInt(hm[1], 10)
    : parseInt(storage.get(STORAGE_KEYS.seed) ?? '', 10) || (Math.random() * 1e9) | 0;
  storage.set(STORAGE_KEYS.seed, String(seed));
  return seed;
}
