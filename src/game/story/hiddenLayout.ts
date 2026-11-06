/**
 * Where the five hidden objects of the free roam go (ENG-13, brief del Acto I: "Objetos ocultos").
 * Pure (no Three.js), testable in Node.
 *
 * Each one in its own direction from the fire, away from the ship, the star and each other. The
 * letter goes at the top of the mirador (DIS-05), so its direction is the mirador's: ART-08 builds
 * the ridge around that spot and ENG-14 uses the same sector for the edge exception.
 *
 * Determinism: everything comes from a generator of its own, derived from the seed. Never the
 * `rng()` of `chunks.ts`, `storyWorld.ts` or `sky.ts`.
 */
import { HIDDEN_IDS, type HiddenId } from '../../content/story';
import { mulberry32 } from '../math/random';
import { TAU } from '../math/util';

/** Ring (m from the fire) of the four hidden objects in the open: past the story (150), inside the free roam (400). */
export const HIDDEN_MIN_DIST = 220;
export const HIDDEN_MAX_DIST = 380;
/** The letter, at the mirador's summit: on the cliff edge, just inside the free-roam limit (400). */
export const LETTER_DIST = 390;
export const LETTER_MIN_DIST = 380;
export const LETTER_MAX_DIST = 395;
/** Minimum angle between two directions (hidden objects, ship, star): ~34°, about 130 m apart at 220 m. */
export const MIN_SEPARATION = 0.6;
/** Half the angular width of the mirador sector, for ART-08 (the ridge) and ENG-14 (no dark edge there). */
export const MIRADOR_HALF_WIDTH = 0.3;
/** Mixed into the seed so this generator never shares a sequence with the world's. */
const SALT = 0x41dde2;

export interface Spot {
  x: number;
  z: number;
  /** Direction from the fire (rad, `atan2(z, x)`) before any nudge. */
  angle: number;
}

export interface HiddenLayout {
  spots: Record<HiddenId, Spot>;
  /** Direction of the mirador from the fire (rad, `atan2(z, x)`): the letter's. */
  miradorAngle: number;
}

export interface LayoutInput {
  seed: number;
  /** Direction of the ship from the fire (rad, `atan2(z, x)`). */
  shipAngle: number;
  /** Horizontal direction of the star from the fire (rad, `atan2(z, x)`). */
  starAngle: number;
  /** True where a hidden object (and its hideout) can stand: dry ground. */
  isDry(x: number, z: number): boolean;
}

/** Smallest absolute difference between two angles, in [0, π]. */
export function angleBetween(a: number, b: number): number {
  const d = Math.abs((((a - b) % TAU) + TAU) % TAU);
  return d > Math.PI ? TAU - d : d;
}

export function layoutHidden({ seed, shipAngle, starAngle, isDry }: LayoutInput): HiddenLayout {
  const rng = mulberry32((seed ^ SALT) >>> 0);
  const angles = spreadAngles(rng, [shipAngle, starAngle], HIDDEN_IDS.length);
  // Which object takes which direction: a shuffle with the same generator.
  for (let i = angles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [angles[i], angles[j]] = [angles[j], angles[i]];
  }
  const spots = {} as Record<HiddenId, Spot>;
  HIDDEN_IDS.forEach((id, i) => {
    const angle = angles[i];
    const letter = id === 'letter';
    const dist = letter ? LETTER_DIST : HIDDEN_MIN_DIST + rng() * (HIDDEN_MAX_DIST - HIDDEN_MIN_DIST);
    const [lo, hi] = letter ? [LETTER_MIN_DIST, LETTER_MAX_DIST] : [HIDDEN_MIN_DIST, HIDDEN_MAX_DIST];
    spots[id] = { ...nearestDry(Math.cos(angle) * dist, Math.sin(angle) * dist, lo, hi, isDry), angle };
  });
  return { spots, miradorAngle: spots.letter.angle };
}

/**
 * `count` directions, at least MIN_SEPARATION from the reserved ones and from each other.
 * Takes the free arcs left around the reserved directions, lays the points evenly along them
 * (random offset) and jitters each one within the slack, so the spread differs per seed but the
 * separation always holds.
 */
function spreadAngles(rng: () => number, reserved: readonly number[], count: number): number[] {
  // Free arcs [start, length], walking counter-clockwise from each reserved direction.
  const r = reserved.map((a) => ((a % TAU) + TAU) % TAU).sort((a, b) => a - b);
  const arcs: [number, number][] = [];
  r.forEach((a, i) => {
    const next = i + 1 < r.length ? r[i + 1] : r[0] + TAU;
    const len = next - a - 2 * MIN_SEPARATION;
    if (len > 0) arcs.push([a + MIN_SEPARATION, len]);
  });
  const total = arcs.reduce((s, [, l]) => s + l, 0);
  const step = total / count;
  const slack = Math.max(0, step - MIN_SEPARATION);
  const offset = rng() * step;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    let u = offset + i * step + (rng() - 0.5) * slack;
    u = ((u % total) + total) % total;
    for (const [start, len] of arcs) {
      if (u <= len) {
        out.push((start + u) % TAU);
        break;
      }
      u -= len;
    }
  }
  return out;
}

/**
 * (x, z) itself if dry; otherwise the closest dry point on growing rings around it that stays
 * within [lo, hi] m of the fire. If nothing dry is found within 80 m, (x, z) as is.
 */
function nearestDry(
  x: number,
  z: number,
  lo: number,
  hi: number,
  isDry: (x: number, z: number) => boolean,
): { x: number; z: number } {
  if (isDry(x, z)) return { x, z };
  for (let r = 3; r <= 80; r += 3) {
    const n = Math.max(12, Math.round((TAU * r) / 3));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      const d = Math.hypot(px, pz);
      if (d >= lo && d <= hi && isDry(px, pz)) return { x: px, z: pz };
    }
  }
  return { x, z };
}

/**
 * Whether a viewer at (vx, vz) faces along `lookAngle` when looking at (x, z), within ±`halfAngle`.
 * The campanil photo and the letter only "answer" from the side where, looking at them, you face
 * the star or the view beyond the cliff.
 */
export function facesAlong(
  vx: number,
  vz: number,
  x: number,
  z: number,
  lookAngle: number,
  halfAngle: number,
): boolean {
  const dx = x - vx;
  const dz = z - vz;
  if (Math.hypot(dx, dz) < 0.3) return true; // standing on top of it: any side
  return angleBetween(Math.atan2(dz, dx), lookAngle) <= halfAngle;
}
