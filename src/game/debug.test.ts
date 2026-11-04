import { describe, expect, it } from 'vitest';
import { facing, parseHash, standInFront } from './debug';

describe('parseHash', () => {
  it('reads a seed, the debug flag, or both', () => {
    expect(parseHash('')).toEqual({ seed: null, debug: false });
    expect(parseHash('#w123')).toEqual({ seed: 123, debug: false });
    expect(parseHash('#debug')).toEqual({ seed: null, debug: true });
    expect(parseHash('#w42&debug')).toEqual({ seed: 42, debug: true });
    expect(parseHash('#debug&w42')).toEqual({ seed: 42, debug: true });
  });

  it('ignores anything it does not recognise', () => {
    expect(parseHash('#w1234567890')).toEqual({ seed: null, debug: false });
    expect(parseHash('#debugger')).toEqual({ seed: null, debug: false });
    expect(parseHash('#wabc')).toEqual({ seed: null, debug: false });
  });
});

describe('facing', () => {
  // The camera looks down -Z at yaw 0 (rotation order YXZ).
  it('yaw 0 looks down -Z, level', () => {
    const f = facing({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -5 });
    expect(f.yaw).toBeCloseTo(0);
    expect(f.pitch).toBeCloseTo(0);
  });

  it('turns towards +X and pitches up at higher targets', () => {
    const f = facing({ x: 0, y: 0, z: 0 }, { x: 5, y: 5, z: 0 });
    expect(-Math.sin(f.yaw)).toBeCloseTo(1);
    expect(f.pitch).toBeCloseTo(Math.PI / 4);
  });
});

describe('standInFront', () => {
  it('stands between camp and the target, at the given distance', () => {
    const p = standInFront({ x: 10, z: 0 }, 4);
    expect(p.x).toBeCloseTo(6);
    expect(p.z).toBeCloseTo(0);
  });

  it('falls back to a fixed side when the target is at camp', () => {
    const p = standInFront({ x: 0, z: 0 }, 3);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(3);
  });
});
