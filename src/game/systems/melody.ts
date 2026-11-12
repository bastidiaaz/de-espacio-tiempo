/**
 * Turns a written melody into what a synth has to play (AUD-01). Pure: no Web Audio, testable in Node.
 */

export interface WrittenNote {
  /** MIDI number; `null` is a rest. */
  midi: number | null;
  /** Length in beats (quarter notes). */
  beats: number;
  /** Tied to the next note of the same pitch: they sound as one. */
  tie: boolean;
}

export interface Melody {
  bpm: number;
  beatsPerBar: number;
  /** Semitones added to every note on playback. */
  transpose: number;
  notes: readonly WrittenNote[];
}

/** One sounding note, in seconds from the start of the melody. */
export interface VoicedNote {
  start: number;
  duration: number;
  freq: number;
  /** 0..1 loudness: notes on the beat are a little stronger than the ones between beats. */
  accent: number;
}

export const midiToFreq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/** Rests are dropped, tied notes are merged into the first one. */
export function voiceMelody(melody: Melody): VoicedNote[] {
  const beat = 60 / melody.bpm;
  const out: VoicedNote[] = [];
  let at = 0;
  let open: VoicedNote | null = null;
  for (const n of melody.notes) {
    if (n.midi !== null) {
      if (open) open.duration += n.beats * beat;
      else {
        const inBar = at % melody.beatsPerBar;
        const onBeat = Math.abs(inBar - Math.round(inBar)) < 1e-6;
        const accent = inBar < 1e-6 ? 1 : onBeat ? 0.9 : 0.78;
        open = { start: at * beat, duration: n.beats * beat, freq: midiToFreq(n.midi + melody.transpose), accent };
        out.push(open);
      }
      if (!n.tie) open = null;
    } else open = null;
    at += n.beats;
  }
  return out;
}

/** Seconds from the start to the end of the last sounding note (trailing rests do not count). */
export function melodyLength(notes: readonly VoicedNote[]): number {
  return notes.reduce((end, n) => Math.max(end, n.start + n.duration), 0);
}
