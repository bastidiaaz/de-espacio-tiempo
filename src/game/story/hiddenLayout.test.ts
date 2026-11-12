import { describe, expect, it } from 'vitest';
import { HIDDEN_IDS } from '../../content/story';
import { makeNoise } from '../math/noise';
import { mulberry32 } from '../math/random';
import { TerrainField } from '../world/terrain';
import { WATER } from '../config';
import {
  HIDDEN_MAX_DIST,
  HIDDEN_MIN_DIST,
  LETTER_MAX_DIST,
  LETTER_MIN_DIST,
  MIN_SEPARATION,
  angleBetween,
  facesAlong,
  layoutHidden,
} from './hiddenLayout';

const dry = () => true;

describe('angleBetween', () => {
  it('wraps around the circle', () => {
    expect(angleBetween(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(0.2);
    expect(angleBetween(-3, 3)).toBeCloseTo(Math.PI * 2 - 6);
    expect(angleBetween(1, 1)).toBe(0);
  });
});

describe('layoutHidden', () => {
  it('is deterministic per seed and differs between seeds', () => {
    const a = layoutHidden({ seed: 7, shipAngle: 0, starAngle: 0.6, isDry: dry });
    const b = layoutHidden({ seed: 7, shipAngle: 0, starAngle: 0.6, isDry: dry });
    const c = layoutHidden({ seed: 8, shipAngle: 0, starAngle: 0.6, isDry: dry });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('does not consume the world generator', () => {
    const before = mulberry32(12345)();
    layoutHidden({ seed: 12345, shipAngle: 0, starAngle: 0.6, isDry: dry });
    expect(mulberry32(12345)()).toBe(before);
  });

  it.each(Array.from({ length: 40 }, (_, i) => i * 977 + 3))(
    'seed %i: rings, and one direction each, away from ship and star',
    (seed) => {
      const shipAngle = mulberry32(seed)() * Math.PI * 2;
      const { spots, miradorAngle } = layoutHidden({ seed, shipAngle, starAngle: 0.6, isDry: dry });
      const angles = HIDDEN_IDS.map((id) => spots[id].angle);
      for (const id of HIDDEN_IDS) {
        const d = Math.hypot(spots[id].x, spots[id].z);
        if (id === 'letter') {
          expect(d).toBeGreaterThanOrEqual(LETTER_MIN_DIST);
          expect(d).toBeLessThanOrEqual(LETTER_MAX_DIST);
        } else {
          expect(d).toBeGreaterThanOrEqual(HIDDEN_MIN_DIST);
          expect(d).toBeLessThanOrEqual(HIDDEN_MAX_DIST);
        }
      }
      // Ship and star come from elsewhere and may be close to each other: only pairs with a hidden one count.
      const all = [shipAngle, 0.6, ...angles];
      for (let i = 0; i < all.length; i++)
        for (let j = Math.max(i + 1, 2); j < all.length; j++)
          expect(angleBetween(all[i], all[j])).toBeGreaterThanOrEqual(MIN_SEPARATION - 1e-9);
      expect(miradorAngle).toBe(spots.letter.angle);
    },
  );

  it('moves a spot that falls in water to the nearest dry point, still inside its ring', () => {
    const base = layoutHidden({ seed: 42, shipAngle: 0, starAngle: 0.6, isDry: dry });
    const wet = base.spots.guitar;
    // A 20 m pond right where the guitar would go.
    const isDry = (x: number, z: number) => Math.hypot(x - wet.x, z - wet.z) > 20;
    const moved = layoutHidden({ seed: 42, shipAngle: 0, starAngle: 0.6, isDry }).spots.guitar;
    const shift = Math.hypot(moved.x - wet.x, moved.z - wet.z);
    expect(shift).toBeGreaterThan(20);
    expect(shift).toBeLessThan(24);
    const d = Math.hypot(moved.x, moved.z);
    expect(d).toBeGreaterThanOrEqual(HIDDEN_MIN_DIST);
    expect(d).toBeLessThanOrEqual(HIDDEN_MAX_DIST);
  });

  it('lands every spot on dry ground on real terrain', () => {
    for (const seed of [1, 123, 12345, 987654]) {
      const field = new TerrainField(makeNoise(seed), seed);
      const isDry = (x: number, z: number) => field.groundAt(x, z) > WATER + 0.4;
      const { spots } = layoutHidden({
        seed,
        shipAngle: Math.atan2(field.shipZ, field.shipX),
        starAngle: 0.6,
        isDry,
      });
      // The letter is not moved: the mirador's mountain is built under it (mirador.test.ts).
      for (const id of HIDDEN_IDS)
        if (id !== 'letter') expect(isDry(spots[id].x, spots[id].z), `${seed} ${id}`).toBe(true);
    }
  });
});

describe('facesAlong', () => {
  it('only from the side that looks along the given direction', () => {
    // Object at the origin, required look direction +x.
    expect(facesAlong(-5, 0, 0, 0, 0, 1.2)).toBe(true);
    expect(facesAlong(-5, 4, 0, 0, 0, 1.2)).toBe(true);
    expect(facesAlong(5, 0, 0, 0, 0, 1.2)).toBe(false);
    expect(facesAlong(0, -5, 0, 0, 0, 1.2)).toBe(false);
  });
});
