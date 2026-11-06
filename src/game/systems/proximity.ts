/**
 * Proximity cue for the hidden objects of the free roam (pedido del autor, 2026-11-06): a tender,
 * calm arpeggio on a loop. Notes and tempo never change; only the volume grows as you get closer to
 * a hidden object not found yet, panned towards the side it is on. Pure, testable in Node;
 * `audio.ts` plays it.
 */
import { smoothstep } from '../math/util';

/** The arpeggio starts this far (m) from a hidden object, very faint. */
export const PROXIMITY_FAR = 70;
/** At this distance (m) or closer the cue is at its fullest. */
export const PROXIMITY_NEAR = 4;

/** 0 (out of range) .. 1 (right next to it). */
export function proximityLevel(distance: number): number {
  return 1 - smoothstep(PROXIMITY_NEAR, PROXIMITY_FAR, distance);
}

/**
 * The arpeggio (pedido del autor: "tierno" y "calmo"): A major add9 rising and falling, then a
 * rest (`null`), over the pad's A major. Notes and tempo never change; only the volume does.
 */
export const ARP_NOTES: readonly (number | null)[] = [440, 554.37, 659.25, 987.77, 659.25, 554.37, null, null];
/** Seconds between two steps of the arpeggio: slow and even. */
export const ARP_STEP_S = 0.5;
/** Loudest a note gets, right next to the object. */
export const CUE_MAX_GAIN = 0.06;

/** Volume of the arpeggio at a given level: faint at the edge of the range, growing faster up close. */
export function cueGain(level: number): number {
  const l = Math.max(0, Math.min(1, level));
  return CUE_MAX_GAIN * l * l;
}

/**
 * Stereo pan (-1 left .. 1 right) towards a point at (dx, dz) from the player, for a camera with
 * `yaw` (rotation order YXZ, looking down -Z at yaw 0). Straight ahead or behind: centred.
 */
export function panTowards(yaw: number, dx: number, dz: number): number {
  const d = Math.hypot(dx, dz);
  if (d < 1e-6) return 0;
  // Camera right vector on the ground at this yaw.
  return Math.max(-1, Math.min(1, (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / d));
}
