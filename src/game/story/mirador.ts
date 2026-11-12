/**
 * The mirador (ART-08, brief del Acto I: "Mirador"): a ridge at the edge of the world, in the
 * letter's direction, with one peak that can be climbed. Pure (no Three.js), testable in Node.
 *
 * Everything is laid out in the mirador's own frame: `u` metres along the direction fire → peak,
 * `v` metres across it; `r`/`a` are the same point in polar form (distance to the fire and angle
 * off the mirador's direction).
 *
 *  - The ridge fills the mirador's sector (MIRADOR_HALF_WIDTH, fading out over MIRADOR_FADE, the
 *    same fade the edge uses) between ~345 and ~420 m from the fire. Nothing changes closer than
 *    MOUNTAIN_START, so the story's world keeps its heights.
 *  - The peak is a plateau that ends in a cliff: on the plateau the player can walk up to
 *    RIM_STOP, right at its lip, past the free-roam stop elsewhere. Below the cliff there is only
 *    sea: in the mirador's sector the terrain sinks under the water and stays there.
 *  - One ramp climbs the flank sideways up to the plateau. Everywhere else the ridge is too steep:
 *    `walkable` is false there and `resolveStep` slides the player along it.
 *  - `reveal` goes from 0 at the foot to 1 at the top: the sky that only exists here follows it.
 *
 * Determinism: the shape depends only on the direction, the base height and a generator of its
 * own derived from the seed. Never the world's `rng()`.
 */
import { FREE_ROAM_RADIUS, WATER } from '../config';
import { mulberry32 } from '../math/random';
import { lerp, smoothstep, TAU } from '../math/util';
import { EDGE_MARGIN, MIRADOR_FADE } from '../systems/edge';
import type { HeightModifier } from '../world/terrain';
import { MIRADOR_HALF_WIDTH } from './hiddenLayout';

/** Closer to the fire than this (m), the terrain is never touched. */
export const MOUNTAIN_START = 344;
/** From here on the mountain's own shape fully replaces the terrain. */
const MOUNTAIN_FULL = 354;
/** The plateau holds up to here; then the cliff, down to its toe in the sea. */
export const CLIFF_TOP = 404;
export const CLIFF_TOE = 410;
/** On the plateau the player can walk this far from the fire: at the lip, to look down. */
export const RIM_STOP = CLIFF_TOP - 1.5;
/** World y of the sea floor below the cliff: deep enough that only water shows. */
export const SEA_FLOOR = WATER - 7;
/** Past the cliff the terrain comes back to its own heights between these distances. */
const OUT_START = 408;
export const MOUNTAIN_END = 420;
/** Height (m) of the peak's rim above the mountain's base. */
export const PEAK_HEIGHT = 44;
/** The plateau rises this much (fraction of PEAK_HEIGHT) from its back to the rim: the last steps open the view. */
const PLATEAU_TILT = 0.12;
/** The peak is flat within this angle (rad) of the mirador's direction, and gone by PEAK_END. */
const PEAK_FLAT = 0.04;
const PEAK_END = 0.085;
/** The massif around the peak: higher, and reaching closer to the fire, within these angles. */
const MASSIF_IN = 0.06;
const MASSIF_OUT = 0.2;
/** Height of the ridge's crest away from the peak, before its jagged profile. */
const RIDGE_HEIGHT = 26;
/** The ramp: flat this far (m) to each side of its line, cut into the slope over PATH_CUT more. */
export const PATH_HALF = 5.5;
const PATH_CUT = 4;
/** Slope (rise over run) of the ramp's sides where it stands above the flank. */
const PATH_SKIRT = 1.8;
/** How far from the ramp's line the player can step. */
const PATH_WALK = PATH_HALF - 1;
/** Ground lifted by the mountain less than this (m) is still plain walking: the foothills. */
const LOW = 2.5;
/** The plateau's walkable part, in the mirador's frame (m). */
const PLATEAU_FROM = 379;
const PLATEAU_HALF = 11;
/** The ramp's line, in the mirador's frame (u, v); `v` is mirrored on half of the seeds. */
const PATH: readonly (readonly [number, number])[] = [
  [345, 88],
  [360, 42],
  [383, -3],
];
/** Mixed into the seed for the mountain's own generator. */
const SALT = 0x3a1ad02;

export interface Spot {
  x: number;
  z: number;
}

interface Leg {
  u0: number;
  v0: number;
  du: number;
  dv: number;
  len2: number;
  /** Height above the base at its start and end. */
  h0: number;
  h1: number;
}

export class Mirador {
  /** Direction fire → peak (rad, `atan2(z, x)`). */
  readonly angle: number;
  /** Height (world y) the mountain stands on. */
  readonly baseY: number;
  /** World y of the peak's rim. */
  readonly topY: number;
  /** Adds the mountain to a `TerrainField`. */
  readonly modifier: HeightModifier;
  private readonly cos: number;
  private readonly sin: number;
  private readonly phases: readonly number[];
  private readonly legs: Leg[];

  /**
   * `baseY`: the ground's height around the foot, on the terrain as it was (see `baseHeight`).
   */
  constructor(angle: number, baseY: number, seed: number) {
    this.angle = angle;
    this.baseY = baseY;
    this.topY = baseY + PEAK_HEIGHT;
    this.cos = Math.cos(angle);
    this.sin = Math.sin(angle);
    const rng = mulberry32((seed ^ SALT) >>> 0);
    this.phases = [rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU];
    const side = rng() < 0.5 ? -1 : 1;

    // The ramp climbs evenly along its length, from the ground up to the plateau where it lands.
    const pts = PATH.map(([u, v]) => [u, v * side] as const);
    const end = pts[pts.length - 1];
    const endHeight = this.plateauHeight(Math.hypot(end[0], end[1]));
    const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    const total = lens.reduce((s, l) => s + l, 0);
    let run = 0;
    this.legs = lens.map((len, i) => {
      const h0 = (run / total) * endHeight;
      run += len;
      const [u0, v0] = pts[i];
      const du = pts[i + 1][0] - u0;
      const dv = pts[i + 1][1] - v0;
      return { u0, v0, du, dv, len2: len * len, h0, h1: (run / total) * endHeight };
    });

    this.modifier = (x, z, h) => {
      const r = Math.hypot(x, z);
      if (r <= MOUNTAIN_START) return h;
      const [u, v] = this.local(x, z);
      const a = Math.atan2(v, u);
      const w = r < MOUNTAIN_END ? this.weight(r, a) : 0;
      const mountain = w > 0 ? lerp(h, this.baseY + this.shape(u, v, r, a), w) : h;
      const s = this.sea(r, a);
      return s > 0 ? lerp(mountain, SEA_FLOOR, s) : mountain;
    };
  }

  /**
   * The height the mountain should stand on: the terrain's mean height along the foot, kept dry
   * and within a few metres of the plains. Call it on the field before adding the modifier.
   */
  static baseHeight(heightAt: (x: number, z: number) => number, angle: number): number {
    let sum = 0;
    const n = 13;
    for (let i = 0; i < n; i++) {
      const a = angle + ((i / (n - 1)) * 2 - 1) * MIRADOR_HALF_WIDTH;
      sum += heightAt(Math.cos(a) * (MOUNTAIN_START + 4), Math.sin(a) * (MOUNTAIN_START + 4));
    }
    return Math.min(9, Math.max(WATER + 1.5, sum / n));
  }

  /** World (x, z) → the mirador's frame (u, v). */
  local(x: number, z: number): [number, number] {
    return [x * this.cos + z * this.sin, -x * this.sin + z * this.cos];
  }

  /** The mirador's frame (u, v) → world (x, z). */
  world(u: number, v: number): Spot {
    return { x: u * this.cos - v * this.sin, z: u * this.sin + v * this.cos };
  }

  /** Points along the ramp's line, from the foot to the plateau, about `step` m apart. */
  pathPoints(step = 1): Spot[] {
    const out: Spot[] = [];
    for (const l of this.legs) {
      const n = Math.max(1, Math.round(Math.sqrt(l.len2) / step));
      for (let i = out.length ? 1 : 0; i <= n; i++) out.push(this.world(l.u0 + (l.du * i) / n, l.v0 + (l.dv * i) / n));
    }
    return out;
  }

  /** Where the ramp starts, on the plain (debug jump). */
  get foot(): Spot {
    const l = this.legs[0];
    const len = Math.sqrt(l.len2);
    return this.world(l.u0 - (l.du / len) * 8, l.v0 - (l.dv / len) * 8);
  }

  /** The first point of the ramp: from `foot`, look this way. */
  get pathStart(): Spot {
    const l = this.legs[0];
    return this.world(l.u0 + l.du * 0.5, l.v0 + l.dv * 0.5);
  }

  /** Standing on the plateau, a few steps from the rim (debug jump). */
  get summit(): Spot {
    return this.world(FREE_ROAM_RADIUS - EDGE_MARGIN - 6, 0);
  }

  /**
   * Circles that cover the mountain, for the chunks to keep free of the planet's common props;
   * over the sea below the cliff, free of floating islets too (`floats`).
   */
  clearings(): { x: number; z: number; r: number; floats?: boolean }[] {
    const out: { x: number; z: number; r: number; floats?: boolean }[] = [];
    const reach = MIRADOR_HALF_WIDTH + MIRADOR_FADE * 0.5;
    for (const r of [370, 398])
      for (let a = -reach; a <= reach + 1e-9; a += reach / 4.5)
        out.push({ ...this.world(Math.cos(a) * r, Math.sin(a) * r), r: 30 });
    for (let r = 420; r <= 600; r += 30) {
      const n = Math.ceil((2 * reach * r) / 30);
      for (let i = 0; i <= n; i++) {
        const a = -reach + (2 * reach * i) / n;
        out.push({ ...this.world(Math.cos(a) * r, Math.sin(a) * r), r: 24, floats: true });
      }
    }
    return out;
  }

  /** Whether (x, z) is on the plateau's walkable part, where the stop is RIM_STOP. */
  onPlateau(x: number, z: number): boolean {
    const [u, v] = this.local(x, z);
    return u >= PLATEAU_FROM && Math.abs(v) <= PLATEAU_HALF;
  }

  /** 0..1: how much of the sea below the cliff replaces the terrain at (r, a). */
  private sea(r: number, a: number): number {
    return (
      smoothstep(CLIFF_TOP + 1, CLIFF_TOE, r) *
      (1 - smoothstep(MIRADOR_HALF_WIDTH, MIRADOR_HALF_WIDTH + MIRADOR_FADE, Math.abs(a)))
    );
  }

  /** 0..1: how much of the mountain's shape replaces the terrain at (r, a). */
  private weight(r: number, a: number): number {
    return (
      smoothstep(MOUNTAIN_START, MOUNTAIN_FULL, r) *
      (1 - smoothstep(OUT_START, MOUNTAIN_END, r)) *
      (1 - smoothstep(MIRADOR_HALF_WIDTH, MIRADOR_HALF_WIDTH + MIRADOR_FADE, Math.abs(a)))
    );
  }

  /** Height of the plateau above the base, `r` m from the fire (before the cliff). */
  private plateauHeight(r: number): number {
    return PEAK_HEIGHT * (1 - PLATEAU_TILT * (1 - smoothstep(376, 397, r)));
  }

  /** The mountain's height above its base: ridge and peak, then the ramp cut into (or built onto) them. */
  private shape(u: number, v: number, r: number, a: number): number {
    const [p1, p2, p3, p4] = this.phases;
    const aa = Math.abs(a);
    const massif = 1 - smoothstep(MASSIF_IN, MASSIF_OUT, aa);
    const peak = 1 - smoothstep(PEAK_FLAT, PEAK_END, aa);
    const jag = 5 * Math.sin(a * 41 + p1) + 3 * Math.sin(a * 97 + p2);
    const crest = Math.min(PEAK_HEIGHT - 5, RIDGE_HEIGHT + jag + 9 * massif);
    // The flank facing the fire: steep, and starting earlier around the peak.
    const rise = smoothstep(lerp(358, 347, massif), lerp(384, 374, massif), r);
    const ridge = crest * rise * (1 - smoothstep(388, 410, r));
    const rough = 1.6 * Math.sin(u * 0.55 + p3) * Math.sin(v * 0.47 + p4) * rise * (1 - peak);
    const top = this.plateauHeight(r) * rise * (1 - smoothstep(CLIFF_TOP, CLIFF_TOE, r));
    let h = lerp(ridge + rough, top, peak);
    // The ramp: built up where it stands above the flank (with steep sides), cut in where the flank is higher.
    const { d, height } = this.nearest(u, v);
    h = Math.max(h, height - Math.max(0, d - PATH_HALF) * PATH_SKIRT);
    return lerp(h, height, 1 - smoothstep(PATH_HALF, PATH_HALF + PATH_CUT, d));
  }

  /** Distance from (u, v) to the ramp's line, and the ramp's height at its closest point. */
  private nearest(u: number, v: number): { d: number; height: number } {
    let d = Infinity;
    let height = 0;
    for (const l of this.legs) {
      const t = Math.min(1, Math.max(0, ((u - l.u0) * l.du + (v - l.v0) * l.dv) / l.len2));
      const dl = Math.hypot(u - l.u0 - l.du * t, v - l.v0 - l.dv * t);
      if (dl < d) {
        d = dl;
        height = lerp(l.h0, l.h1, t);
      }
    }
    return { d, height };
  }

  /**
   * Whether the player can stand at (x, z): anywhere off the mountain, its foothills, the ramp and
   * the plateau. The rest of the ridge is too steep to climb.
   */
  walkable(x: number, z: number): boolean {
    const r = Math.hypot(x, z);
    if (r <= MOUNTAIN_START || r >= MOUNTAIN_END) return true;
    const [u, v] = this.local(x, z);
    const a = Math.atan2(v, u);
    if (this.sea(r, a) > 0.5) return false; // below the cliff, and nobody gets there anyway
    const w = this.weight(r, a);
    if (w <= 0) return true;
    if (u >= PLATEAU_FROM && Math.abs(v) <= PLATEAU_HALF) return true;
    if (this.nearest(u, v).d <= PATH_WALK) return true;
    return this.shape(u, v, r, a) * w < LOW;
  }

  /**
   * A step from (fromX, fromZ) to (x, z), kept off the steep ridge: it slides along it when it
   * can, and stays put otherwise. A player already inside (debug jumps) is never trapped.
   */
  resolveStep(fromX: number, fromZ: number, x: number, z: number): Spot {
    if (this.walkable(x, z) || !this.walkable(fromX, fromZ)) return { x, z };
    if (this.walkable(x, fromZ)) return { x, z: fromZ };
    if (this.walkable(fromX, z)) return { x: fromX, z };
    return { x: fromX, z: fromZ };
  }

  /**
   * 0..1 how much of the mirador's sky shows for a player standing at (x, z) at height `y`:
   * nothing at the foot, everything at the rim. Only on the mountain itself.
   */
  reveal(x: number, z: number, y: number): number {
    const r = Math.hypot(x, z);
    if (r <= MOUNTAIN_START) return 0;
    const [u, v] = this.local(x, z);
    const on =
      smoothstep(MOUNTAIN_START, MOUNTAIN_FULL, r) *
      (1 - smoothstep(MIRADOR_HALF_WIDTH, MIRADOR_HALF_WIDTH + MIRADOR_FADE, Math.abs(Math.atan2(v, u))));
    return on * smoothstep(0.2, 0.97, (y - this.baseY) / PEAK_HEIGHT);
  }
}

/**
 * How far the ground may drop under the player's last step at RIM_STOP: the terrain is a mesh of
 * CHUNK_STEP cells, so right at the lip it starts to lean out.
 */
export const RIM_DIP = 3;
