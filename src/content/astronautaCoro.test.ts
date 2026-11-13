import { describe, expect, it } from 'vitest';
import raw from './astronauta-coro.json';
import { ASTRONAUTA_CHORUS, noteToMidi, parseChord, parseChorus } from './astronautaCoro';

const clone = (): typeof raw => JSON.parse(JSON.stringify(raw));

describe('astronauta-coro.json (AUD-01)', () => {
  it('reads note names with the accidental already applied', () => {
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('Eb4')).toBe(63);
    expect(noteToMidi('Bb3')).toBe(58);
    expect(noteToMidi('F#5')).toBe(78);
    expect(noteToMidi('H4')).toBeNull();
  });

  it('is the chorus B1: bars 17 to 34 in order, each one complete', () => {
    expect(raw.compases.map((b) => b.numero)).toEqual(Array.from({ length: 18 }, (_, i) => 17 + i));
    for (const bar of raw.compases) {
      expect(bar.notas.reduce((s, n) => s + n.pulsos, 0), `bar ${bar.numero}`).toBe(raw.compas[0]);
    }
    const total = ASTRONAUTA_CHORUS.notes.reduce((s, n) => s + n.beats, 0);
    expect(total).toBe(18 * ASTRONAUTA_CHORUS.beatsPerBar);
  });

  it('only uses eighths, quarters and halves, as the score does', () => {
    for (const n of ASTRONAUTA_CHORUS.notes) expect([0.5, 1, 2]).toContain(n.beats);
  });

  it('stays in the written range (Bb3 to Bb4) and in the key of Eb major', () => {
    const scale = [3, 5, 7, 8, 10, 0, 2]; // Eb F G Ab Bb C D
    for (const n of ASTRONAUTA_CHORUS.notes) {
      if (n.midi === null) continue;
      expect(n.midi).toBeGreaterThanOrEqual(58);
      expect(n.midi).toBeLessThanOrEqual(70);
      expect(scale, `bar ${n.bar}`).toContain(n.midi % 12);
    }
  });

  it('gives every note a syllable and no rest one', () => {
    for (const n of ASTRONAUTA_CHORUS.notes) {
      if (n.midi === null) expect(n.syllable).toBe('');
      else expect(n.syllable, `bar ${n.bar}`).not.toBe('');
    }
  });

  it('ties only notes of the same pitch', () => {
    const { notes } = ASTRONAUTA_CHORUS;
    const ties = notes.filter((n) => n.tie);
    expect(ties.length).toBeGreaterThan(0);
    notes.forEach((n, i) => {
      if (n.tie) expect(notes[i + 1].midi).toBe(n.midi);
    });
  });

  it('sings the lyric of B1', () => {
    const sung = ASTRONAUTA_CHORUS.notes
      .map((n) => n.syllable)
      .filter(Boolean)
      .join(' ')
      .replace(/- -/g, '') // a syllable held over a tie: "na- -au-"
      .replace(/- /g, '')
      .replace(/ -/g, '');
    expect(sung).toContain('Astronaauta atravesando el sileencio');
    expect(sung).toContain('nauta con los pies en la tieerra');
  });

  it('keeps the arrangement apart from the score', () => {
    expect(ASTRONAUTA_CHORUS.transpose).toBe(raw.arreglo.transponer + 12 * raw.arreglo.octava);
    expect(ASTRONAUTA_CHORUS.bpm).toBe(raw.tempo);
  });

  it('reads chord symbols', () => {
    expect(parseChord('Eb')).toEqual({ root: 3, intervals: [0, 4, 7] });
    expect(parseChord('Cm')).toEqual({ root: 0, intervals: [0, 3, 7] });
    expect(parseChord('Bb7')).toEqual({ root: 10, intervals: [0, 4, 7, 10] });
    expect(parseChord('F#m7')).toEqual({ root: 6, intervals: [0, 3, 7, 10] });
    expect(parseChord('Dm7b5')).toEqual({ root: 2, intervals: [0, 3, 6, 10] });
    expect(parseChord('Bbsus4')).toEqual({ root: 10, intervals: [0, 5, 7] });
    expect(parseChord('Ebadd9')).toEqual({ root: 3, intervals: [0, 4, 7, 14] });
    expect(parseChord('Bdim')).toEqual({ root: 11, intervals: [0, 3, 6] });
    expect(parseChord('Abmaj7')).toEqual({ root: 8, intervals: [0, 4, 7, 11] });
    expect(parseChord('Cb')).toEqual({ root: 11, intervals: [0, 4, 7] });
    expect(parseChord('Ebsus')).toBeNull();
    expect(parseChord('Mib')).toBeNull();
  });

  it('has chords filling every bar, ending on the tonic', () => {
    const { chords, bpm, transpose } = ASTRONAUTA_CHORUS.harmony;
    for (const bar of raw.compases) {
      expect(bar.acordes.reduce((s, c) => s + c.pulsos, 0), `bar ${bar.numero}`).toBe(raw.compas[0]);
    }
    expect(chords.reduce((s, c) => s + c.beats, 0)).toBe(18 * ASTRONAUTA_CHORUS.beatsPerBar);
    // The harmony is the author's: borrowed chords (Fm7b5) are welcome, so no key check here.
    expect(chords[chords.length - 1].root).toBe(3); // Eb
    expect(bpm).toBe(raw.tempo);
    // The piano follows the key of the arrangement but not the melody's octave shift.
    expect(transpose).toBe(raw.arreglo.transponer);
  });

  it('rejects an unknown chord and chords that do not fill the bar, naming it', () => {
    const name = clone();
    name.compases[1].acordes[0].acorde = 'Mib';
    expect(() => parseChorus(name)).toThrow(/compás 18, acorde 1/);
    const short = clone();
    short.compases[3].acordes[0].pulsos = 2;
    expect(() => parseChorus(short)).toThrow(/acordes del compás 20 suman 2 pulsos/);
    const none = clone();
    none.compases[0].acordes = [];
    expect(() => parseChorus(none)).toThrow(/compás 17 le falta "acordes"/);
  });

  it('rejects an incomplete bar, naming it', () => {
    const bad = clone();
    bad.compases[2].notas.pop();
    expect(() => parseChorus(bad)).toThrow(/compás 19 suma 3\.5 pulsos/);
  });

  it('rejects a tie between different pitches and an unknown note', () => {
    const tie = clone();
    tie.compases[0].notas[2].ligada = true as never;
    tie.compases[0].notas[2].nota = 'G4';
    expect(() => parseChorus(tie)).toThrow(/ligada/);
    const name = clone();
    name.compases[0].notas[1].nota = 'Mi4';
    expect(() => parseChorus(name)).toThrow(/compás 17, nota 2/);
  });
});
