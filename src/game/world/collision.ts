export interface Collider {
  x: number;
  z: number;
  r: number;
}

/** Player body radius added to every collider. */
const PLAYER_RADIUS = 0.35;

/** Push a point out of a set of circular colliders on the XZ plane. */
export function pushOut(p: { x: number; z: number }, colliders: readonly Collider[]): void {
  for (const o of colliders) {
    const ex = p.x - o.x;
    const ez = p.z - o.z;
    const d = Math.hypot(ex, ez);
    const m = o.r + PLAYER_RADIUS;
    if (d < m && d > 1e-4) {
      p.x = o.x + (ex / d) * m;
      p.z = o.z + (ez / d) * m;
    }
  }
}
