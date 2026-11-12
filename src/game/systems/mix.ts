/**
 * The mix of the soundscape (AUD-03 wind and silence, AUD-06 music per chapter): which layers
 * sound and how loud, for a given state of the game. Pure, testable in Node; `ambience.ts`
 * turns it into Web Audio gains.
 *
 * The original soundscape (pad, music-box drips, fire, chimes, proximity arpeggio) is never
 * replaced: at chapter 0, with no wind zone, no silence and no edge, `mixFor` leaves it exactly
 * as it was, plus a faint wind bed.
 */
import { smoothstep } from '../math/util';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

/**
 * The "silence" of the game is wind, not the absence of sound.
 * - `off`: the music plays.
 * - `wind`: the music goes quiet and the wind stays, a little louder (before the ship, DIS-08).
 * - `hush`: the music stays quiet and the wind drops too, as if holding its breath (start of the reveal).
 */
export type Silence = 'off' | 'wind' | 'hush';

/**
 * Layers added on top of the original pad and drips, one per chapter (AUD-06). `from` is the
 * first chapter (0-based) where the layer sounds; it stays for the rest of the act.
 * - `drone` layers thicken the pad; `notes` layers add music-box voices.
 */
export const LAYERS = [
  { id: 'air', from: 1, kind: 'drone' },
  { id: 'answer', from: 2, kind: 'notes' },
  { id: 'deep', from: 3, kind: 'drone' },
  { id: 'phrase', from: 4, kind: 'notes' },
  { id: 'star', from: 5, kind: 'drone' },
] as const;

export type LayerId = (typeof LAYERS)[number]['id'];

export interface MixState {
  /** Current chapter, 0-based; past the last one (act finished) every layer sounds. */
  chapter: number;
  /** Free roam: the full mix. */
  freeRoam: boolean;
  silence: Silence;
  /** 0..1 wind of the place (1 at the top of the mirador, ART-08). */
  windZone: number;
  /** 0..1 how deep into the dark band before the edge (AUD-05): wind up, music down. */
  edge: number;
  /** 0..1 how much the ambience steps back for the song (AUD-01). */
  duck: number;
  /** 0..1 level of the proximity arpeggio (ENG-13): the note layers make room for it. */
  cue: number;
}

export const DEFAULT_MIX_STATE: MixState = {
  chapter: 0,
  freeRoam: false,
  silence: 'off',
  windZone: 0,
  edge: 0,
  duck: 0,
  cue: 0,
};

export interface Mix {
  /** Multiplier on the original pad. */
  pad: number;
  /** Multiplier on the original music-box drips. */
  box: number;
  /** Gain of each added layer (already includes silence, edge and duck). */
  layers: Record<LayerId, number>;
  /** Multiplier for the song (AUD-01): follows silence and edge, never the duck it causes. */
  song: number;
  /** 0..1 wind loudness. */
  wind: number;
}

/** Wind when nothing asks for it: barely there, so the original soundscape keeps its character. */
export const WIND_BASE = 0.12;
/** Wind while the music is silent. */
export const WIND_SILENCE = 0.5;
/** Wind while holding its breath. */
export const WIND_HUSH = 0.04;
/** Wind at the stop of the edge. */
export const WIND_EDGE = 0.85;
/** What is left of the music at the stop of the edge (brief, "Borde": about 10 %). */
export const EDGE_MUSIC_FLOOR = 0.1;
/** What is left of the ambience while the song plays at full duck. */
export const DUCK_FLOOR = 0.35;

/** Chapter whose layers sound: the free roam and the finished act get them all. */
export function mixChapter(chapter: number, freeRoam: boolean): number {
  const last = LAYERS[LAYERS.length - 1].from;
  return freeRoam ? last : Math.max(0, Math.min(last, Math.floor(chapter)));
}

export function mixFor(state: MixState): Mix {
  const edge = clamp01(state.edge);
  const audible = state.silence === 'off' ? 1 : 0;
  const song = audible * (1 - (1 - EDGE_MUSIC_FLOOR) * edge);
  const music = song * (1 - (1 - DUCK_FLOOR) * clamp01(state.duck));
  // The arpeggio that leads to a hidden object is also a music box: the note layers leave as soon as it is heard.
  const room = 1 - smoothstep(0, 0.35, clamp01(state.cue));

  const chapter = mixChapter(state.chapter, state.freeRoam);
  const layers = {} as Record<LayerId, number>;
  for (const l of LAYERS) layers[l.id] = chapter >= l.from ? music * (l.kind === 'notes' ? room : 1) : 0;

  let wind: number;
  if (state.silence === 'hush') wind = WIND_HUSH;
  else {
    const zone = WIND_BASE + (1 - WIND_BASE) * clamp01(state.windZone);
    const atEdge = WIND_BASE + (WIND_EDGE - WIND_BASE) * edge;
    wind = Math.max(zone, atEdge, state.silence === 'wind' ? WIND_SILENCE : 0);
  }
  return { pad: music, box: music, layers, song, wind };
}

/** Seconds the music takes to go quiet or come back (brief, "Revelación de la nave": 3 s). */
export const SILENCE_FADE_S = 3;
/** Seconds a new chapter's layers take to come in. */
export const CHAPTER_FADE_S = 9;

/**
 * How long (s) the move from one state to the next should take: slow when a chapter adds its
 * layers, 3 s for the silence, quick for what follows the player's position.
 */
export function fadeSeconds(prev: MixState, next: MixState): number {
  if (prev.silence !== next.silence) return SILENCE_FADE_S;
  if (mixChapter(prev.chapter, prev.freeRoam) !== mixChapter(next.chapter, next.freeRoam)) return CHAPTER_FADE_S;
  if (prev.duck !== next.duck) return 2;
  return 0.6;
}

/** The music goes quiet this close (m) to the ship's centre (brief, "Revelación de la nave"). */
export const SHIP_SILENCE_IN = 60;
/** ...and only comes back past this distance, so walking along the line doesn't make it flicker. */
export const SHIP_SILENCE_OUT = 72;

/** Whether the silence before the ship is on, given the distance to it and whether it was on already. */
export function shipSilence(distance: number, active: boolean): boolean {
  return distance < (active ? SHIP_SILENCE_OUT : SHIP_SILENCE_IN);
}

/**
 * Provisional wind of the mirador until ART-08 builds the mountain (which should drive it with
 * the same curve as the sky's reveal): grows over the last stretch towards the edge, inside the
 * mirador's sector only. `sector` is `miradorWeight` (0..1), `radius` the distance to the fire.
 */
export function miradorWind(sector: number, radius: number, edgeRadius: number): number {
  return clamp01(sector) * smoothstep(edgeRadius - 110, edgeRadius - 8, radius);
}
