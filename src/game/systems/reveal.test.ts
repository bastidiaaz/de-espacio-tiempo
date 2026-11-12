import { describe, expect, it } from 'vitest';
import { REVEAL, Reveal, RevealShot, revealFog, type RevealCue, type ShotPose, type ShotSetup } from './reveal';

const far = { distance: 100, armed: true, blocked: false };

/** Runs the take to its end in 50 ms frames and returns every cue with the time it fired at. */
function play(r: Reveal): [RevealCue, number][] {
  const out: [RevealCue, number][] = [];
  for (let i = 0; i < 400 && r.active; i++) {
    for (const c of r.step(0.05, far)) out.push([c, r.t]);
  }
  return out;
}

describe('Reveal: when it fires', () => {
  it('fires at 30 m, once, and only while armed', () => {
    const r = new Reveal();
    expect(r.step(0.016, { distance: 31, armed: true, blocked: false })).not.toContain('start');
    expect(r.step(0.016, { distance: 29, armed: false, blocked: false })).not.toContain('start');
    expect(r.active).toBe(false);
    expect(r.step(0.016, { distance: 29, armed: true, blocked: false })).toContain('start');
    expect(r.active).toBe(true);
  });

  it('waits for a card or a line on screen to close', () => {
    const r = new Reveal();
    r.step(0.016, { distance: 20, armed: true, blocked: true });
    expect(r.active).toBe(false);
    r.step(0.016, { distance: 20, armed: true, blocked: false });
    expect(r.active).toBe(true);
  });

  it('never plays when the ship was already remembered', () => {
    const r = new Reveal(true);
    expect(r.step(0.016, { distance: 5, armed: true, blocked: false })).toEqual([]);
    expect(r.state).toBe('done');
    expect(r.fogOpen).toBe(1);
  });

  it('cues the approach at 60 m and the retreat a little further out', () => {
    const r = new Reveal();
    expect(r.step(0.016, { ...far, distance: 61 })).toEqual([]);
    expect(r.step(0.016, { ...far, distance: 59 })).toEqual(['approach']);
    expect(r.phase).toBe('hush');
    expect(r.step(0.016, { ...far, distance: 58 })).toEqual([]);
    expect(r.step(0.016, { ...far, distance: 62 })).toEqual([]);
    expect(r.step(0.016, { ...far, distance: REVEAL.approachRadius + REVEAL.approachHysteresis + 1 })).toEqual([
      'retreat',
    ]);
  });
});

describe('Reveal: the take', () => {
  it('lasts 10 s and cues chord, creak, release and end in order, each once', () => {
    const r = new Reveal();
    r.step(0.016, { distance: 29, armed: true, blocked: false });
    const cues = play(r);
    expect(cues.map((c) => c[0])).toEqual(['chord', 'creak', 'release', 'end']);
    expect(cues[0][1]).toBeCloseTo(REVEAL.chordAt, 1);
    expect(cues[1][1]).toBeCloseTo(REVEAL.creakAt, 1);
    expect(cues[2][1]).toBeCloseTo(REVEAL.releaseAt, 1);
    expect(cues[3][1]).toBeCloseTo(REVEAL.duration, 5);
    expect(r.state).toBe('done');
    expect(r.phase).toBe('done');
    // After the take: nothing else, ever.
    expect(r.step(0.05, { distance: 10, armed: true, blocked: false })).toEqual([]);
  });

  it('does not advance when no time passes (pause)', () => {
    const r = new Reveal();
    r.force();
    r.step(2, far);
    const t = r.t;
    r.step(0, far);
    expect(r.t).toBe(t);
    expect(r.active).toBe(true);
  });

  it('opens the fog from 1.5 s over 2.5 s and keeps it open', () => {
    const r = new Reveal();
    expect(r.fogOpen).toBe(0);
    r.force();
    r.step(REVEAL.fogOpenAt, far);
    expect(r.fogOpen).toBe(0);
    r.step(REVEAL.fogOpenSeconds / 2, far);
    expect(r.fogOpen).toBeCloseTo(0.5);
    r.step(REVEAL.fogOpenSeconds / 2, far);
    expect(r.fogOpen).toBeCloseTo(1);
    play(r);
    expect(r.fogOpen).toBe(1);
  });

  it('reset() arms it again or marks it revealed (debug jumps)', () => {
    const r = new Reveal(true);
    r.reset(false);
    expect(r.state).toBe('hidden');
    expect(r.step(0.016, { distance: 20, armed: true, blocked: false })).toContain('start');
    r.reset(true);
    expect(r.active).toBe(false);
    expect(r.fogOpen).toBe(1);
  });
});

describe('revealFog', () => {
  const base = { near: 28, far: 162 };

  it('ends 8 m short of the ship while hidden, so the hull never shows', () => {
    for (const d of [110, 80, 60, 40, 31]) {
      const f = revealFog(base, d, 0);
      expect(f.far).toBeCloseTo(Math.max(REVEAL.fogMin, d - REVEAL.fogMargin));
      // Nose at 7 m from the centre: still past the end of the fog.
      expect(f.far).toBeLessThan(d - 7);
      expect(f.near).toBeLessThan(f.far);
    }
  });

  it('never closes under 22 m, and never widens the atmosphere’s own fog', () => {
    expect(revealFog(base, 12, 0).far).toBe(REVEAL.fogMin);
    expect(revealFog({ near: 5, far: 28 }, 110, 0)).toEqual({ near: 5, far: 28 });
  });

  it('eases back to the normal fog as it opens', () => {
    const half = revealFog(base, 30, 0.5);
    expect(half.far).toBeCloseTo((22 + 162) / 2);
    expect(revealFog(base, 30, 1)).toEqual(base);
  });
});

describe('RevealShot', () => {
  const HALF = 7;
  /** Gentle bumps, like the flattened crash site. */
  const groundAt = (x: number, z: number) => 2 + Math.sin(x * 0.4) * 0.4 + Math.cos(z * 0.3) * 0.4;

  /** Isi 29.5 m from the ship, arriving from `angle` (0 = straight at the nose). */
  function setup(angle: number, reducedMotion = false): ShotSetup {
    const ship = { x: 110, y: groundAt(110, 0), z: 0 };
    const ex = ship.x + Math.cos(angle) * 29.5;
    const ez = ship.z + Math.sin(angle) * 29.5;
    return {
      eye: { x: ex, y: groundAt(ex, ez) + 1.6, z: ez },
      yaw: 1.1,
      pitch: -0.2,
      ship,
      axis: { x: 1, z: 0 },
      halfLength: HALF,
      lookHeight: 2.2,
      groundAt,
      reducedMotion,
    };
  }

  /** Distance from (x, z) to the hull's centre line. */
  function hullDistance(s: ShotSetup, x: number, z: number): number {
    const a = Math.min(HALF, Math.max(-HALF, (x - s.ship.x) * s.axis.x + (z - s.ship.z) * s.axis.z));
    return Math.hypot(x - (s.ship.x + s.axis.x * a), z - (s.ship.z + s.axis.z * a));
  }

  const ANGLES = [0, 0.4, 1.2, Math.PI / 2, 2.2, Math.PI, -0.4, -Math.PI / 2, -2.6];
  const pose = (): ShotPose => ({ x: 0, y: 0, z: 0, yaw: 0, pitch: 0 });

  it.each(ANGLES)('from %f rad: starts and ends in Isi’s eyes, facing the ship at the end', (angle) => {
    const s = setup(angle);
    const shot = new RevealShot(s);
    const a = shot.pose(0, pose());
    expect(a.x).toBeCloseTo(s.eye.x);
    expect(a.y).toBeCloseTo(s.eye.y);
    expect(a.z).toBeCloseTo(s.eye.z);
    // No snap when the game takes over: same view as hers.
    expect(a.yaw).toBeCloseTo(s.yaw);
    expect(a.pitch).toBeCloseTo(s.pitch);
    const b = shot.pose(REVEAL.duration, pose());
    expect(b.x).toBeCloseTo(s.eye.x);
    expect(b.y).toBeCloseTo(s.eye.y);
    expect(b.z).toBeCloseTo(s.eye.z);
    expect(Math.cos(b.yaw - shot.endYaw)).toBeCloseTo(1);
    expect(b.pitch).toBeCloseTo(shot.endPitch);
    // Looking down -Z at yaw 0: the end view points at the ship.
    expect(-Math.sin(shot.endYaw)).toBeCloseTo((s.ship.x - s.eye.x) / 29.5);
    expect(-Math.cos(shot.endYaw)).toBeCloseTo((s.ship.z - s.eye.z) / 29.5);
  });

  it.each(ANGLES)('from %f rad: stays above the ground, clear of the hull, and moves smoothly', (angle) => {
    const s = setup(angle);
    const shot = new RevealShot(s);
    let prev = shot.pose(0, pose());
    let lowest = Infinity;
    for (let t = 0.02; t <= REVEAL.duration; t += 0.02) {
      const p = shot.pose(t, pose());
      const clearance = p.y - groundAt(p.x, p.z);
      lowest = Math.min(lowest, clearance);
      expect(clearance).toBeGreaterThanOrEqual(REVEAL.groundClearance - 1e-9);
      expect(hullDistance(s, p.x, p.z)).toBeGreaterThan(4.5);
      // No jumps: under 25 m/s even on the way back.
      expect(Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z)).toBeLessThan(0.5);
      prev = p;
    }
    // It does get down to the ground.
    expect(lowest).toBeLessThan(0.8);
  });

  it('goes low behind Isi first, looking up, then sweeps the hull from her end to the other', () => {
    const s = setup(0);
    const shot = new RevealShot(s);
    const low = shot.pose(REVEAL.chordAt, pose());
    expect(low.x).toBeGreaterThan(s.eye.x); // behind her: further from the ship
    expect(low.y - groundAt(low.x, low.z)).toBeLessThan(0.9);
    expect(low.pitch).toBeGreaterThan(0);
    const along = (t: number) => shot.pose(t, pose()).x - s.ship.x;
    expect(along(4)).toBeGreaterThan(HALF); // off the nose
    expect(along(6)).toBeLessThan(along(4));
    expect(along(REVEAL.releaseAt)).toBeLessThan(0); // past the middle
    const high = shot.pose(REVEAL.releaseAt, pose());
    expect(high.y - groundAt(high.x, high.z)).toBeGreaterThan(4);
  });

  it('reduced motion: the camera stays in her eyes and only turns to the ship', () => {
    const s = setup(0.4, true);
    const shot = new RevealShot(s);
    for (let t = 0; t <= REVEAL.duration; t += 0.5) {
      const p = shot.pose(t, pose());
      expect([p.x, p.y, p.z]).toEqual([s.eye.x, s.eye.y, s.eye.z]);
    }
    const end = shot.pose(REVEAL.duration, pose());
    expect(Math.cos(end.yaw - shot.endYaw)).toBeCloseTo(1);
    expect(end.pitch).toBeCloseTo(shot.endPitch);
  });
});
