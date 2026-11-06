/**
 * The edge goes dark (ENG-14, brief del Acto I: "Borde"). Pure (no Three.js), testable in Node.
 *
 * Before the hard stop there is a band where the world fades out and Isi walks outwards more and
 * more slowly. Everything here depends only on the distance to the fire, so turning back undoes it
 * along the same curve.
 */
import { smoothstep } from '../math/util';
import { MIRADOR_HALF_WIDTH, angleBetween } from '../story/hiddenLayout';

/** The player stops this far (m) inside the remembered radius. */
export const EDGE_MARGIN = 1.5;
/** Band width as a fraction of the radius, clamped to [BAND_MIN, BAND_MAX] m. */
export const BAND_FRACTION = 0.25;
export const BAND_MIN = 4;
export const BAND_MAX = 25;
/** Free roam: a fixed band, so it starts past the hidden objects (≤ 380 m). */
export const FREE_ROAM_BAND = 15;
/** A pending item stays at least this far (m) inside the band's start. */
export const ITEM_CLEARANCE = 1;
/** Angular fade (rad) past the mirador's sector: ~23 m at the free-roam edge. */
export const MIRADOR_FADE = 0.06;
/** Light left at the stop (fraction of normal). */
export const EDGE_LIGHT = 0.35;
/** Outward speed left at the stop (fraction of normal). */
export const EDGE_PUSH = 0.3;

/** The band's width before any item shrinks it. */
export function nominalBand(radius: number, freeRoam: boolean): number {
  if (freeRoam) return FREE_ROAM_BAND;
  return Math.min(BAND_MAX, Math.max(BAND_MIN, radius * BAND_FRACTION));
}

/**
 * The nominal width, shrunk so no pending item of the chapter is inside the band (the brief moves
 * the band, never the item). `limit` is the hard stop; `itemDists`, each pending item's distance
 * to the fire.
 */
export function bandWidth(limit: number, nominal: number, itemDists: Iterable<number>): number {
  let w = nominal;
  for (const d of itemDists) w = Math.min(w, limit - d - ITEM_CLEARANCE);
  return Math.max(0, w);
}

/** 0 before the band, 1 at the stop, smooth in between. */
export function edgeLevel(dist: number, limit: number, width: number): number {
  if (width <= 0) return 0;
  return smoothstep(limit - width, limit, dist);
}

/**
 * 1 inside the mirador's sector (no dark edge there: the cliff is the limit), 0 outside, with a
 * short fade past its border so walking along the edge never flips from dark to lit in one step.
 */
export function miradorWeight(x: number, z: number, miradorAngle: number): number {
  const off = angleBetween(Math.atan2(z, x), miradorAngle);
  return 1 - smoothstep(MIRADOR_HALF_WIDTH, MIRADOR_HALF_WIDTH + MIRADOR_FADE, off);
}

/**
 * A step from (fromX, fromZ) to (x, z), with its outward (radial) part slowed down to `floor` (by
 * default EDGE_PUSH) at level 1. Walking sideways or back towards the fire is untouched.
 */
export function slowOutward(
  fromX: number,
  fromZ: number,
  x: number,
  z: number,
  level: number,
  floor = EDGE_PUSH,
): { x: number; z: number } {
  const r = Math.hypot(fromX, fromZ);
  if (level <= 0 || r < 1e-6) return { x, z };
  const nx = fromX / r;
  const nz = fromZ / r;
  const out = (x - fromX) * nx + (z - fromZ) * nz;
  if (out <= 0) return { x, z };
  const cut = out * level * (1 - floor);
  return { x: x - nx * cut, z: z - nz * cut };
}

/** Inward speed (m/s) of the bounce off the edge, and how fast it fades (1/s): ~0.4 m in all, over in ~0.4 s. */
export const BOUNCE_SPEED = 3;
export const BOUNCE_DECAY = 8;
/** Below this speed the push is over, and below REARM a new hit can start another one. */
const BOUNCE_STOP = 0.05;
const BOUNCE_REARM = 0.6;

/**
 * The edge is not a wall (pedido del autor, 2026-11-06): touching it, something pushes Isi gently
 * back towards the fire. `hit()` on contact; `step(dt)` gives how far (m) to move her inwards this
 * frame. While it pushes, the game cancels any step outwards, so the push wins even with the stick
 * held; once it has nearly faded, she can walk out and bounce again.
 */
export class EdgeBounce {
  private v = 0;

  /** Still pushing hard enough that walking outwards should not fight it. */
  get pushing(): boolean {
    return this.v >= BOUNCE_REARM;
  }

  hit(): void {
    if (this.v < BOUNCE_REARM) this.v = BOUNCE_SPEED;
  }

  step(dt: number): number {
    if (this.v <= 0) return 0;
    const d = this.v * dt;
    this.v *= Math.exp(-BOUNCE_DECAY * dt);
    if (this.v < BOUNCE_STOP) this.v = 0;
    return d;
  }

  reset(): void {
    this.v = 0;
  }
}
