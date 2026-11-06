import { describe, expect, it } from 'vitest';
import { DWELL_SECONDS } from '../config';
import { centerOffset, DRAIN_PER_SECOND, Dwell, pickFocus, STILL_THRESHOLD, type Sighting } from './gaze';

const TUNING = { range: 6.5, cone: 0.24 };

function seen(
  item: string,
  x: number,
  y = 0,
  opts: { distance?: number; z?: number; cone?: number; range?: number } = {},
): Sighting<string> {
  return {
    item,
    tuning: { range: opts.range ?? TUNING.range, cone: opts.cone ?? TUNING.cone },
    distance: opts.distance ?? 3,
    ndc: { x, y, z: opts.z ?? 0.5 },
  };
}

/** Runs `seconds` of 60 fps steps and returns the last result. */
function hold<T>(d: Dwell<T>, target: T | null, seconds: number, moveAmount = 0) {
  const dt = 1 / 60;
  let r = d.step(target, 0, moveAmount);
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    r = d.step(target, dt, moveAmount);
    if (r.completed) return r;
  }
  return r;
}

describe('pickFocus: cone', () => {
  it('picks a target at screen center', () => {
    expect(pickFocus([seen('a', 0)], 1)).toBe('a');
  });

  it('ignores a target outside its cone', () => {
    expect(pickFocus([seen('a', 0.3)], 1)).toBeNull();
    expect(pickFocus([seen('a', 0, 0.25)], 1)).toBeNull();
  });

  it('treats the cone edge as outside', () => {
    expect(pickFocus([seen('a', 0.24)], 1)).toBeNull();
    expect(pickFocus([seen('a', 0.2399)], 1)).toBe('a');
  });

  it('uses each target its own cone (the ship has a wider one)', () => {
    expect(pickFocus([seen('ship', 0.35, 0, { cone: 0.42 })], 1)).toBe('ship');
  });

  it('corrects x by the aspect ratio so the cone is round on screen', () => {
    // On a 16:9 screen, NDC x = 0.2 is 0.356 units from center: outside a 0.24 cone.
    expect(centerOffset({ x: 0.2, y: 0 }, 16 / 9)).toBeCloseTo(0.3556, 3);
    expect(pickFocus([seen('a', 0.2)], 16 / 9)).toBeNull();
    expect(pickFocus([seen('a', 0, 0.2)], 16 / 9)).toBe('a');
  });

  it('ignores targets behind the camera', () => {
    expect(pickFocus([seen('a', 0, 0, { z: 1.01 })], 1)).toBeNull();
    expect(pickFocus([seen('a', 0, 0, { z: 1 })], 1)).toBe('a');
  });
});

describe('pickFocus: range', () => {
  it('picks a target within range, including exactly at the limit', () => {
    expect(pickFocus([seen('a', 0, 0, { distance: 6.5 })], 1)).toBe('a');
  });

  it('ignores a target beyond its range even when centered', () => {
    expect(pickFocus([seen('a', 0, 0, { distance: 6.51 })], 1)).toBeNull();
  });

  it('uses each target its own range', () => {
    expect(pickFocus([seen('ship', 0, 0, { distance: 20, range: 24 })], 1)).toBe('ship');
  });
});

describe('pickFocus: most central target', () => {
  it('picks the one closest to screen center, whatever the order', () => {
    const list = [seen('edge', 0.2), seen('center', 0.05), seen('mid', 0, -0.1)];
    expect(pickFocus(list, 1)).toBe('center');
    expect(pickFocus([...list].reverse(), 1)).toBe('center');
  });

  it('prefers centrality over world distance', () => {
    const list = [seen('near', 0.15, 0, { distance: 1 }), seen('far', 0.02, 0, { distance: 6 })];
    expect(pickFocus(list, 1)).toBe('far');
  });

  it('skips a more central target that is out of range', () => {
    const list = [seen('out', 0, 0, { distance: 10 }), seen('in', 0.1)];
    expect(pickFocus(list, 1)).toBe('in');
  });

  it('returns null with no candidates', () => {
    expect(pickFocus([], 1)).toBeNull();
  });
});

describe('Dwell', () => {
  it('completes after DWELL_SECONDS of holding still', () => {
    const d = new Dwell<string>(DWELL_SECONDS);
    expect(hold(d, 'a', DWELL_SECONDS * 0.9).completed).toBeNull();
    const r = hold(d, 'a', DWELL_SECONDS * 0.2);
    expect(r.completed).toBe('a');
    expect(r.progress).toBe(1);
  });

  it('fills linearly and reports progress clamped to [0, 1]', () => {
    const d = new Dwell<string>(2);
    expect(d.step('a', 0.5, 0).progress).toBeCloseTo(0.25);
    expect(d.step('a', 0.5, 0).progress).toBeCloseTo(0.5);
    const r = d.step('a', 5, 0);
    expect(r.progress).toBe(1);
    expect(r.completed).toBe('a');
  });

  it('starts over after completing', () => {
    const d = new Dwell<string>(1);
    expect(d.step('a', 1, 0).completed).toBe('a');
    expect(d.step('a', 0.5, 0)).toEqual({ progress: 0.5, moving: false, completed: null });
  });

  it('drains while moving instead of filling, and flags it', () => {
    const d = new Dwell<string>(2);
    d.step('a', 1, 0); // 0.5
    const r = d.step('a', 0.2, STILL_THRESHOLD);
    expect(r.moving).toBe(true);
    expect(r.progress).toBeCloseTo(0.5 - 0.2 * DRAIN_PER_SECOND);
    expect(r.completed).toBeNull();
  });

  it('never drains below zero', () => {
    const d = new Dwell<string>(2);
    d.step('a', 0.2, 0);
    expect(d.step('a', 10, 1).progress).toBe(0);
  });

  it('counts a little movement below the threshold as still', () => {
    const d = new Dwell<string>(2);
    const r = d.step('a', 1, STILL_THRESHOLD - 0.01);
    expect(r.moving).toBe(false);
    expect(r.progress).toBeCloseTo(0.5);
  });

  it('never completes while the player keeps moving', () => {
    const d = new Dwell<string>(DWELL_SECONDS);
    expect(hold(d, 'a', 10, 1).completed).toBeNull();
  });

  it('resets when the gaze moves to another target', () => {
    const d = new Dwell<string>(2);
    d.step('a', 1.5, 0);
    expect(d.step('b', 0, 0).progress).toBe(0);
    expect(d.step('b', 1, 0).progress).toBeCloseTo(0.5);
  });

  it('resets when the target is lost, and is not "moving" without a target', () => {
    const d = new Dwell<string>(2);
    d.step('a', 1.5, 0);
    expect(d.step(null, 0.1, 1)).toEqual({ progress: 0, moving: false, completed: null });
    expect(d.step('a', 0, 0).progress).toBe(0);
  });
});
