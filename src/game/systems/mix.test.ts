import { describe, expect, it } from 'vitest';
import {
  CHAPTER_FADE_S,
  DEFAULT_MIX_STATE,
  DUCK_FLOOR,
  EDGE_MUSIC_FLOOR,
  LAYERS,
  SILENCE_FADE_S,
  WIND_BASE,
  WIND_EDGE,
  WIND_HUSH,
  WIND_SILENCE,
  fadeSeconds,
  mixChapter,
  mixFor,
  type MixState,
} from './mix';
import { CHAPTERS } from '../../content/story';

const at = (patch: Partial<MixState>): MixState => ({ ...DEFAULT_MIX_STATE, ...patch });
const sounding = (s: MixState) => LAYERS.filter((l) => mixFor(s).layers[l.id] > 0).map((l) => l.id);

describe('mixFor: music per chapter (AUD-06)', () => {
  it('leaves the original soundscape untouched at chapter 0', () => {
    const m = mixFor(DEFAULT_MIX_STATE);
    expect(m.pad).toBe(1);
    expect(m.box).toBe(1);
    expect(sounding(DEFAULT_MIX_STATE)).toEqual([]);
    expect(m.wind).toBe(WIND_BASE);
  });

  it('adds exactly one layer per chapter and never takes one away', () => {
    expect(LAYERS.length).toBe(CHAPTERS.length - 1);
    for (let c = 0; c < CHAPTERS.length; c++) {
      expect(sounding(at({ chapter: c }))).toEqual(LAYERS.slice(0, c).map((l) => l.id));
      const m = mixFor(at({ chapter: c }));
      expect(m.pad).toBe(1);
      expect(m.box).toBe(1);
    }
  });

  it('plays the full mix once the act is finished', () => {
    const all = LAYERS.map((l) => l.id);
    expect(sounding(at({ chapter: CHAPTERS.length }))).toEqual(all);
    expect(mixChapter(99, false)).toBe(LAYERS[LAYERS.length - 1].from);
    expect(mixChapter(-1, false)).toBe(0);
  });

  it('makes room for the proximity arpeggio: note layers leave, drones and the original stay', () => {
    const m = mixFor(at({ chapter: CHAPTERS.length, cue: 0.5 }));
    expect(m.layers.answer).toBe(0);
    expect(m.layers.phrase).toBe(0);
    expect(m.layers.air).toBe(1);
    expect(m.layers.star).toBe(1);
    expect(m.box).toBe(1);
  });

  it('plays the free roam in the key of "Astronauta": its pad instead of the A-major one and the drones', () => {
    const story = mixFor(at({ chapter: CHAPTERS.length }));
    expect(story.roam).toBe(0);
    expect(story.pad).toBe(1);
    const roam = at({ chapter: 0, freeRoam: true });
    const m = mixFor(roam);
    expect(m.pad).toBe(0);
    expect(m.roam).toBe(1);
    expect(m.box).toBe(1);
    expect(sounding(roam)).toEqual(LAYERS.filter((l) => l.kind === 'notes').map((l) => l.id));
    // It follows the silence and the edge like the rest of the music.
    expect(mixFor(at({ freeRoam: true, silence: 'wind' })).roam).toBe(0);
    expect(mixFor(at({ freeRoam: true, edge: 1 })).roam).toBeCloseTo(EDGE_MUSIC_FLOOR);
    // And comes in slowly, like a new chapter.
    expect(fadeSeconds(at({ chapter: CHAPTERS.length }), roam)).toBe(CHAPTER_FADE_S);
  });
});

describe('mixFor: wind and silence (AUD-03)', () => {
  it('silences every music layer and leaves the wind', () => {
    const m = mixFor(at({ chapter: 3, silence: 'wind' }));
    expect(m.pad).toBe(0);
    expect(m.box).toBe(0);
    expect(m.song).toBe(0);
    expect(sounding(at({ chapter: 3, silence: 'wind' }))).toEqual([]);
    expect(m.wind).toBe(WIND_SILENCE);
  });

  it('holds its breath: music still silent, wind below its resting level', () => {
    const m = mixFor(at({ chapter: 3, silence: 'hush', windZone: 1, edge: 1 }));
    expect(m.pad).toBe(0);
    expect(m.wind).toBe(WIND_HUSH);
    expect(WIND_HUSH).toBeLessThan(WIND_BASE);
  });

  it('grows with the wind zone up to full, without touching the music', () => {
    let prev = mixFor(at({ freeRoam: true })).wind;
    for (let z = 0.1; z <= 1.0001; z += 0.1) {
      const m = mixFor(at({ freeRoam: true, windZone: z }));
      expect(m.wind).toBeGreaterThan(prev);
      expect(m.roam).toBe(1);
      prev = m.wind;
    }
    expect(prev).toBeCloseTo(1);
    expect(mixFor(at({ windZone: 7 })).wind).toBe(1);
  });

  it('takes the loudest request rather than adding them up', () => {
    expect(mixFor(at({ silence: 'wind', windZone: 1 })).wind).toBe(1);
    expect(mixFor(at({ silence: 'wind', windZone: 0.1 })).wind).toBe(WIND_SILENCE);
  });
});

describe('mixFor: edge and duck (API for AUD-05 and AUD-01)', () => {
  it('at the stop only the wind is left: music at its floor, song included', () => {
    const m = mixFor(at({ chapter: 5, edge: 1 }));
    expect(m.pad).toBeCloseTo(EDGE_MUSIC_FLOOR);
    expect(m.box).toBeCloseTo(EDGE_MUSIC_FLOOR);
    expect(m.song).toBeCloseTo(EDGE_MUSIC_FLOOR);
    expect(m.layers.air).toBeCloseTo(EDGE_MUSIC_FLOOR);
    expect(m.wind).toBeCloseTo(WIND_EDGE);
  });

  it('is monotonic across the band', () => {
    let prev = mixFor(at({ edge: 0 }));
    for (let e = 0.1; e <= 1.0001; e += 0.1) {
      const m = mixFor(at({ edge: e }));
      expect(m.pad).toBeLessThan(prev.pad);
      expect(m.wind).toBeGreaterThan(prev.wind);
      prev = m;
    }
  });

  it('ducks the ambience under the song, but not the song itself nor the wind', () => {
    const m = mixFor(at({ chapter: 5, duck: 1 }));
    expect(m.pad).toBeCloseTo(DUCK_FLOOR);
    expect(m.layers.star).toBeCloseTo(DUCK_FLOOR);
    expect(m.song).toBe(1);
    expect(m.wind).toBe(WIND_BASE);
  });
});

describe('fadeSeconds', () => {
  it('fades the silence in 3 s, chapters slowly, and follows the position quickly', () => {
    const a = at({ chapter: 2 });
    expect(fadeSeconds(a, at({ chapter: 2, silence: 'wind' }))).toBe(SILENCE_FADE_S);
    expect(fadeSeconds(a, at({ chapter: 3 }))).toBe(CHAPTER_FADE_S);
    expect(fadeSeconds(a, at({ chapter: 2, freeRoam: true }))).toBe(CHAPTER_FADE_S);
    expect(fadeSeconds(a, at({ chapter: 2, edge: 0.4 }))).toBeLessThan(1);
    expect(fadeSeconds(a, at({ chapter: 2, windZone: 0.4 }))).toBeLessThan(1);
  });
});
