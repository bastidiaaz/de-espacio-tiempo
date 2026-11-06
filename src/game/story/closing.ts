import { TAU, easeInOut } from '../math/util';

/**
 * Closing sequence of Act I (DIS-07), after the quote card. Seconds. The ending screen follows
 * the guided camera, not the chorus: the chorus (AUD-01) keeps playing behind it.
 */
export const CLOSING = { leadIn: 1.5, camera: 30, holdBeforeEnding: 1 } as const;

export type ClosingStage = 'idle' | 'leadIn' | 'camera' | 'hold' | 'ending';

export interface Look {
  yaw: number;
  pitch: number;
}

const NEXT: Record<ClosingStage, ClosingStage | null> = {
  idle: null,
  leadIn: 'camera',
  camera: 'hold',
  hold: 'ending',
  ending: null,
};
const LENGTH: Partial<Record<ClosingStage, number>> = {
  leadIn: CLOSING.leadIn,
  camera: CLOSING.camera,
  hold: CLOSING.holdBeforeEnding,
};

/** Timeline driven by the game loop's `dt`, so pausing the act pauses it too. Pure. */
export class Closing {
  stage: ClosingStage = 'idle';
  private t = 0;
  private camT = 0;

  start(): void {
    this.stage = 'leadIn';
    this.t = 0;
    this.camT = 0;
  }

  reset(): void {
    this.stage = 'idle';
    this.t = 0;
    this.camT = 0;
  }

  /** 0..1 along the guided camera (0 before it starts, 1 once it is done). */
  get cameraU(): number {
    return Math.min(1, this.camT / CLOSING.camera);
  }

  get locksLook(): boolean {
    return this.stage === 'camera' || this.stage === 'hold' || this.stage === 'ending';
  }

  /** Advances the clock; returns the new stage on the frame it changes, otherwise null. */
  update(dt: number): ClosingStage | null {
    if (this.stage === 'idle' || this.stage === 'ending') return null;
    if (this.stage === 'camera') this.camT += dt;
    this.t += dt;
    const len = LENGTH[this.stage]!;
    if (this.t < len - 1e-9) return null;
    const leftover = this.t - len;
    this.stage = NEXT[this.stage]!;
    this.t = 0;
    if (this.stage === 'hold') this.camT = CLOSING.camera;
    // Carry the overshoot so a long frame does not stretch the sequence (one stage per frame).
    if (this.stage === 'camera') this.camT = leftover;
    if (this.stage !== 'ending') this.t = leftover;
    return this.stage;
  }
}

/**
 * Where the guided camera looks at `u` (0..1): one slow full turn at the star's height, eased in
 * and out, starting and ending on the star. She is already looking at it after the quote.
 */
export function panLook(u: number, star: Look): Look {
  return { yaw: star.yaw + TAU * easeInOut(Math.min(1, Math.max(0, u))), pitch: star.pitch };
}
