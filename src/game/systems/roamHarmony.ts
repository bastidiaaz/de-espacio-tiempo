/**
 * The harmony of the free roam (pedido del autor, 2026-11-13): the background follows the chords
 * of "Astronauta", in the key the song sounds in, slowly and on a loop. Not its melody: only its
 * chords, which the pad holds and the music-box notes pick from. Pure, testable in Node;
 * `ambience.ts` plays it.
 *
 * The chords are the ones the author wrote in `astronauta-coro.json` (`acordes`), in the written
 * key; `transpose` moves them to the key they sound in, as for the piano under the chorus.
 */
import type { WrittenChord } from './arpeggio';

/** Seconds per beat in the free roam: a bar of four beats lasts ~10 s, far slower than the song. */
export const ROAM_BEAT_S = 2.4;
/** The pad's bass lands in this octave-wide window (MIDI, before transposing): E2..Eb3. */
export const ROAM_BASS_LOW = 40;
/** And its three upper voices in this one (MIDI, before transposing): E3..Eb4, close to the original pad. */
export const ROAM_UPPER_LOW = 52;

/** Pitch classes of a chord, root first, each once, moved by `transpose` semitones. */
function pitchClasses(chord: WrittenChord, transpose: number): number[] {
  const out: number[] = [];
  for (const i of chord.intervals) {
    const pc = (((chord.root + i + transpose) % 12) + 12) % 12;
    if (!out.includes(pc)) out.push(pc);
  }
  return out;
}

/** The only MIDI note of pitch class `pc` in the octave starting at `low`. */
const inOctave = (pc: number, low: number): number => low + ((((pc - low) % 12) + 12) % 12);

/**
 * The pad's four voices for a chord (MIDI): the root in the bass, and above it the rest of the
 * chord (its three upper tones; a triad keeps its root up there too), each in a fixed octave, so
 * consecutive chords move by small steps without any voice-leading bookkeeping.
 */
export function padVoicing(chord: WrittenChord, transpose: number): number[] {
  const pcs = pitchClasses(chord, transpose);
  const upper = (pcs.length > 3 ? pcs.slice(1, 4) : pcs).map((pc) => inOctave(pc, ROAM_UPPER_LOW + transpose));
  return [inOctave(pcs[0], ROAM_BASS_LOW + transpose), ...upper.sort((a, b) => a - b)];
}

/** Every note of the chord between `low` and `high` (MIDI, inclusive), ascending. */
export function chordNotesIn(chord: WrittenChord, transpose: number, low: number, high: number): number[] {
  const pcs = pitchClasses(chord, transpose);
  const out: number[] = [];
  for (let m = low; m <= high; m++) if (pcs.includes(((m % 12) + 12) % 12)) out.push(m);
  return out;
}

/** How long a chord lasts in the free roam, in seconds. */
export const roamSeconds = (chord: WrittenChord): number => chord.beats * ROAM_BEAT_S;
