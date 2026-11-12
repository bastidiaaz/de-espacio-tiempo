import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../math/random';
import { REVEAL } from './reveal';
import { CHORD, CHORD_ROOT_HZ, CHORD_TIMES, creakPlan } from './revealSound';

describe('the reveal chord', () => {
  it('sits on the tonic of "Astronauta" (E flat), low', () => {
    // E♭1 = A4 (440 Hz) down 42 semitones.
    expect(CHORD_ROOT_HZ).toBeCloseTo(440 * Math.pow(2, -42 / 12), 1);
    expect(CHORD[0].freq).toBe(CHORD_ROOT_HZ);
  });

  it('is only roots and fifths: size, not a melody or a mood', () => {
    for (const v of CHORD) {
      const semitones = (12 * Math.log2(v.freq / CHORD_ROOT_HZ)) % 12;
      const pitchClass = Math.round(semitones);
      expect(Math.abs(semitones - pitchClass)).toBeLessThan(0.03);
      expect([0, 7]).toContain(pitchClass);
    }
  });

  it('opens upwards while it grows, and never clips', () => {
    for (let i = 1; i < CHORD.length; i++) {
      expect(CHORD[i].freq).toBeGreaterThanOrEqual(CHORD[i - 1].freq);
      expect(CHORD[i].enter).toBeGreaterThanOrEqual(CHORD[i - 1].enter);
    }
    const sum = CHORD.reduce((a, v) => a + v.gain, 0);
    expect(sum * CHORD_TIMES.peak).toBeLessThan(1);
  });

  it('grows from its cue to the release, then fades in about 4 s', () => {
    expect(CHORD_TIMES.swell).toBe(REVEAL.releaseAt - REVEAL.chordAt);
    // Every voice is in before the creak.
    for (const v of CHORD) expect(REVEAL.chordAt + v.enter).toBeLessThan(REVEAL.releaseAt);
    expect(CHORD_TIMES.fade).toBe(4);
  });
});

describe('creakPlan', () => {
  it('is a handful of uneven slips, in order, low and inside its length', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const slips = creakPlan(mulberry32(seed));
      expect(slips.length).toBeGreaterThanOrEqual(4);
      expect(slips.length).toBeLessThanOrEqual(6);
      let prevEnd = 0;
      for (const s of slips) {
        expect(s.at).toBeGreaterThanOrEqual(prevEnd - 1e-9);
        expect(s.dur).toBeGreaterThan(0.1);
        expect(s.level).toBeGreaterThan(0);
        expect(s.level).toBeLessThanOrEqual(1);
        for (const f of [s.from, s.to]) {
          expect(f).toBeGreaterThan(40);
          expect(f).toBeLessThan(230);
        }
        prevEnd = s.at + s.dur;
      }
      expect(prevEnd).toBeLessThan(3.2);
    }
  });

  it('is the same for the same generator, and different for another', () => {
    expect(creakPlan(mulberry32(7))).toEqual(creakPlan(mulberry32(7)));
    expect(creakPlan(mulberry32(7))).not.toEqual(creakPlan(mulberry32(8)));
  });
});
