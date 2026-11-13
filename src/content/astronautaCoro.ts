/**
 * Loader for the chorus of "Astronauta" (AUD-01), transcribed from the lead-voice score into
 * `astronauta-coro.json`. Only the expected *shape* lives here; the notes are edited in the JSON.
 * Error messages are in Spanish: they are written for the author, who validates the transcription.
 */
import raw from './astronauta-coro.json';

/** One note or rest as written in the score. */
export interface ScoreNote {
  /** MIDI number of the written pitch (key signature already applied); `null` is a rest. */
  midi: number | null;
  /** Length in beats (quarter notes). */
  beats: number;
  /** Tied to the next note: both sound as one. */
  tie: boolean;
  /** Lyric syllable under the note, for validation only. */
  syllable: string;
  /** Bar number in the score. */
  bar: number;
}

/** One chord of the harmony, as written (original key). */
export interface ScoreChord {
  /** Chord symbol as written in the JSON, e.g. "Bb7". */
  name: string;
  /** Pitch class of the root: 0 = C .. 11 = B. */
  root: number;
  /** Semitones above the root, root included. */
  intervals: readonly number[];
  /** Length in beats (quarter notes). */
  beats: number;
  /** Bar number in the score. */
  bar: number;
}

export interface Chorus {
  bpm: number;
  beatsPerBar: number;
  /** Semitones added on playback (arrangement, not the score): `transponer` + 12 × `octava`. */
  transpose: number;
  notes: ScoreNote[];
  /**
   * The chords under the melody, for the piano. It shares the tempo and the key of the
   * arrangement (`transponer`) but not `octava`: the piano keeps its own, lower register.
   */
  harmony: { bpm: number; transpose: number; chords: ScoreChord[] };
}

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "Eb4" → 63, "F#5" → 78. Returns null if the name is not a note. */
export function noteToMidi(name: string): number | null {
  const m = /^([A-G])([b#]?)(-?\d)$/.exec(name);
  if (!m) return null;
  const accidental = m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0;
  return 12 * (parseInt(m[3], 10) + 1) + STEP[m[1]] + accidental;
}

/**
 * Root, third, fifth and an optional fourth tone, in that order: the piano's figure
 * (`arpeggio.ts`) reads them by position, so a sus chord's 2nd or 4th takes the third's place and
 * a 6th or added 9th takes the seventh's.
 */
const QUALITIES: Record<string, readonly number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  m7b5: [0, 3, 6, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  add9: [0, 4, 7, 14],
  madd9: [0, 3, 7, 14],
  mmaj7: [0, 3, 7, 11],
  '7sus4': [0, 5, 7, 10],
};

/** "Bb" → root 10, major; "Cm7" → root 0, minor seventh. Returns null if it is not a chord we know. */
export function parseChord(name: string): { root: number; intervals: readonly number[] } | null {
  const m = /^([A-G])([b#]?)(.*)$/.exec(name);
  if (!m || !(m[3] in QUALITIES)) return null;
  const accidental = m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0;
  return { root: (STEP[m[1]] + accidental + 12) % 12, intervals: QUALITIES[m[3]] };
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Validates the JSON and flattens it. Throws one error listing every problem found. */
export function parseChorus(json: unknown): Chorus {
  const errors: string[] = [];
  const root = isObj(json) ? json : {};
  const meter = Array.isArray(root.compas) ? root.compas : [];
  const beatsPerBar = isNum(meter[0]) && meter[1] === 4 ? meter[0] : 0;
  if (!beatsPerBar) errors.push('"compas" debe ser [pulsos, 4], por ejemplo [4, 4].');
  const bpm = isNum(root.tempo) && root.tempo >= 30 && root.tempo <= 240 ? root.tempo : 0;
  if (!bpm) errors.push('"tempo" debe ser un número entre 30 y 240 (negras por minuto).');
  const arr = isObj(root.arreglo) ? root.arreglo : {};
  if (!Number.isInteger(arr.transponer) || !Number.isInteger(arr.octava))
    errors.push('"arreglo.transponer" (semitonos) y "arreglo.octava" deben ser números enteros.');
  const transpose = (Number(arr.transponer) || 0) + 12 * (Number(arr.octava) || 0);

  const notes: ScoreNote[] = [];
  const chords: ScoreChord[] = [];
  const bars = Array.isArray(root.compases) ? root.compases : [];
  if (!bars.length) errors.push('"compases" debe ser una lista con al menos un compás.');
  bars.forEach((b: unknown, i: number) => {
    const barObj = isObj(b) ? b : {};
    const bar = isNum(barObj.numero) ? barObj.numero : NaN;
    const where = `compás ${Number.isNaN(bar) ? `#${i + 1} de la lista` : bar}`;
    if (Number.isNaN(bar)) errors.push(`Al ${where} le falta "numero".`);
    const list = Array.isArray(barObj.notas) ? barObj.notas : [];
    let sum = 0;
    list.forEach((n: unknown, j: number) => {
      const o = isObj(n) ? n : {};
      const at = `${where}, nota ${j + 1}`;
      const beats = isNum(o.pulsos) && o.pulsos > 0 ? o.pulsos : 0;
      if (!beats) errors.push(`${at}: "pulsos" debe ser un número mayor que 0 (negra = 1).`);
      sum += beats;
      let midi: number | null = null;
      if (o.nota !== null) {
        midi = typeof o.nota === 'string' ? noteToMidi(o.nota) : null;
        if (midi === null) errors.push(`${at}: "nota" debe ser algo como "Eb4", o null si es un silencio.`);
      }
      const tie = o.ligada === true;
      if (tie && o.nota === null) errors.push(`${at}: un silencio no puede ir "ligada".`);
      notes.push({ midi, beats, tie, syllable: typeof o.silaba === 'string' ? o.silaba : '', bar });
    });
    if (beatsPerBar && Math.abs(sum - beatsPerBar) > 1e-6)
      errors.push(`El ${where} suma ${sum} pulsos y debería sumar ${beatsPerBar}.`);
    let chordSum = 0;
    const chordList = Array.isArray(barObj.acordes) ? barObj.acordes : [];
    if (!chordList.length) errors.push(`Al ${where} le falta "acordes" (al menos uno).`);
    chordList.forEach((c: unknown, j: number) => {
      const o = isObj(c) ? c : {};
      const at = `${where}, acorde ${j + 1}`;
      const beats = isNum(o.pulsos) && o.pulsos > 0 && Number.isInteger(o.pulsos * 2) ? o.pulsos : 0;
      if (!beats) errors.push(`${at}: "pulsos" debe ser un múltiplo de 0.5 mayor que 0 (negra = 1).`);
      chordSum += beats;
      const name = typeof o.acorde === 'string' ? o.acorde : '';
      const chord = parseChord(name);
      if (!chord)
        errors.push(`${at}: "acorde" debe ser algo como "Eb", "Cm", "Bb7", "Fm7", "Abmaj7", "Dm7b5", "Bbsus4" o "Ebadd9".`);
      else chords.push({ name, ...chord, beats, bar });
    });
    if (beatsPerBar && chordList.length && Math.abs(chordSum - beatsPerBar) > 1e-6)
      errors.push(`Los acordes del ${where} suman ${chordSum} pulsos y deberían sumar ${beatsPerBar}.`);
  });
  notes.forEach((n, i) => {
    if (!n.tie) return;
    const next = notes[i + 1];
    if (!next || next.midi !== n.midi)
      errors.push(`compás ${n.bar}: una nota "ligada" debe ir seguida de otra de la misma altura.`);
  });

  if (errors.length) throw new Error(`astronauta-coro.json:\n- ${errors.join('\n- ')}`);
  const harmony = { bpm, transpose: Number(arr.transponer) || 0, chords };
  return { bpm, beatsPerBar, transpose, notes, harmony };
}

export const ASTRONAUTA_CHORUS: Chorus = parseChorus(raw);
