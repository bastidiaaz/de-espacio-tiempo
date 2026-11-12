import { describe, expect, it } from 'vitest';
import { WIND_MAX_GAIN, windBodyHz, windGain, windNoise, windWhistle } from './wind';

/** Small deterministic generator, so the test never flakes. */
const lcg = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

describe('windNoise', () => {
  const n = 48000;
  const d = windNoise(n, lcg(7));

  it('stays within -1..1 and reaches the peak', () => {
    let peak = 0;
    for (const v of d) peak = Math.max(peak, Math.abs(v));
    expect(peak).toBeCloseTo(1, 5);
  });

  it('loops without a click: the seam is as smooth as any other step', () => {
    let maxStep = 0;
    for (let i = 1; i < n; i++) maxStep = Math.max(maxStep, Math.abs(d[i] - d[i - 1]));
    expect(Math.abs(d[0] - d[n - 1])).toBeLessThanOrEqual(maxStep * 2);
  });

  it('is soft: far more energy low than high', () => {
    let diff = 0;
    let total = 0;
    for (let i = 1; i < n; i++) {
      diff += (d[i] - d[i - 1]) ** 2;
      total += d[i] ** 2;
    }
    expect(diff / total).toBeLessThan(0.05);
  });
});

describe('wind curves', () => {
  it('grow with the level and clamp it', () => {
    expect(windGain(0)).toBe(0);
    expect(windGain(1)).toBe(WIND_MAX_GAIN);
    expect(windGain(3)).toBe(WIND_MAX_GAIN);
    expect(windBodyHz(1)).toBeGreaterThan(windBodyHz(0.2));
    expect(windWhistle(1)).toBeGreaterThan(windWhistle(0.5) * 2);
  });
});
