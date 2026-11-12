import { describe, expect, it } from 'vitest';
import { ASTRONAUTA_CHORUS } from '../../content/astronautaCoro';
import { BASS_LOW, arpeggiate, bassOf, type Accompaniment, type WrittenChord } from './arpeggio';
import { melodyLength, midiToFreq, voiceMelody } from './melody';

const chord = (root: number, intervals: number[], beats = 4): WrittenChord => ({ root, intervals, beats });
const acc = (chords: WrittenChord[], over: Partial<Accompaniment> = {}): Accompaniment => ({
  bpm: 60,
  transpose: 0,
  chords,
  ...over,
});
const midi = (freq: number): number => Math.round(69 + 12 * Math.log2(freq / 440));
const EB = chord(3, [0, 4, 7]);
const CM = chord(0, [0, 3, 7]);

describe('bassOf', () => {
  it('puts every root in one octave starting at BASS_LOW', () => {
    for (let pc = 0; pc < 12; pc++) {
      const b = bassOf(pc);
      expect(b % 12).toBe(pc);
      expect(b).toBeGreaterThanOrEqual(BASS_LOW);
      expect(b).toBeLessThan(BASS_LOW + 12);
    }
    expect(bassOf(3)).toBe(51); // Eb3
    expect(bassOf(10)).toBe(46); // Bb2
  });
});

describe('arpeggiate', () => {
  it('plays eighths through the chord: root, fifth, octave, third, fifth and back', () => {
    const v = arpeggiate(acc([EB, EB]));
    const first = v.slice(0, 8);
    expect(first.map((n) => n.start)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
    expect(first.map((n) => midi(n.freq) - 51)).toEqual([0, 7, 12, 16, 19, 16, 12, 7]);
  });

  it('uses the minor third and the seventh when the chord has them', () => {
    const v = arpeggiate(acc([chord(0, [0, 3, 7, 10]), EB]));
    const steps = v.slice(0, 8).map((n) => midi(n.freq) - 48);
    expect(steps).toEqual([0, 7, 12, 15, 19, 15, 10, 7]);
  });

  it('restarts the figure on the root at every chord change, also mid-bar', () => {
    const v = arpeggiate(acc([chord(3, [0, 4, 7], 2), chord(0, [0, 3, 7], 2), EB]));
    expect(v.slice(0, 8).map((n) => midi(n.freq))).toEqual([51, 58, 63, 67, 48, 55, 60, 63]);
    expect(v[4].accent).toBe(1);
  });

  it('holds each note to the end of its chord, like a pedal', () => {
    const v = arpeggiate(acc([EB, CM], { bpm: 120 }));
    for (const n of v.slice(0, 8)) expect(n.start + n.duration).toBeCloseTo(2);
  });

  it('only rises on the last chord and lets it ring', () => {
    const v = arpeggiate(acc([EB, CM]));
    const last = v.slice(8);
    expect(last.map((n) => midi(n.freq) - 48)).toEqual([0, 7, 12, 15]);
    expect(melodyLength(v)).toBe(8);
  });

  it('accents the chord change, then the beats, then the offbeats', () => {
    const [a, b, c] = arpeggiate(acc([EB, EB]));
    expect(a.accent).toBeGreaterThan(c.accent);
    expect(c.accent).toBeGreaterThan(b.accent);
  });

  it('transposes on playback only', () => {
    const [n] = arpeggiate(acc([EB], { transpose: 1 }));
    expect(n.freq).toBeCloseTo(midiToFreq(52));
  });

  it('returns nothing without chords', () => {
    expect(arpeggiate(acc([]))).toEqual([]);
  });
});

describe('the piano under the chorus of "Astronauta"', () => {
  const piano = arpeggiate(ASTRONAUTA_CHORUS.harmony);
  const lead = voiceMelody(ASTRONAUTA_CHORUS);

  it('starts with the chorus and ends with it', () => {
    expect(piano[0].start).toBe(0);
    const bars = ASTRONAUTA_CHORUS.notes.reduce((s, n) => s + n.beats, 0);
    expect(melodyLength(piano)).toBeCloseTo((bars * 60) / ASTRONAUTA_CHORUS.bpm);
    expect(Math.abs(melodyLength(piano) - melodyLength(lead))).toBeLessThan(1);
  });

  it('stays on the melody grid: every note falls on an eighth', () => {
    const eighth = 30 / ASTRONAUTA_CHORUS.bpm;
    for (const n of piano) expect((n.start / eighth) % 1).toBeCloseTo(0);
  });

  it('never goes above the melody note sounding at that moment', () => {
    for (const p of piano) {
      const over = lead.find((m) => m.start <= p.start + 1e-9 && p.start < m.start + m.duration);
      if (over) expect(p.freq).toBeLessThanOrEqual(over.freq + 1e-6);
    }
    expect(Math.max(...piano.map((n) => n.freq))).toBeLessThanOrEqual(Math.min(...lead.map((n) => n.freq)) + 1e-6);
  });

  it('is in the same key as the melody, which alone goes up an octave', () => {
    expect((ASTRONAUTA_CHORUS.transpose - ASTRONAUTA_CHORUS.harmony.transpose) % 12).toBe(0);
    // The melody uses the seven notes of its scale; the proposed chords are all diatonic.
    const scale = new Set(lead.map((n) => midi(n.freq) % 12));
    expect(scale.size).toBe(7);
    for (const p of piano) expect(scale.has(midi(p.freq) % 12)).toBe(true);
  });
});
