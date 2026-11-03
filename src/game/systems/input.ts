export interface StickState {
  active: boolean;
  /** Screen position where the thumb landed. */
  x: number;
  y: number;
  /** Knob offset in px (max 50). */
  dx: number;
  dy: number;
}

export interface InputOptions {
  /** Pointer input only drives the game while this returns true. */
  enabled: () => boolean;
  onLook: (dx: number, dy: number, sensitivity: number) => void;
  onKey: (code: string) => void;
  onStick: (s: StickState) => void;
}

const STICK_RADIUS = 50;

/**
 * Keyboard + pointer. Touch: left half spawns a floating joystick, right half looks.
 * Mouse: drag anywhere to look.
 */
export class Input {
  readonly keys: Record<string, boolean> = {};
  /** Normalized joystick vector, -1..1. */
  readonly stick = { x: 0, y: 0 };
  private stickId: number | null = null;
  private ox = 0;
  private oy = 0;
  private readonly looks = new Map<number, { x: number; y: number }>();
  private readonly canvas: HTMLCanvasElement;
  private readonly o: InputOptions;

  constructor(canvas: HTMLCanvasElement, options: InputOptions) {
    this.canvas = canvas;
    this.o = options;
    addEventListener('keydown', this.onKeyDown);
    addEventListener('keyup', this.onKeyUp);
    addEventListener('blur', this.onBlur);
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onEnd);
    canvas.addEventListener('pointercancel', this.onEnd);
  }

  isDown(...codes: string[]): boolean {
    return codes.some((c) => this.keys[c]);
  }

  dispose(): void {
    removeEventListener('keydown', this.onKeyDown);
    removeEventListener('keyup', this.onKeyUp);
    removeEventListener('blur', this.onBlur);
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerup', this.onEnd);
    this.canvas.removeEventListener('pointercancel', this.onEnd);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    this.o.onKey(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onBlur = () => {
    for (const k in this.keys) this.keys[k] = false;
  };

  private onDown = (e: PointerEvent) => {
    if (!this.o.enabled()) return;
    this.canvas.setPointerCapture(e.pointerId);
    if (e.pointerType !== 'mouse' && e.clientX < innerWidth * 0.5 && this.stickId === null) {
      this.stickId = e.pointerId;
      this.ox = e.clientX;
      this.oy = e.clientY;
      this.o.onStick({ active: true, x: e.clientX, y: e.clientY, dx: 0, dy: 0 });
    } else this.looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  private onMove = (e: PointerEvent) => {
    if (e.pointerId === this.stickId) {
      let dx = e.clientX - this.ox;
      let dy = e.clientY - this.oy;
      const d = Math.hypot(dx, dy);
      if (d > STICK_RADIUS) {
        dx *= STICK_RADIUS / d;
        dy *= STICK_RADIUS / d;
      }
      this.stick.x = dx / STICK_RADIUS;
      this.stick.y = dy / STICK_RADIUS;
      this.o.onStick({ active: true, x: this.ox, y: this.oy, dx, dy });
    } else {
      const l = this.looks.get(e.pointerId);
      if (!l) return;
      const k = e.pointerType === 'mouse' ? 0.004 : 0.006;
      this.o.onLook(e.clientX - l.x, e.clientY - l.y, k);
      l.x = e.clientX;
      l.y = e.clientY;
    }
  };

  private onEnd = (e: PointerEvent) => {
    if (e.pointerId === this.stickId) {
      this.stickId = null;
      this.stick.x = this.stick.y = 0;
      this.o.onStick({ active: false, x: this.ox, y: this.oy, dx: 0, dy: 0 });
    }
    this.looks.delete(e.pointerId);
  };
}
