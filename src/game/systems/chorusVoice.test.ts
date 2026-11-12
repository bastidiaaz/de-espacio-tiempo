import { describe, expect, it } from 'vitest';
import { ChorusVoice, type Song } from './chorusVoice';
import type { Melody } from './melody';

/** Just enough of Web Audio to schedule against: nodes record what was asked of them. */
function fakeContext() {
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    cancelScheduledValues() {},
  });
  const oscillators: { startAt: number; stopAt: number; onended: (() => void) | null }[] = [];
  const node = () => ({ gain: param(), delayTime: param(), frequency: param(), Q: param(), type: '', connect() {} });
  const ctx = {
    currentTime: 0,
    createGain: node,
    createDelay: node,
    createBiquadFilter: node,
    createPeriodicWave: () => ({}),
    createOscillator() {
      const o = {
        type: 'sine',
        frequency: param(),
        startAt: 0,
        stopAt: 0,
        onended: null as (() => void) | null,
        connect() {},
        setPeriodicWave() {},
        start(t: number) {
          o.startAt = t;
        },
        stop(t: number) {
          o.stopAt = t;
        },
      };
      oscillators.push(o);
      return o;
    },
  };
  /** Moves the clock and fires `ended` on what stopped meanwhile, as the browser would. */
  const advance = (to: number) => {
    const before = ctx.currentTime;
    ctx.currentTime = to;
    for (const o of oscillators) if (o.stopAt > before && o.stopAt <= to) o.onended?.();
  };
  return { ctx: ctx as unknown as AudioContext, oscillators, advance };
}

const MELODY: Melody = {
  bpm: 60,
  beatsPerBar: 4,
  transpose: 0,
  notes: [
    { midi: null, beats: 1, tie: false },
    { midi: 69, beats: 1, tie: true },
    { midi: 69, beats: 1, tie: false },
    { midi: 71, beats: 1, tie: false },
  ],
};

function setup(song: Song = MELODY) {
  const audio = fakeContext();
  const ducks: boolean[] = [];
  const seam = { output: {} as AudioNode, duck: (on: boolean) => ducks.push(on) };
  return { ...audio, ducks, voice: new ChorusVoice(audio.ctx, song, seam) };
}

describe('ChorusVoice', () => {
  it('schedules every sounding note once and ducks the ambience', () => {
    const { voice, oscillators, ducks } = setup();
    voice.play();
    // 2 sounding notes (the tie is one) × 3 partials.
    expect(oscillators).toHaveLength(6);
    expect(oscillators[0].startAt).toBeCloseTo(1.06, 5);
    expect(oscillators[3].startAt).toBeCloseTo(3.06, 5);
    expect(ducks).toEqual([true]);
    expect(voice.playing).toBe(true);
  });

  it('ignores a second play while it sounds', () => {
    const { voice, oscillators, advance, ducks } = setup();
    voice.play();
    advance(2);
    voice.play();
    expect(oscillators).toHaveLength(6);
    expect(ducks).toEqual([true]);
  });

  it('brings the ambience back once, when the last note has rung out', () => {
    const { voice, advance, ducks } = setup();
    voice.play();
    advance(4.5);
    expect(ducks).toEqual([true]);
    advance(30);
    expect(ducks).toEqual([true, false]);
    expect(voice.playing).toBe(false);
  });

  it('can be cut and started over without the old take un-ducking the new one', () => {
    const { voice, oscillators, advance, ducks } = setup();
    voice.play();
    advance(2);
    voice.stop();
    voice.play();
    expect(oscillators).toHaveLength(12);
    expect(ducks).toEqual([true, false, true]);
    advance(2.5); // the cut take's oscillators end here
    expect(ducks).toEqual([true, false, true]);
    advance(40);
    expect(ducks).toEqual([true, false, true, false]);
  });

  it('schedules the piano under the melody, from the same instant, and waits for it to end', () => {
    const harmony = {
      bpm: 60,
      transpose: 0,
      chords: [
        { root: 9, intervals: [0, 4, 7], beats: 4 },
        { root: 4, intervals: [0, 4, 7], beats: 4 },
      ],
    };
    const { voice, oscillators, advance, ducks } = setup({ ...MELODY, harmony });
    voice.play();
    // 6 partials of the melody + 8 eighths of the first chord + 4 of the last one.
    expect(oscillators).toHaveLength(18);
    expect(oscillators[6].startAt).toBeCloseTo(0.06, 5);
    expect(oscillators[14].startAt).toBeCloseTo(4.06, 5);
    advance(8); // the melody is long over, the last chord is still ringing
    expect(ducks).toEqual([true]);
    expect(voice.playing).toBe(true);
    advance(20);
    expect(ducks).toEqual([true, false]);
    voice.play();
    advance(21);
    voice.stop();
    expect(oscillators.slice(18).every((o) => o.stopAt <= 21.2 + 1e-9)).toBe(true);
  });

  it('does nothing when stopped without playing', () => {
    const { voice, ducks } = setup();
    voice.stop();
    expect(ducks).toEqual([]);
  });
});
