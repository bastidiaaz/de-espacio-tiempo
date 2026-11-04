import { STORAGE_KEYS } from '../config';
import { parseHash } from '../debug';
import { storage } from '../platform';

/** Seed priority: `#w123` in the URL, then the last seed played, then a new random one. */
export function resolveSeed(): number {
  const seed =
    parseHash(location.hash).seed ?? (parseInt(storage.get(STORAGE_KEYS.seed) ?? '', 10) || (Math.random() * 1e9) | 0);
  storage.set(STORAGE_KEYS.seed, String(seed));
  return seed;
}
