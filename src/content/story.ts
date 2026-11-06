/**
 * Estructura narrativa del Acto I ("Astronauta"). Los TEXTOS viven en `acto1.json`
 * (ahí se editan); aquí solo queda lo que no es prosa: ids, capítulo de cada memoria,
 * geometría de la mirada y radios. El orden de MEMORY_STRUCT es el orden del diario.
 *
 * Isi despierta sin recordar: sostener la mirada le devuelve un recuerdo, y el radio
 * que crece es también el miedo que cede (canon revisado, ver el brief del Acto I).
 */
import { loadActo1 } from './acto1Texts';

export type ItemId =
  | 'fire'
  | 'helmet'
  | 'thermos'
  | 'patch'
  | 'photo'
  | 'seeds'
  | 'recorder'
  | 'beacon'
  | 'ship'
  | 'campfire'
  | 'star';

export interface MemoryDef {
  id: ItemId;
  /** Chapter in which this memory can be recalled. */
  chapter: number;
  title: string;
  text: string;
  attention: {
    /** Height above the object's origin that the player must look at. */
    offsetY: number;
    /** Max distance (m) to recall it. */
    range: number;
    /** Max distance from screen center, in fractions of half the screen height. */
    cone: number;
  };
}

export interface ChapterDef {
  /** Radius (m) around camp that becomes walkable/visible during this chapter. */
  radius: number;
  /** Whispered after a long time without progress. */
  hint: string;
  /** Thoughts shown when the chapter is completed. */
  done: readonly string[];
}

type MemoryStruct = Omit<MemoryDef, 'title' | 'text'>;

const MEMORY_STRUCT: readonly MemoryStruct[] = [
  { id: 'fire', chapter: 0, attention: { offsetY: 0.6, range: 8, cone: 0.26 } },
  { id: 'helmet', chapter: 0, attention: { offsetY: 0.3, range: 6.5, cone: 0.24 } },
  { id: 'thermos', chapter: 0, attention: { offsetY: 0.15, range: 6.5, cone: 0.24 } },
  { id: 'patch', chapter: 1, attention: { offsetY: 0.4, range: 6.5, cone: 0.24 } },
  { id: 'photo', chapter: 1, attention: { offsetY: 0.25, range: 6.5, cone: 0.24 } },
  { id: 'seeds', chapter: 1, attention: { offsetY: 0.15, range: 6.5, cone: 0.24 } },
  { id: 'recorder', chapter: 2, attention: { offsetY: 0.3, range: 7, cone: 0.24 } },
  { id: 'beacon', chapter: 2, attention: { offsetY: 1.0, range: 8, cone: 0.26 } },
  { id: 'ship', chapter: 3, attention: { offsetY: 2.0, range: 24, cone: 0.42 } },
  // DIS-07: back at the fire she wakes by, a second time. Same object, so same gaze geometry as `fire`.
  { id: 'campfire', chapter: 4, attention: { offsetY: 0.6, range: 8, cone: 0.26 } },
  { id: 'star', chapter: 5, attention: { offsetY: 0, range: Infinity, cone: 0.14 } },
];

/** Chapter where Isi goes back to the fire and sits down (DIS-07). */
export const CAMPFIRE_CHAPTER = 4;
/** Last chapter: she looks for the star, seated by the fire. */
export const STAR_CHAPTER = 5;

/** Radios de cada capítulo (m). Su id en el JSON es `capitulo<N>` (N desde 1). */
const CHAPTER_RADII: readonly number[] = [14, 48, 90, 150, 150, 150];

/** Id de un capítulo en `acto1.json`. */
export const chapterKey = (index: number): string => `capitulo${index + 1}`;

/**
 * Objetos ocultos del paseo libre (DIS-04). Isi no los reconoce; no cuentan en el
 * contador. Dónde van y sus escondites: `game/story/hiddenLayout.ts` y `game/story/hidden.ts` (ENG-13).
 */
export const HIDDEN_IDS = ['guitar', 'insulin', 'campanil', 'earring', 'letter'] as const;
export type HiddenId = (typeof HIDDEN_IDS)[number];

export interface HiddenDef {
  id: HiddenId;
  title: string;
  text: string;
  /** Same meaning as a memory's. Small objects: short range, narrow cone. */
  attention: MemoryDef['attention'];
}

const HIDDEN_ATTENTION: Record<HiddenId, HiddenDef['attention']> = {
  guitar: { offsetY: 0.55, range: 7, cone: 0.26 },
  insulin: { offsetY: 0.05, range: 4.5, cone: 0.22 },
  campanil: { offsetY: 0.15, range: 6, cone: 0.24 },
  earring: { offsetY: 0.12, range: 5, cone: 0.22 },
  letter: { offsetY: 0.66, range: 6, cone: 0.24 },
};

/** Ids que el código espera encontrar en `acto1.json` (los usa el test de validación). */
export const EXPECTED_IDS = {
  memorias: MEMORY_STRUCT.map((m) => m.id),
  ocultos: HIDDEN_IDS,
  capitulos: CHAPTER_RADII.map((_, i) => chapterKey(i)),
};

/** Textos validados (lanza un error legible si al JSON le falta o le sobra algo). */
export const ACTO1_TEXTS = loadActo1(EXPECTED_IDS);

export const MEMORIES: readonly MemoryDef[] = MEMORY_STRUCT.map((m) => ({
  ...m,
  title: ACTO1_TEXTS.memorias[m.id as keyof typeof ACTO1_TEXTS.memorias].titulo,
  text: ACTO1_TEXTS.memorias[m.id as keyof typeof ACTO1_TEXTS.memorias].texto,
}));

export const HIDDEN: readonly HiddenDef[] = HIDDEN_IDS.map((id) => ({
  id,
  attention: HIDDEN_ATTENTION[id],
  title: ACTO1_TEXTS.ocultos[id].titulo,
  text: ACTO1_TEXTS.ocultos[id].texto,
}));

export const CHAPTERS: readonly ChapterDef[] = CHAPTER_RADII.map((radius, i) => {
  const c = ACTO1_TEXTS.capitulos[chapterKey(i) as keyof typeof ACTO1_TEXTS.capitulos];
  return { radius, hint: c.pista, done: c.al_terminar };
});

/** First thoughts on waking by the fire, before she dares to look at anything. */
export const WAKE_LINES: readonly string[] = ACTO1_TEXTS.voz_de_isi.al_despertar;

/** Whispered when the player walks into the edge of what she dares to look at. */
export const EDGE_LINES: readonly string[] = ACTO1_TEXTS.voz_de_isi.al_llegar_al_borde;

/** Same, in the free roam (ENG-14): the fear of the chapters is behind her by then. */
export const FREE_EDGE_LINES: readonly string[] = ACTO1_TEXTS.voz_de_isi.al_llegar_al_borde_libre;

export const STILLNESS_LINE: string = ACTO1_TEXTS.voz_de_isi.quedarse_quieta;
