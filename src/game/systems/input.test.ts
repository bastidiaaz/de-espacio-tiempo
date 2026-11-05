import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input } from './input';

type Handler = (e: Partial<PointerEvent>) => void;

function fakeCanvas() {
  const handlers: Record<string, Handler> = {};
  return {
    handlers,
    addEventListener: (type: string, h: Handler) => void (handlers[type] = h),
    removeEventListener: () => {},
    setPointerCapture: () => {},
  };
}

describe('Input', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('does not look around while disabled, even mid-drag, and does not jump on re-enable', () => {
    vi.stubGlobal('addEventListener', () => {});
    vi.stubGlobal('removeEventListener', () => {});
    vi.stubGlobal('innerWidth', 1000);
    const canvas = fakeCanvas();
    let enabled = true;
    const looks: number[][] = [];
    new Input(canvas as unknown as HTMLCanvasElement, {
      enabled: () => enabled,
      onLook: (dx, dy) => looks.push([dx, dy]),
      onKey: () => {},
      onStick: () => {},
    });
    const ev = (clientX: number) => ({ pointerId: 1, pointerType: 'mouse', clientX, clientY: 0 });

    canvas.handlers.pointerdown(ev(100));
    canvas.handlers.pointermove(ev(110));
    expect(looks).toEqual([[10, 0]]);

    enabled = false; // e.g. the options panel opened while dragging
    canvas.handlers.pointermove(ev(300));
    expect(looks).toEqual([[10, 0]]);

    enabled = true;
    canvas.handlers.pointermove(ev(305));
    expect(looks).toEqual([[10, 0], [5, 0]]);
  });
  it('with canMove false, a left-half touch looks instead of spawning the stick', () => {
    vi.stubGlobal('addEventListener', () => {});
    vi.stubGlobal('removeEventListener', () => {});
    vi.stubGlobal('innerWidth', 1000);
    const canvas = fakeCanvas();
    const looks: number[][] = [];
    const sticks: boolean[] = [];
    new Input(canvas as unknown as HTMLCanvasElement, {
      enabled: () => true,
      canMove: () => false,
      onLook: (dx, dy) => looks.push([dx, dy]),
      onKey: () => {},
      onStick: (s) => sticks.push(s.active),
    });
    const ev = (clientX: number) => ({ pointerId: 1, pointerType: 'touch', clientX, clientY: 0 });
    canvas.handlers.pointerdown(ev(100));
    canvas.handlers.pointermove(ev(110));
    expect(looks).toEqual([[10, 0]]);
    expect(sticks).not.toContain(true);
  });
});
