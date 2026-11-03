export type Rng = () => number;

/** Small, fast, seedable PRNG. Changing it changes every generated world. */
export function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Hash2 = (x: number, z: number) => number;

/** Deterministic 2D hash in [0, 1). Used for per-triangle color jitter. */
export function createHash2(seed: number): Hash2 {
  return (x, z) => {
    const s = Math.sin(x * 12.9898 + z * 78.233 + seed * 0.001) * 43758.5453;
    return s - Math.floor(s);
  };
}
