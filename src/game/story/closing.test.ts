import { describe, expect, it } from 'vitest';
import { Closing, guidedLook } from './closing';

describe('Closing', () => {
  it('runs leadIn → camera → hold → ending with the spec timings', () => {
    const c = new Closing();
    expect(c.stage).toBe('idle');
    c.start();
    expect(c.update(1.4)).toBeNull();
    expect(c.update(0.2)).toBe('camera');
    expect(c.update(18)).toBe('hold');
    expect(c.update(1)).toBe('ending');
    expect(c.update(5)).toBeNull();
    expect(c.stage).toBe('ending');
  });

  it('does not advance unless update is called', () => {
    const c = new Closing();
    c.start();
    c.update(1);
    expect(c.stage).toBe('leadIn');
    expect(c.cameraU).toBe(0);
  });

  it('cameraU goes 0 → 1 across the camera stage', () => {
    const c = new Closing();
    c.start();
    c.update(1.5);
    c.update(9);
    expect(c.cameraU).toBeCloseTo(0.5, 1);
    c.update(20);
    expect(c.cameraU).toBe(1);
  });

  it('locksLook only from the camera on', () => {
    const c = new Closing();
    expect(c.locksLook).toBe(false);
    c.start();
    expect(c.locksLook).toBe(false);
    c.update(1.5);
    expect(c.locksLook).toBe(true);
    c.update(30); // one stage per frame, so every transition is reported
    c.update(30);
    expect(c.stage).toBe('ending');
    expect(c.locksLook).toBe(true);
    c.reset();
    expect(c.stage).toBe('idle');
    expect(c.locksLook).toBe(false);
  });
});

describe('guidedLook', () => {
  const S = { yaw: 0.4, pitch: 0.9 };
  const F = { yaw: 1.2, pitch: -0.3 };

  it('starts and ends on the star and rests on the fire', () => {
    expect(guidedLook(0, S, F).yaw).toBeCloseTo(S.yaw);
    expect(guidedLook(0, S, F).pitch).toBeCloseTo(S.pitch);
    expect(guidedLook(0.5, S, F).yaw).toBeCloseTo(F.yaw);
    expect(guidedLook(0.5, S, F).pitch).toBeCloseTo(F.pitch);
    expect(guidedLook(1, S, F).yaw).toBeCloseTo(S.yaw);
    expect(guidedLook(1, S, F).pitch).toBeCloseTo(S.pitch);
  });

  it('turns the short way round', () => {
    const y = guidedLook(0.15, { yaw: 3.1, pitch: 0 }, { yaw: -3.1, pitch: 0 }).yaw;
    expect(Math.abs(Math.abs(y) - Math.PI)).toBeLessThan(0.1);
  });
});
