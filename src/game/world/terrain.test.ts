import { describe, expect, it } from 'vitest';
import golden from '../__fixtures__/golden-seed-12345.json';
import { makeNoise } from '../math/noise';
import { mulberry32 } from '../math/random';
import { TerrainField } from './terrain';

/**
 * Determinism guard. The fixture was generated from the original single-file game
 * (reference/lumen-vale-remember.html). If this fails, existing seeds now produce different worlds.
 */
describe('world generation parity (seed 12345)', () => {
  const noise = makeNoise(golden.seed);
  const field = new TerrainField(noise, golden.seed);

  it('PRNG sequence is unchanged', () => {
    const r = mulberry32(golden.seed);
    expect([r(), r(), r()]).toEqual(golden.rng);
  });

  it('noise is unchanged', () => {
    expect([noise(0.3, 0.7), noise(-12.4, 8.1)]).toEqual(golden.noise);
  });

  it('crash site direction is unchanged', () => {
    expect([field.shipX, field.shipZ]).toEqual(golden.ship);
  });

  it.each(golden.points)('heights at ($x, $z) are unchanged', ({ x, z, raw, h, g }) => {
    expect(field.rawHeight(x, z)).toBe(raw);
    expect(field.heightAt(x, z)).toBe(h);
    expect(field.groundAt(x, z)).toBe(g);
  });
});
