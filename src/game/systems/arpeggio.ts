/**
 * Turns the chords of a song into a broken-chord piano accompaniment (AUD-01). Pure: no Web
 * Audio, testable in Node. The output uses the same `VoicedNote` as the melody, on the same clock.
 */
import { midiToFreq, type VoicedNote } from './melody';

export interface WrittenChord {
  /** Pitch class of the root: 0 = C .. 11 = B. */
  root: number;
  /** Semitones above the root, root included: [0, 4, 7] major, [0, 3, 7, 10] minor seventh. */
  intervals: readonly number[];
  /** Length in beats (quarter notes). */
  beats: number;
}

export interface Accompaniment {
  bpm: number;
  /** Semitones added to every note on playback (the key of the arrangement, no octave shift). */
  transpose: number;
  chords: readonly WrittenChord[];
}

/** The bass note of every chord lands in this octave-wide window, before transposing (F2..E3). */
export const BASS_LOW = 41;
/** Notes per beat: the arpeggio moves in eighths. */
const STEPS_PER_BEAT = 2;
/**
 * One bar of the figure, as chord degrees: root, fifth, octave, third above it, fifth above it
 * and back down. `7` is the seventh when the chord has one, the octave otherwise.
 */
const FIGURE = ['1', '5', '8', '3^', '5^', '3^', '7', '5'] as const;
/** The last chord only rises (root, fifth, octave, third) and is left to ring. */
const LAST_STEPS = 4;

function degree(step: (typeof FIGURE)[number], chord: WrittenChord): number {
  const [, third = 4, fifth = 7, seventh] = chord.intervals;
  switch (step) {
    case '1':
      return 0;
    case '5':
      return fifth;
    case '8':
      return 12;
    case '3^':
      return 12 + third;
    case '5^':
      return 12 + fifth;
    case '7':
      return seventh ?? 12;
  }
}

/** MIDI number of the chord's bass note: its root inside the window that starts at `BASS_LOW`. */
export function bassOf(root: number): number {
  return BASS_LOW + ((((root - BASS_LOW) % 12) + 12) % 12);
}

/**
 * Eighth notes through each chord, restarting the figure on every chord change. Each note is
 * held to the end of its chord, as with the pedal down. The first note of a chord is the
 * strongest, the ones on the beat follow, the ones between beats are the softest.
 */
export function arpeggiate(acc: Accompaniment): VoicedNote[] {
  const beat = 60 / acc.bpm;
  const out: VoicedNote[] = [];
  let at = 0;
  acc.chords.forEach((chord, i) => {
    const bass = bassOf(chord.root) + acc.transpose;
    const isLast = i === acc.chords.length - 1;
    const steps = Math.round(chord.beats * STEPS_PER_BEAT);
    const count = isLast ? Math.min(steps, LAST_STEPS) : steps;
    for (let s = 0; s < count; s++) {
      const offset = s / STEPS_PER_BEAT;
      out.push({
        start: (at + offset) * beat,
        duration: (chord.beats - offset) * beat,
        freq: midiToFreq(bass + degree(FIGURE[s % FIGURE.length], chord)),
        accent: s === 0 ? 1 : s % STEPS_PER_BEAT === 0 ? 0.72 : 0.58,
      });
    }
    at += chord.beats;
  });
  return out;
}
