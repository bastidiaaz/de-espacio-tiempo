import { describe, expect, it } from 'vitest';
import { ASTRONAUTA_CHORUS } from '../../content/astronautaCoro';
import type { WrittenChord } from './arpeggio';
import { ROAM_BASS_LOW, ROAM_BEAT_S, ROAM_UPPER_LOW, chordNotesIn, padVoicing, roamSeconds } from './roamHarmony';

const chord = (root: number, intervals: number[], beats = 4): WrittenChord => ({ root, intervals, beats });
const pc = (m: number) => ((m % 12) + 12) % 12;

describe('padVoicing', () => {
  it('puts the root in the bass and the rest of a seventh chord above it', () => {
    // Ebmaj7 written, up a semitone: Emaj7 = E G# B D#.
    const v = padVoicing(chord(3, [0, 4, 7, 11]), 1);
    expect(v).toHaveLength(4);
    expect(pc(v[0])).toBe(4);
    expect(v.slice(1).map(pc).sort((a, b) => a - b)).toEqual([3, 8, 11]);
  });

  it('keeps the root up top for a triad, and every voice in its octave', () => {
    for (let root = 0; root < 12; root++) {
      const v = padVoicing(chord(root, [0, 3, 7]), 1);
      expect(v[0]).toBeGreaterThanOrEqual(ROAM_BASS_LOW + 1);
      expect(v[0]).toBeLessThan(ROAM_BASS_LOW + 13);
      for (const m of v.slice(1)) {
        expect(m).toBeGreaterThanOrEqual(ROAM_UPPER_LOW + 1);
        expect(m).toBeLessThan(ROAM_UPPER_LOW + 13);
      }
      expect(new Set(v.slice(1).map(pc))).toEqual(new Set([0, 3, 7].map((i) => pc(root + i + 1))));
    }
  });
});

describe('chordNotesIn', () => {
  it('lists every note of the chord in a range, ascending', () => {
    // Cm written, up a semitone: C#m = C# E G#.
    expect(chordNotesIn(chord(0, [0, 3, 7]), 1, 60, 72)).toEqual([61, 64, 68]);
  });
});

describe('the free roam on the chords of "Astronauta"', () => {
  const { chords, transpose } = ASTRONAUTA_CHORUS.harmony;

  it('sounds in the key of the song: the chorus melody and the roam share their notes', () => {
    const melody = new Set(ASTRONAUTA_CHORUS.notes.flatMap((n) => (n.midi === null ? [] : [pc(n.midi + ASTRONAUTA_CHORUS.transpose)])));
    // Borrowed chords may bring a note or two the melody never sings; the bass, the root, always is in key.
    for (const c of chords) expect(melody, c.name).toContain(pc(padVoicing(c, transpose)[0]));
    // The roam follows the arrangement's key, not the melody's octave.
    expect((ASTRONAUTA_CHORUS.transpose - transpose) % 12).toBe(0);
  });

  it('goes through the whole chorus slowly, far slower than the song', () => {
    const loop = chords.reduce((s, c) => s + roamSeconds(c), 0);
    expect(loop).toBeCloseTo(18 * ASTRONAUTA_CHORUS.beatsPerBar * ROAM_BEAT_S);
    expect(ROAM_BEAT_S).toBeGreaterThan(60 / ASTRONAUTA_CHORUS.bpm);
  });

  it('gives every note layer something to play in every chord', () => {
    for (const c of chords) {
      expect(chordNotesIn(c, transpose, 69, 81).length, c.name).toBeGreaterThanOrEqual(3);
      expect(chordNotesIn(c, transpose, 57, 76).length, c.name).toBeGreaterThanOrEqual(4);
      expect(chordNotesIn(c, transpose, 69, 88).length, c.name).toBeGreaterThanOrEqual(3);
    }
  });
});
