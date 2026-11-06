import { describe, expect, it } from 'vitest';
import { CLOSING, Closing, PAN_PITCH, panLook } from './closing';

describe('Closing', () => {
  it('runs leadIn → camera → hold → ending with the spec timings', () => {
    const c = new Closing();
    expect(c.stage).toBe('idle');
    c.start();
    expect(CLOSING).toEqual({ leadIn: 0.5, camera: 10, holdBeforeEnding: 0.5 });
    expect(c.update(0.4)).toBeNull();
    expect(c.update(0.2)).toBe('camera');
    expect(c.update(10)).toBe('hold');
    expect(c.update(0.5)).toBe('ending');
    expect(c.update(5)).toBeNull();
    expect(c.stage).toBe('ending');
  });

  it('does not advance unless update is called', () => {
    const c = new Closing();
    c.start();
    c.update(0.3);
    expect(c.stage).toBe('leadIn');
    expect(c.cameraU).toBe(0);
  });

  it('cameraU goes 0 → 1 across the camera stage', () => {
    const c = new Closing();
    c.start();
    c.update(0.5);
    c.update(5);
    expect(c.cameraU).toBeCloseTo(0.5, 1);
    c.update(20);
    expect(c.cameraU).toBe(1);
  });

  it('locksLook only from the camera on', () => {
    const c = new Closing();
    expect(c.locksLook).toBe(false);
    c.start();
    expect(c.locksLook).toBe(false);
    c.update(0.5);
    expect(c.locksLook).toBe(true);
    c.update(40); // one stage per frame, so every transition is reported
    c.update(40);
    expect(c.stage).toBe('ending');
    expect(c.locksLook).toBe(true);
    c.reset();
    expect(c.stage).toBe('idle');
    expect(c.locksLook).toBe(false);
  });
});

describe('panLook', () => {
  const S = { yaw: 0.4, pitch: 0.9 };
  const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

  it('turns one full circle, starting and ending on the star', () => {
    expect(panLook(0, S)).toEqual(S);
    expect(wrap(panLook(1, S).yaw - S.yaw)).toBeCloseTo(0);
    expect(panLook(1, S).pitch).toBeCloseTo(S.pitch);
    expect(wrap(panLook(0.5, S).yaw - (S.yaw + Math.PI))).toBeCloseTo(0);
  });

  it('dips a little toward the horizon mid-turn, never above the star', () => {
    expect(PAN_PITCH).toBeLessThan(S.pitch);
    expect(panLook(0.5, S).pitch).toBeCloseTo(PAN_PITCH);
    expect(panLook(0.25, S).pitch).toBeLessThan(S.pitch);
    expect(panLook(0.25, S).pitch).toBeGreaterThan(PAN_PITCH);
    // a star lower than PAN_PITCH: the turn stays at its height
    const low = { yaw: 0, pitch: 0.1 };
    expect(panLook(0.5, low).pitch).toBeCloseTo(0.1);
  });

  it('eases in and out (no jolt when it starts or stops)', () => {
    const step = (u: number) => panLook(u + 0.01, S).yaw - panLook(u, S).yaw;
    expect(Math.abs(step(0))).toBeLessThan(Math.abs(step(0.5)));
    expect(Math.abs(step(0.99))).toBeLessThan(Math.abs(step(0.5)));
  });
});
