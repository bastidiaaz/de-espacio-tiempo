import { easeInOut, lerp, lerpAngle } from '../math/util';

/** Eye height standing and sitting by the fire (m). */
export const STAND_EYE = 1.6;
export const SEATED_EYE = 0.9;
/** How long sitting down (or getting up) takes. */
export const SIT_SECONDS = 1.5;

export interface Pose {
  x: number;
  z: number;
  eye: number;
}

export type SeatState = 'standing' | 'sitting' | 'seated' | 'rising';

/**
 * Isi sitting down by the fire (DIS-07, ART-09): moves from where she stands to a fixed spot
 * while the eye drops, and back up in place. The fire is at the origin, so the move goes around
 * it (angle and distance to the fire are eased separately) instead of straight through the
 * flames. Pure: the engine applies the returned pose.
 */
export class Seat {
  state: SeatState = 'standing';
  private readonly spot: { x: number; z: number };
  private from: Pose = { x: 0, z: 0, eye: STAND_EYE };
  private t = 0;

  constructor(spot: { x: number; z: number }) {
    this.spot = spot;
  }

  get locksMovement(): boolean {
    return this.state !== 'standing';
  }

  sit(from: Pose): void {
    this.from = { ...from };
    this.t = 0;
    this.state = 'sitting';
  }

  rise(): void {
    if (this.state !== 'seated') return;
    this.t = 0;
    this.state = 'rising';
  }

  snapSeated(): void {
    this.state = 'seated';
  }

  snapStanding(): void {
    this.state = 'standing';
  }

  /** The pose for this frame, or null while standing (the player walks freely). */
  update(dt: number): Pose | null {
    const { spot } = this;
    switch (this.state) {
      case 'standing':
        return null;
      case 'seated':
        return { x: spot.x, z: spot.z, eye: SEATED_EYE };
      case 'sitting': {
        this.t = Math.min(1, this.t + dt / SIT_SECONDS);
        const e = easeInOut(this.t);
        if (this.t >= 1) this.state = 'seated';
        const a = lerpAngle(Math.atan2(this.from.z, this.from.x), Math.atan2(spot.z, spot.x), e);
        const r = lerp(Math.hypot(this.from.x, this.from.z), Math.hypot(spot.x, spot.z), e);
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, eye: lerp(this.from.eye, SEATED_EYE, e) };
      }
      case 'rising': {
        this.t = Math.min(1, this.t + dt / SIT_SECONDS);
        const e = easeInOut(this.t);
        if (this.t >= 1) this.state = 'standing';
        return { x: spot.x, z: spot.z, eye: lerp(SEATED_EYE, STAND_EYE, e) };
      }
    }
  }
}
