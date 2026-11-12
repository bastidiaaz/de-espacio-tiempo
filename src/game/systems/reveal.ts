import { lerp, lerpAngle, smoothstep } from '../math/util';

/**
 * The ship's reveal (DIS-08, ART-05): the fog hides the ship while Isi walks up to it; 30 m away
 * the game takes the camera for ~10 s (it cannot be skipped), the fog opens and the camera sweeps
 * the wreck from the ground up, then hands the view back. Remembering it is still the usual gaze.
 *
 * Pure (no Three.js): the timeline, the fog rule and the camera path. `Game.ts` applies them.
 * Distances in metres from the ship's centre, times in seconds since the game took control.
 */
export const REVEAL = {
  /** Inside this radius the music should already be fading (AUD-03): cue `approach`. */
  approachRadius: 60,
  /** Leaving the approach zone again only counts this much further out (no flicker at the rim). */
  approachHysteresis: 6,
  /** The game takes the camera here. */
  triggerRadius: 30,
  /** Whole take. */
  duration: 10,
  /** The camera is down behind Isi by now; the low chord enters (cue `chord`). */
  chordAt: 1.5,
  /** The fog starts opening towards the ship... */
  fogOpenAt: 1.5,
  /** ...and is back to its normal distance this much later. */
  fogOpenSeconds: 2.5,
  /** Distant metallic creak of the hull (cue `creak`). */
  creakAt: 5,
  /** The camera starts back to Isi's eyes and the chord starts to fade (cue `release`). */
  releaseAt: 8,
  /** While hidden, the fog ends this far short of the ship's centre... */
  fogMargin: 8,
  /** ...but never closer than this. */
  fogMin: 22,
  /** The guided camera never gets closer to the ground than this. */
  groundClearance: 0.4,
} as const;

/**
 * Hook for the reveal's sound (AUD-03 and the chord/creak task): `Game.onRevealCue` receives each
 * cue once, on the frame it happens.
 *  - `approach`: Isi came within `approachRadius` with the ship still hidden: fade the music out in ~3 s, keep the wind.
 *  - `retreat`:  she walked back out before the take: the music may come back.
 *  - `start`:    the game took the camera: the wind drops, as if holding its breath.
 *  - `chord`:    the low, long chord enters and grows slowly.
 *  - `creak`:    distant metallic creak of the hull.
 *  - `release`:  the camera returns to Isi; the chord starts to fade.
 *  - `end`:      control is back; the chord dies out over ~4 s, wind and the odd creak remain.
 */
export type RevealCue = 'approach' | 'retreat' | 'start' | 'chord' | 'creak' | 'release' | 'end';

export type RevealState = 'hidden' | 'playing' | 'done';

/**
 * What the ambience should do, for whoever mixes it (AUD-03 reads this every frame):
 * `idle` far from the ship, `hush` inside the approach radius with the ship still hidden (music
 * out, wind only), `reveal` during the take, `done` once it has been shown.
 */
export type RevealPhase = 'idle' | 'hush' | 'reveal' | 'done';

export interface RevealInput {
  /** Horizontal distance from Isi to the ship's centre. */
  distance: number;
  /** The take may happen now: ship's chapter, ship not remembered yet, Isi on her feet and playing. */
  armed: boolean;
  /** A card or a line is on screen: the take waits for it to close. */
  blocked: boolean;
}

const TIMED: readonly (readonly [number, RevealCue])[] = [
  [REVEAL.chordAt, 'chord'],
  [REVEAL.creakAt, 'creak'],
  [REVEAL.releaseAt, 'release'],
  [REVEAL.duration, 'end'],
];

/** Timeline driven by the game loop's `dt`, so pausing the act pauses the take too. */
export class Reveal {
  state: RevealState;
  /** Seconds into the take (0 before it, `REVEAL.duration` after). */
  t = 0;
  private near = false;
  private readonly cues: RevealCue[] = [];

  /** `done`: the ship was already remembered (a loaded save), so nothing is hidden and nothing plays. */
  constructor(done = false) {
    this.state = done ? 'done' : 'hidden';
    if (done) this.t = REVEAL.duration;
  }

  /** The game has the camera: no walking, no looking, no gaze, no hint. */
  get active(): boolean {
    return this.state === 'playing';
  }

  get phase(): RevealPhase {
    if (this.state === 'playing') return 'reveal';
    if (this.state === 'done') return 'done';
    return this.near ? 'hush' : 'idle';
  }

  /** 0 while the fog hides the ship, 1 once it is back to normal. */
  get fogOpen(): number {
    if (this.state === 'hidden') return 0;
    if (this.state === 'done') return 1;
    return smoothstep(REVEAL.fogOpenAt, REVEAL.fogOpenAt + REVEAL.fogOpenSeconds, this.t);
  }

  /** Debug jumps and loads: back to hidden (the take will play again) or straight to revealed. */
  reset(done: boolean): void {
    this.state = done ? 'done' : 'hidden';
    this.t = done ? REVEAL.duration : 0;
    this.near = false;
  }

  /** Debug: start the take now, wherever Isi stands. The caller handles the `start` cue itself. */
  force(): void {
    this.state = 'playing';
    this.t = 0;
    this.near = true;
  }

  /**
   * Advances one frame. Returns the cues that happened in it, in order (a shared array: read it
   * before the next call).
   */
  step(dt: number, input: RevealInput): readonly RevealCue[] {
    const cues = this.cues;
    cues.length = 0;
    if (this.state === 'hidden') {
      const { distance, armed, blocked } = input;
      const near = armed && distance < REVEAL.approachRadius + (this.near ? REVEAL.approachHysteresis : 0);
      if (near !== this.near) {
        this.near = near;
        cues.push(near ? 'approach' : 'retreat');
      }
      if (armed && !blocked && distance < REVEAL.triggerRadius) {
        this.state = 'playing';
        this.t = 0;
        cues.push('start');
      }
    } else if (this.state === 'playing') {
      const from = this.t;
      this.t = Math.min(REVEAL.duration, this.t + dt);
      for (const [at, cue] of TIMED) if (from < at && this.t >= at) cues.push(cue);
      if (this.t >= REVEAL.duration) this.state = 'done';
    }
    return cues;
  }
}

/**
 * The same `THREE.Fog` as always, closed in on the ship while it is hidden: it ends `fogMargin`
 * short of the ship (never under `fogMin`), so the world closes as Isi walks up. `open` (0..1)
 * eases it back to the atmosphere's own values.
 */
export function revealFog(
  base: { near: number; far: number },
  distance: number,
  open: number,
): { near: number; far: number } {
  if (open >= 1) return base;
  const far = Math.min(base.far, Math.max(REVEAL.fogMin, distance - REVEAL.fogMargin));
  // Keep `near` well under `far`: the atmosphere's own near (up to 28 m) would invert a 22 m fog.
  const near = Math.min(base.near, far * 0.35);
  return { near: lerp(near, base.near, open), far: lerp(far, base.far, open) };
}

// ---------------------------------------------------------------- the camera path

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ShotSetup {
  /** Isi's eye when the game takes the camera, and where she was looking. */
  eye: Vec3;
  yaw: number;
  pitch: number;
  /** The ship's centre on the ground. */
  ship: Vec3;
  /** Unit vector along the hull, towards the nose. */
  axis: { x: number; z: number };
  /** Half the hull's length. */
  halfLength: number;
  /** Height above `ship.y` of the point Isi ends up looking at (the gaze target). */
  lookHeight: number;
  /** Rendered ground height. */
  groundAt(x: number, z: number): number;
  /** The camera stays in Isi's eyes: it only turns to face the ship. */
  reducedMotion: boolean;
}

export interface ShotPose extends Vec3 {
  yaw: number;
  pitch: number;
}

interface Key {
  t: number;
  /** Camera: x, z and height above the ground. */
  x: number;
  z: number;
  h: number;
  /** Look-at point, absolute. */
  lx: number;
  ly: number;
  lz: number;
}

/** Seconds the view takes to turn from wherever Isi was looking to the shot's own framing. */
const TURN_SECONDS = 1.3;

type Channel = 'x' | 'z' | 'h' | 'lx' | 'ly' | 'lz';

/** Cubic Hermite through the keys, with finite-difference tangents in time and rest at both ends. */
function hermite(keys: readonly Key[], c: Channel, t: number): number {
  const n = keys.length;
  if (t <= keys[0].t) return keys[0][c];
  if (t >= keys[n - 1].t) return keys[n - 1][c];
  let i = 0;
  while (keys[i + 1].t < t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const tangent = (k: number): number =>
    k === 0 || k === n - 1 ? 0 : (keys[k + 1][c] - keys[k - 1][c]) / (keys[k + 1].t - keys[k - 1].t);
  const d = b.t - a.t;
  const s = (t - a.t) / d;
  const s2 = s * s;
  const s3 = s2 * s;
  return (
    (2 * s3 - 3 * s2 + 1) * a[c] +
    (s3 - 2 * s2 + s) * d * tangent(i) +
    (-2 * s3 + 3 * s2) * b[c] +
    (s3 - s2) * d * tangent(i + 1)
  );
}

/** The ground averaged over a couple of metres. */
function smoothGround(g: ShotSetup['groundAt'], x: number, z: number): number {
  const r = 1.75;
  return (g(x, z) * 2 + g(x + r, z) + g(x - r, z) + g(x, z + r) + g(x, z - r)) / 6;
}

/**
 * The guided camera of the take, built on the Isi → ship line so it works from any direction:
 * down to the ground behind her looking up, forward to the end of the hull nearest to her, along
 * the ship's side climbing in a diagonal to the other end, and back to her eyes facing the ship.
 */
export class RevealShot {
  private readonly s: ShotSetup;
  private readonly keys: Key[];
  /** Real minus smoothed ground under Isi. */
  private readonly eyeOffset: number;
  /** Where Isi looks when the take ends. */
  readonly endYaw: number;
  readonly endPitch: number;

  constructor(setup: ShotSetup) {
    this.s = setup;
    const { eye, ship, axis, halfLength: L } = setup;
    const dx = ship.x - eye.x;
    const dz = ship.z - eye.z;
    const dist = Math.hypot(dx, dz) || 1;
    const ux = dx / dist;
    const uz = dz / dist;
    // Which end of the hull she is closer to, and which side of it she is on.
    const end = -(ux * axis.x + uz * axis.z) >= 0 ? 1 : -1;
    const sideDot = -(ux * -axis.z + uz * axis.x);
    const side = sideDot >= 0 ? 1 : -1;
    const nx = -axis.z * side;
    const nz = axis.x * side;
    /** A point `a` m along the hull (towards her end) and `l` m out to her side. */
    const at = (a: number, l: number): [number, number] => [
      ship.x + axis.x * end * a + nx * l,
      ship.z + axis.z * end * a + nz * l,
    ];
    const eyeGround = setup.groundAt(eye.x, eye.z);
    const eyeH = eye.y - eyeGround;
    this.eyeOffset = eyeGround - smoothGround(setup.groundAt, eye.x, eye.z);
    const gazeY = ship.y + setup.lookHeight;
    const key = (t: number, p: [number, number], h: number, look: [number, number], ly: number): Key => ({
      t,
      x: p[0],
      z: p[1],
      h,
      lx: look[0],
      ly: ship.y + ly,
      lz: look[1],
    });
    this.keys = [
      key(0, [eye.x, eye.z], eyeH, at(0, 0), setup.lookHeight),
      // Down behind Isi, almost on the ground, looking up at where the ship hides.
      key(REVEAL.chordAt, [eye.x - ux * 2.2, eye.z - uz * 2.2], 0.45, at(0, 0), 6),
      // Forward, still low: the near end towers over the camera as the fog opens.
      key(4, at(L + 5.5, 5.5), 0.6, at(L - 1.5, 0), 3.2),
      // Along the side, climbing.
      key(6, at(1.5, 9.5), 2.4, at(0.5, 0), 2.2),
      // Past the middle and high: the whole wreck from the other end.
      key(REVEAL.releaseAt, at(-L * 0.45, 10.5), 5.2, at(-L * 0.3, 0), 1.8),
      // Back in Isi's eyes, facing the ship.
      key(REVEAL.duration, [eye.x, eye.z], eyeH, at(0, 0), setup.lookHeight),
    ];
    this.endYaw = Math.atan2(-dx, -dz);
    this.endPitch = Math.atan2(gazeY - eye.y, dist);
  }

  /** Camera pose `t` seconds into the take. Writes into `out` and returns it. */
  pose(t: number, out: ShotPose): ShotPose {
    const { s, keys } = this;
    const turn = smoothstep(0, TURN_SECONDS, t);
    if (s.reducedMotion) {
      out.x = s.eye.x;
      out.y = s.eye.y;
      out.z = s.eye.z;
      out.yaw = lerpAngle(s.yaw, this.endYaw, turn);
      out.pitch = lerp(s.pitch, this.endPitch, turn);
      return out;
    }
    const x = hermite(keys, 'x', t);
    const z = hermite(keys, 'z', t);
    const h = hermite(keys, 'h', t);
    // Height rides a slightly smoothed ground (the low-poly facets would kink a ground-level move)...
    const g = s.groundAt;
    const here = g(x, z);
    const smooth = smoothGround(g, x, z);
    // ...corrected at both ends of the take, so it leaves and lands exactly in Isi's eyes...
    const atEye = 1 - smoothstep(0, 1, t) + smoothstep(REVEAL.duration - 1, REVEAL.duration, t);
    // ...and never closer to the real surface than the clearance.
    out.x = x;
    out.z = z;
    out.y = Math.max(smooth + this.eyeOffset * atEye + h, here + REVEAL.groundClearance);
    const lx = hermite(keys, 'lx', t) - x;
    const ly = hermite(keys, 'ly', t) - out.y;
    const lz = hermite(keys, 'lz', t) - z;
    const yaw = Math.atan2(-lx, -lz);
    const pitch = Math.atan2(ly, Math.hypot(lx, lz));
    out.yaw = lerpAngle(s.yaw, yaw, turn);
    out.pitch = lerp(s.pitch, pitch, turn);
    return out;
  }
}
