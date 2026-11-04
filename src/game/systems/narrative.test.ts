import { describe, expect, it, vi } from 'vitest';
import { Narrative, type NarrativeView } from './narrative';

const view = (): NarrativeView & { shown: string[] } => {
  const shown: string[] = [];
  return {
    shown,
    showCard: vi.fn(),
    setCardProgress: vi.fn((s: string) => shown.push(s)),
    hideCard: vi.fn(),
    showWhisper: vi.fn(),
    hideWhisper: vi.fn(),
  };
};

describe('Narrative', () => {
  it('types a card out, then auto-advances and runs afterCards', () => {
    const v = view();
    const n = new Narrative(v, false);
    const after = vi.fn();
    n.say('Hello');
    n.afterCards = after;
    n.update(0.05); // ~2 chars
    expect(v.shown.at(-1)).toBe('He');
    for (let i = 0; i < 400; i++) n.update(0.05);
    expect(v.hideCard).toHaveBeenCalled();
    expect(after).toHaveBeenCalledOnce();
    expect(n.card).toBeNull();
  });

  it('advance() completes typing first, then moves on', () => {
    const v = view();
    const n = new Narrative(v, false);
    n.say('First');
    n.say('Second');
    n.advance();
    n.update(0.01);
    expect(v.shown.at(-1)).toBe('First');
    n.advance();
    expect(n.card?.text).toBe('Second');
  });

  it('clear() drops the queue, the pending afterCards and the whisper', () => {
    const v = view();
    const n = new Narrative(v, false);
    const after = vi.fn();
    n.say('One');
    n.say('Two');
    n.afterCards = after;
    n.whisper('psst', 3);
    n.clear();
    expect(n.card).toBeNull();
    expect(n.whisperTime).toBe(0);
    expect(v.hideCard).toHaveBeenCalled();
    expect(v.hideWhisper).toHaveBeenCalled();
    for (let i = 0; i < 400; i++) n.update(0.05);
    expect(after).not.toHaveBeenCalled();
    n.say('Three');
    expect(n.card?.text).toBe('Three');
  });

  it('whispers expire', () => {
    const v = view();
    const n = new Narrative(v, false);
    n.whisper('hi', 1);
    n.tickWhisper(0.6);
    expect(v.hideWhisper).not.toHaveBeenCalled();
    n.tickWhisper(0.6);
    expect(v.hideWhisper).toHaveBeenCalledOnce();
  });
});
