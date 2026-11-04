/**
 * Estructura narrativa del Acto I ("Astronauta"). Los TEXTOS viven en `acto1.json`
 * (ahí se editan); aquí solo queda lo que no es prosa: ids, capítulo de cada memoria,
 * geometría de la mirada y radios. El orden de MEMORY_STRUCT es el orden del diario.
 *
 * Isi recuerda todo; lo que no puede es mirarlo de frente. Sostener la mirada es
 * atreverse a admitir una verdad que ya conoce, y el radio que crece es el miedo que
 * cede, no la memoria que vuelve.
 */
import { loadActo1 } from './acto1Texts';

export type ItemId =
  'fire' | 'helmet' | 'thermos' | 'patch' | 'photo' | 'seeds' | 'recorder' | 'beacon' | 'ship' | 'star';

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
  { id: 'star', chapter: 4, attention: { offsetY: 0, range: Infinity, cone: 0.14 } },
];

/** Radios de cada capítulo (m). Su id en el JSON es `capitulo<N>` (N desde 1). */
const CHAPTER_RADII: readonly number[] = [14, 48, 90, 150, 150];

/** Id de un capítulo en `acto1.json`. */
export const chapterKey = (index: number): string => `capitulo${index + 1}`;

/** Ids que el código espera encontrar en `acto1.json` (los usa el test de validación). */
export const EXPECTED_IDS = {
  memorias: MEMORY_STRUCT.map((m) => m.id),
  capitulos: CHAPTER_RADII.map((_, i) => chapterKey(i)),
};

/** Textos validados (lanza un error legible si al JSON le falta o le sobra algo). */
export const ACTO1_TEXTS = loadActo1(EXPECTED_IDS);

export const MEMORIES: readonly MemoryDef[] = MEMORY_STRUCT.map((m) => ({
  ...m,
  title: ACTO1_TEXTS.memorias[m.id as keyof typeof ACTO1_TEXTS.memorias].titulo,
  text: ACTO1_TEXTS.memorias[m.id as keyof typeof ACTO1_TEXTS.memorias].texto,
}));

export const CHAPTERS: readonly ChapterDef[] = CHAPTER_RADII.map((radius, i) => {
  const c = ACTO1_TEXTS.capitulos[chapterKey(i) as keyof typeof ACTO1_TEXTS.capitulos];
  return { radius, hint: c.pista, done: c.al_terminar };
});

/** First thoughts on waking by the fire, before she dares to look at anything. */
export const WAKE_LINES: readonly string[] = ACTO1_TEXTS.voz_de_isi.al_despertar;

/** Whispered when the player walks into the edge of what she dares to look at. */
export const EDGE_LINES: readonly string[] = ACTO1_TEXTS.voz_de_isi.al_llegar_al_borde;

export const STILLNESS_LINE: string = ACTO1_TEXTS.voz_de_isi.quedarse_quieta;
