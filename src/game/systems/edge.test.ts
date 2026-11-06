import { describe, expect, it } from 'vitest';
import {
  BAND_MAX,
  BAND_MIN,
  BOUNCE_DECAY,
  BOUNCE_SPEED,
  EdgeBounce,
  EDGE_PUSH,
  FREE_ROAM_BAND,
  ITEM_CLEARANCE,
  bandWidth,
  edgeLevel,
  MIRADOR_FADE,
  miradorWeight,
  nominalBand,
  slowOutward,
} from './edge';
import { MIRADOR_HALF_WIDTH } from '../story/hiddenLayout';

describe('nominalBand', () => {
  it('is a quarter of the radius, between 4 and 25 m (brief, "Borde")', () => {
    expect(nominalBand(14, false)).toBe(BAND_MIN);
    expect(nominalBand(48, false)).toBe(12);
    expect(nominalBand(90, false)).toBe(22.5);
    expect(nominalBand(150, false)).toBe(BAND_MAX);
  });

  it('is 15 m in the free roam, whatever the radius', () => {
    expect(nominalBand(400, true)).toBe(FREE_ROAM_BAND);
  });
});

describe('bandWidth', () => {
  it('keeps the nominal width when every pending item is well inside', () => {
    expect(bandWidth(46.5, 12, [10, 20])).toBe(12);
    expect(bandWidth(46.5, 12, [])).toBe(12);
  });

  it('shrinks so no pending item is inside the band', () => {
    // Chapter 2: the seeds lie ~44.1 m from the fire, the stop is at 46.5 m.
    const w = bandWidth(46.5, 12, [26.7, 44.14]);
    expect(46.5 - w).toBeCloseTo(44.14 + ITEM_CLEARANCE);
  });

  it('is zero when an item lies past the stop (the radius is still growing)', () => {
    expect(bandWidth(50, 22.5, [83.8])).toBe(0);
  });
});

describe('edgeLevel', () => {
  it('is 0 before the band and 1 at the stop', () => {
    expect(edgeLevel(30, 46.5, 12)).toBe(0);
    expect(edgeLevel(34.5, 46.5, 12)).toBe(0);
    expect(edgeLevel(46.5, 46.5, 12)).toBe(1);
    expect(edgeLevel(50, 46.5, 12)).toBe(1);
  });

  it('grows smoothly and monotonically across the band', () => {
    let prev = 0;
    for (let d = 34.5; d <= 46.5; d += 0.5) {
      const l = edgeLevel(d, 46.5, 12);
      expect(l).toBeGreaterThanOrEqual(prev);
      prev = l;
    }
    expect(edgeLevel(40.5, 46.5, 12)).toBeCloseTo(0.5);
    // Smooth start: barely anything just inside the band.
    expect(edgeLevel(35, 46.5, 12)).toBeLessThan(0.01);
  });

  it('is 0 everywhere with no band', () => {
    expect(edgeLevel(46.5, 46.5, 0)).toBe(0);
  });
});

describe('miradorWeight', () => {
  const mirador = 1.2;
  const at = (a: number) => [Math.cos(a) * 390, Math.sin(a) * 390] as const;

  it('is 1 along the mirador direction, within its half width', () => {
    expect(miradorWeight(...at(mirador), mirador)).toBe(1);
    expect(miradorWeight(...at(mirador - MIRADOR_HALF_WIDTH), mirador)).toBe(1);
  });

  it('fades out just past the sector, and is 0 beyond', () => {
    const mid = miradorWeight(...at(mirador + MIRADOR_HALF_WIDTH + MIRADOR_FADE / 2), mirador);
    expect(mid).toBeCloseTo(0.5);
    expect(miradorWeight(...at(mirador + MIRADOR_HALF_WIDTH + MIRADOR_FADE), mirador)).toBe(0);
    expect(miradorWeight(-390, 0, 0)).toBe(0);
  });

  it('wraps around ±π', () => {
    expect(miradorWeight(...at(-Math.PI + 0.1), Math.PI - 0.1)).toBe(1);
  });
});

describe('slowOutward', () => {
  it('slows only the outward part of the step, down to EDGE_PUSH at the stop', () => {
    const p = slowOutward(40, 0, 41, 0, 1);
    expect(p.x).toBeCloseTo(40 + EDGE_PUSH);
    expect(p.z).toBe(0);
  });

  it('leaves steps back towards the fire alone', () => {
    expect(slowOutward(40, 0, 39, 0, 1)).toEqual({ x: 39, z: 0 });
  });

  it('leaves sideways steps alone', () => {
    const p = slowOutward(40, 0, 40, 1, 1);
    expect(p.x).toBeCloseTo(40);
    expect(p.z).toBeCloseTo(1);
  });

  it('does nothing outside the band', () => {
    expect(slowOutward(10, 0, 11, 0, 0)).toEqual({ x: 11, z: 0 });
  });

  it('scales with the level', () => {
    const half = slowOutward(40, 0, 41, 0, 0.5);
    expect(half.x).toBeCloseTo(40 + 1 - 0.5 * (1 - EDGE_PUSH));
  });
});

describe('EdgeBounce', () => {
  it('does nothing until it hits the edge', () => {
    const b = new EdgeBounce();
    expect(b.step(0.016)).toBe(0);
  });

  it('pushes back gently on a hit, and fades out', () => {
    const b = new EdgeBounce();
    b.hit();
    let total = 0;
    let first = 0;
    let last = Infinity;
    for (let i = 0; i < 120; i++) {
      const d = b.step(1 / 60);
      if (i === 0) first = d;
      expect(d).toBeLessThanOrEqual(last);
      last = d;
      total += d;
    }
    expect(first).toBeGreaterThan(0);
    // A light push, not a throw: under a metre in total, and over after two seconds.
    expect(total).toBeGreaterThan(0.2);
    expect(total).toBeCloseTo(BOUNCE_SPEED / BOUNCE_DECAY, 1);
    expect(total).toBeLessThan(1);
    expect(b.step(1 / 60)).toBe(0);
  });

  it('does not stack hits while it is still pushing', () => {
    const a = new EdgeBounce();
    const b = new EdgeBounce();
    a.hit();
    b.hit();
    a.step(0.05);
    b.step(0.05);
    b.hit(); // still pushing: ignored
    expect(a.step(0.05)).toBeCloseTo(b.step(0.05));
  });

  it('can bounce again once the push has faded', () => {
    const b = new EdgeBounce();
    b.hit();
    for (let i = 0; i < 60; i++) b.step(1 / 60);
    b.hit();
    expect(b.step(1 / 60)).toBeGreaterThan(BOUNCE_SPEED / 2 / 60);
  });

  it('reset stops it at once', () => {
    const b = new EdgeBounce();
    b.hit();
    b.reset();
    expect(b.step(0.016)).toBe(0);
  });
});

describe('bounce and outward steps', () => {
  it('slowOutward with a floor of 0 cancels the outward step entirely', () => {
    const p = slowOutward(40, 0, 41, 0.5, 1, 0);
    expect(p.x).toBeCloseTo(40);
    expect(p.z).toBeCloseTo(0.5);
  });

  it('reports pushing right after a hit, and not once it has faded', () => {
    const b = new EdgeBounce();
    expect(b.pushing).toBe(false);
    b.hit();
    expect(b.pushing).toBe(true);
    for (let i = 0; i < 60; i++) b.step(1 / 60);
    expect(b.pushing).toBe(false);
  });
});
