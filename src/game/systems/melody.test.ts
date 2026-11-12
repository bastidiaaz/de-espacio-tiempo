import { describe, expect, it } from 'vitest';
import { ASTRONAUTA_CHORUS } from '../../content/astronautaCoro';
import { melodyLength, midiToFreq, voiceMelody, type Melody } from './melody';

const note = (midi: number | null, beats: number, tie = false) => ({ midi, beats, tie });
const melody = (notes: Melody['notes'], over: Partial<Melody> = {}): Melody => ({
  bpm: 60,
  beatsPerBar: 4,
  transpose: 0,
  notes,
  ...over,
});

describe('voiceMelody', () => {
  it('tunes to A4 = 440 Hz', () => {
    expect(midiToFreq(69)).toBe(440);
    expect(midiToFreq(81)).toBeCloseTo(880);
  });

  it('places notes in seconds and skips rests', () => {
    const v = voiceMelody(melody([note(null, 2), note(69, 1), note(71, 0.5)], { bpm: 120 }));
    expect(v.map((n) => [n.start, n.duration])).toEqual([
      [1, 0.5],
      [1.5, 0.25],
    ]);
  });

  it('merges tied notes into one, also across a bar line', () => {
    const v = voiceMelody(melody([note(null, 3.5), note(65, 0.5, true), note(65, 0.5), note(67, 1)]));
    expect(v).toHaveLength(2);
    expect(v[0]).toMatchObject({ start: 3.5, duration: 1 });
    expect(v[1].start).toBe(4.5);
  });

  it('transposes on playback only', () => {
    const [n] = voiceMelody(melody([note(63, 1)], { transpose: 13 }));
    expect(n.freq).toBeCloseTo(midiToFreq(76));
  });

  it('accents the downbeat, then the beats, then what falls between them', () => {
    const v = voiceMelody(melody([note(60, 1), note(60, 0.5), note(60, 0.5)]));
    expect(v[0].accent).toBeGreaterThan(v[1].accent);
    expect(v[1].accent).toBeGreaterThan(v[2].accent);
  });

  it('measures up to the end of the last note, not the trailing rest', () => {
    expect(melodyLength(voiceMelody(melody([note(60, 2), note(null, 2)])))).toBe(2);
    expect(melodyLength([])).toBe(0);
  });
});

describe('the chorus of "Astronauta" as played', () => {
  const voiced = voiceMelody(ASTRONAUTA_CHORUS);

  it('never overlaps itself and stays in a music-box range', () => {
    voiced.forEach((n, i) => {
      if (i) expect(n.start).toBeGreaterThanOrEqual(voiced[i - 1].start + voiced[i - 1].duration - 1e-9);
      expect(n.freq).toBeGreaterThan(400);
      expect(n.freq).toBeLessThan(1100);
    });
  });

  it('lasts between 30 s and a minute', () => {
    const s = melodyLength(voiced);
    expect(s).toBeGreaterThan(30);
    expect(s).toBeLessThan(60);
  });
});
