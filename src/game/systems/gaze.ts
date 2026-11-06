/**
 * Pure gaze logic behind `Attention` (no Three.js, testable in Node): which memory the player is
 * looking at, and how holding the gaze fills — or moving drains — the focus ring.
 */

/** Below this `moveAmount` the player counts as standing still. */
export const STILL_THRESHOLD = 0.15;
/** Focus lost per second while the player moves with a target in sight. */
export const DRAIN_PER_SECOND = 1.5;

export interface GazeTuning {
  /** Max world distance (m) from the camera to the target. */
  range: number;
  /** Max distance from screen center, in aspect-corrected NDC units. */
  cone: number;
}

/** A candidate as seen from the camera this frame. */
export interface Sighting<T> {
  item: T;
  tuning: GazeTuning;
  /** World distance from the camera to the target. */
  distance: number;
  /** Target projected to NDC (`Vector3.project`): z > 1 means behind the camera. */
  ndc: { x: number; y: number; z: number };
}

/** Distance from screen center, correcting x by the aspect ratio so the cone is round. */
export function centerOffset(ndc: { x: number; y: number }, aspect: number): number {
  return Math.hypot(ndc.x * aspect, ndc.y);
}

/** The in-range, in-cone, in-front sighting closest to screen center, or null. */
export function pickFocus<T>(sightings: Iterable<Sighting<T>>, aspect: number): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const s of sightings) {
    if (s.distance > s.tuning.range) continue;
    if (s.ndc.z > 1) continue;
    const d = centerOffset(s.ndc, aspect);
    if (d < s.tuning.cone && d < bestD) {
      best = s.item;
      bestD = d;
    }
  }
  return best;
}

export interface DwellResult<T> {
  /** Ring fill for the reticle, clamped to [0, 1]. */
  progress: number;
  /** A target is in sight but the player is moving (time for the stillness whisper). */
  moving: boolean;
  /** The target whose gaze was just completed this step, or null. */
  completed: T | null;
}

/**
 * Accumulates gaze on a single target. Switching targets (or losing it) resets the fill; holding
 * still fills it over `dwellSeconds`; moving drains it. Completing resets it for the next target.
 */
export class Dwell<T> {
  private target: T | null = null;
  private focus = 0;
  private readonly dwellSeconds: number;

  constructor(dwellSeconds: number) {
    this.dwellSeconds = dwellSeconds;
  }

  step(target: T | null, dt: number, moveAmount: number): DwellResult<T> {
    if (target !== this.target) {
      this.target = target;
      this.focus = 0;
    }
    const moving = !!target && moveAmount >= STILL_THRESHOLD;
    if (target && !moving) this.focus += dt / this.dwellSeconds;
    else if (moving) this.focus = Math.max(0, this.focus - dt * DRAIN_PER_SECOND);
    const progress = Math.min(1, this.focus);
    if (target && this.focus >= 1) {
      this.target = null;
      this.focus = 0;
      return { progress, moving, completed: target };
    }
    return { progress, moving, completed: null };
  }
}
