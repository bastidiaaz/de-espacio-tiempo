/**
 * Hidden debug mode (ENG-03), turned on with `#debug` in the URL (`#w123&debug` also fixes the seed).
 * Pure helpers only: the engine side lives in Game.ts, the panel in ui/components/DebugPanel.tsx.
 */

export interface HashOptions {
  /** `#w123`: play this world seed. */
  seed: number | null;
  /** `#debug`: show the debug panel and never save progress. */
  debug: boolean;
}

/** Hash tokens are joined with `&`, in any order. Unknown tokens are ignored. */
export function parseHash(hash: string): HashOptions {
  let seed: number | null = null;
  let debug = false;
  for (const token of hash.replace(/^#/, '').split('&')) {
    const w = token.match(/^w(\d{1,9})$/);
    if (w) seed = parseInt(w[1], 10);
    else if (token === 'debug') debug = true;
  }
  return { seed, debug };
}

interface Point3 {
  x: number;
  y: number;
  z: number;
}

/** Yaw/pitch for a camera at `from` (rotation order YXZ, looking down -Z at yaw 0) to look at `to`. */
export function facing(from: Point3, to: Point3): { yaw: number; pitch: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
}

/** A spot `distance` metres from `target`, on the side facing camp (the origin). */
export function standInFront(target: { x: number; z: number }, distance: number): { x: number; z: number } {
  const d = Math.hypot(target.x, target.z);
  const [ux, uz] = d > 1 ? [target.x / d, target.z / d] : [0, -1];
  return { x: target.x - ux * distance, z: target.z - uz * distance };
}
