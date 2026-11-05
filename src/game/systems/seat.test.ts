import { describe, expect, it } from 'vitest';
import { SEATED_EYE, SIT_SECONDS, STAND_EYE, Seat } from './seat';

const spot = { x: 0, z: 2 };

describe('Seat', () => {
  it('sits from where the player stands to the spot in SIT_SECONDS', () => {
    const s = new Seat(spot);
    s.sit({ x: 5, z: 0, eye: STAND_EYE });
    const mid = s.update(SIT_SECONDS / 2)!;
    expect(mid.eye).toBeGreaterThan(SEATED_EYE);
    expect(mid.eye).toBeLessThan(STAND_EYE);
    const end = s.update(SIT_SECONDS / 2)!;
    expect(end.x).toBeCloseTo(0);
    expect(end.z).toBeCloseTo(2);
    expect(end.eye).toBeCloseTo(SEATED_EYE);
    expect(s.state).toBe('seated');
  });

  it('locks movement from sit() until it has fully risen', () => {
    const s = new Seat(spot);
    expect(s.locksMovement).toBe(false);
    expect(s.update(0.1)).toBeNull();
    s.sit({ x: 5, z: 0, eye: STAND_EYE });
    expect(s.locksMovement).toBe(true);
    s.update(SIT_SECONDS);
    expect(s.locksMovement).toBe(true);
    s.rise();
    expect(s.state).toBe('rising');
    expect(s.locksMovement).toBe(true);
    const end = s.update(SIT_SECONDS)!;
    expect(s.state).toBe('standing');
    expect(s.locksMovement).toBe(false);
    expect(end.eye).toBeCloseTo(STAND_EYE);
    expect(end.x).toBeCloseTo(spot.x);
    expect(end.z).toBeCloseTo(spot.z);
  });

  it('walks around the fire (at the origin), never through it, when sitting from the far side', () => {
    const s = new Seat({ x: -2.8, z: 0 });
    s.sit({ x: 6, z: 0.2, eye: STAND_EYE });
    let closest = Infinity;
    for (let i = 0; i < 60; i++) {
      const p = s.update(SIT_SECONDS / 60)!;
      closest = Math.min(closest, Math.hypot(p.x, p.z));
    }
    expect(closest).toBeGreaterThanOrEqual(2.8 - 1e-6);
    expect(s.state).toBe('seated');
  });

  it('snapSeated jumps straight to the seated pose', () => {
    const s = new Seat(spot);
    s.snapSeated();
    expect(s.update(0)).toEqual({ x: spot.x, z: spot.z, eye: SEATED_EYE });
    s.snapStanding();
    expect(s.state).toBe('standing');
  });
});
