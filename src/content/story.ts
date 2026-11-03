/**
 * Narrative content. Pure data: writers can edit this file without touching the engine.
 * Order matters: MEMORIES order is the journal order.
 */

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

export const MEMORIES: readonly MemoryDef[] = [
  {
    id: 'fire',
    chapter: 0,
    title: 'The fire',
    text: 'Three stones, dry stems, a spark struck off my glove. I built this. My hands remembered how before I did.',
    attention: { offsetY: 0.6, range: 8, cone: 0.26 },
  },
  {
    id: 'helmet',
    chapter: 0,
    title: 'Cracked helmet',
    text: 'A long scratch across the visor. Something hit me on the way down, hard enough to knock the morning out of my head.',
    attention: { offsetY: 0.3, range: 6.5, cone: 0.24 },
  },
  {
    id: 'thermos',
    chapter: 0,
    title: 'Dented thermos',
    text: 'Cardamom tea, still faintly warm. Someone packs it for me every single time. “For the cold nights,” she says.',
    attention: { offsetY: 0.15, range: 6.5, cone: 0.24 },
  },
  {
    id: 'patch',
    chapter: 1,
    title: 'Mission patch',
    text: 'SURVEY ONE. A single-seat scout, sent ahead alone to see whether this valley was gentle enough for everyone else.',
    attention: { offsetY: 0.4, range: 6.5, cone: 0.24 },
  },
  {
    id: 'photo',
    chapter: 1,
    title: 'Photograph',
    text: 'Nell, seven years old, missing a front tooth, holding up a drawing of a ringed planet over a valley. She drew this sky before I ever saw it.',
    attention: { offsetY: 0.25, range: 6.5, cone: 0.24 },
  },
  {
    id: 'seeds',
    chapter: 1,
    title: 'Seed tin',
    text: 'Tomatoes, lavender, sunflowers. I promised Nell the first garden here would be hers to name.',
    attention: { offsetY: 0.15, range: 6.5, cone: 0.24 },
  },
  {
    id: 'recorder',
    chapter: 2,
    title: 'Flight recorder',
    text: 'The last entry is my own voice: “Ring-light over the ridge. It’s beautiful down there. Losing altitude, setting her down gentle as I can—” Then nothing.',
    attention: { offsetY: 0.3, range: 7, cone: 0.24 },
  },
  {
    id: 'beacon',
    chapter: 2,
    title: 'Beacon array',
    text: 'The beacon tore loose on impact. It only sent half a message: SITE SAFE. DO NOT— They’ll think something went wrong down here.',
    attention: { offsetY: 1.0, range: 8, cone: 0.26 },
  },
  {
    id: 'ship',
    chapter: 3,
    title: 'Lumen',
    text: 'My ship. Stenciled under the cockpit glass: PILOT M. ILVES. Mara. My name is Mara Ilves.',
    attention: { offsetY: 2.0, range: 24, cone: 0.42 },
  },
  {
    id: 'star',
    chapter: 4,
    title: 'A slow star',
    text: 'It isn’t a star. It’s the Long Morning, three hundred sleepers aboard, sliding toward this valley. One of them is Nell.',
    attention: { offsetY: 0, range: Infinity, cone: 0.14 },
  },
];

export const CHAPTERS: readonly ChapterDef[] = [
  {
    radius: 14,
    hint: 'Something near the fire catches the light.',
    done: ['The dark pulls back a little. A trail of torn ground leads away from camp.'],
  },
  {
    radius: 48,
    hint: 'The torn ground leads away from camp.',
    done: ['There are others coming after me. I need to know how long I’ve been out here.'],
  },
  { radius: 90, hint: 'The scorched trail keeps going.', done: ['The ship. It has to be just ahead.'] },
  {
    radius: 150,
    hint: 'The trail ends at the ship.',
    done: ['I can finish the message from the cockpit. But something up there keeps moving.'],
  },
  {
    radius: 150,
    hint: 'Look up. One of the stars is drifting.',
    done: [
      'I finish the message, letter by letter: SITE SAFE. COME HOME.',
      'They’ll land at dawn. I’ll keep the fire going until then.',
    ],
  },
];

/** First thoughts after waking with no memories. */
export const WAKE_LINES: readonly string[] = [
  'Where… am I? My head is full of static.',
  'The fire is warm. Maybe if I just look at things, really look, it’ll come back.',
];

/** Whispered when the player walks into the edge of what they remember. */
export const EDGE_LINES: readonly string[] = [
  'I don’t remember what’s out there yet.',
  'Not yet. Something nearer first.',
  'The dark feels too heavy to walk into.',
];

export const STILLNESS_LINE = 'Be still for a moment.';
