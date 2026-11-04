/**
 * Narrative content. Pure data: writers can edit this file without touching the engine.
 * Order matters: MEMORIES order is the journal order.
 *
 * Act I ("Astronauta"). Isi remembers everything; what she cannot do is look at it
 * head-on. Holding your gaze on something is daring to admit a truth she already knows,
 * and the radius that grows is fear receding, not memory returning.
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
    title: 'El fuego',
    text: 'Tres piedras, ramas secas, una chispa contra el guante. Esto sí lo hice yo. Por una vez, no dudé.',
    attention: { offsetY: 0.6, range: 8, cone: 0.26 },
  },
  {
    id: 'helmet',
    chapter: 0,
    title: 'El casco rayado',
    text: 'El rayón ya estaba aquí antes de caer. Este casco vivió años guardado en una caja, listo para un viaje que yo seguía posponiendo.',
    attention: { offsetY: 0.3, range: 6.5, cone: 0.24 },
  },
  {
    id: 'thermos',
    chapter: 0,
    title: 'El termo abollado',
    text: 'Cardamomo, para las noches frías. Me lo preparo yo misma, cada vez, como si alguien más fuera a tomarlo conmigo.',
    attention: { offsetY: 0.15, range: 6.5, cone: 0.24 },
  },
  {
    id: 'patch',
    chapter: 1,
    title: 'La insignia',
    text: 'SURVEY ONE. La cosí yo misma, para una misión que me inventé, para tener por fin una excusa con la que partir.',
    attention: { offsetY: 0.4, range: 6.5, cone: 0.24 },
  },
  {
    id: 'photo',
    chapter: 1,
    title: 'La fotografía',
    text: 'Yo, mucho más joven, mirando la cámara sin miedo. Antes de empezar a temerle al cielo que todavía no me atrevo a cruzar.',
    attention: { offsetY: 0.25, range: 6.5, cone: 0.24 },
  },
  {
    id: 'seeds',
    chapter: 1,
    title: 'El transmisor',
    text: 'Grabé cien mensajes dirigidos a quien fuera que estuviera escuchando. Ninguno volvió con respuesta. Seguí grabando igual.',
    attention: { offsetY: 0.15, range: 6.5, cone: 0.24 },
  },
  {
    id: 'recorder',
    chapter: 2,
    title: 'Registro de vuelo',
    text: 'Mi propia voz en la última entrada: «Perdiendo altitud. Puedo corregir, puedo—». Y después, silencio. No terminé la frase. Tampoco terminé la maniobra.',
    attention: { offsetY: 0.3, range: 7, cone: 0.24 },
  },
  {
    id: 'beacon',
    chapter: 2,
    title: 'Pieza del motor',
    text: 'El polvo se acumuló justo aquí, en el encendido que debía responder a tiempo. Dudé medio segundo. Fue suficiente.',
    attention: { offsetY: 1.0, range: 8, cone: 0.26 },
  },
  {
    id: 'ship',
    chapter: 3,
    title: 'Mi nave',
    text: 'Bajo el cristal de la cabina, estampado a mano: ISI. Aquí fue. Un pie todavía en la Tierra, cuando ya estaba en el aire.',
    attention: { offsetY: 2.0, range: 24, cone: 0.42 },
  },
  {
    id: 'star',
    chapter: 4,
    title: 'Una estrella lenta',
    text: 'No hay más que decir, y lo sé desde el primer día. Dudé. Eso fue todo. Eso fue suficiente para caer.',
    attention: { offsetY: 0, range: Infinity, cone: 0.14 },
  },
];

export const CHAPTERS: readonly ChapterDef[] = [
  {
    radius: 14,
    hint: 'Algo junto al fuego espera que lo mires.',
    done: ['La oscuridad cede un poco. Un surco de tierra abierta se aleja del campamento.'],
  },
  {
    radius: 48,
    hint: 'El surco se aleja del campamento. Lo que dejé por el camino todavía está ahí.',
    done: ['Todo esto lo preparé durante años. Nada de esto explica todavía por qué estoy en el suelo.'],
  },
  {
    radius: 90,
    hint: 'El surco quemado continúa. Lo que pasó en el descenso empieza a tener sonido.',
    done: ['Ya sé dónde buscar el resto. La nave tiene que estar justo delante.'],
  },
  {
    radius: 150,
    hint: 'El surco termina en la nave.',
    done: ['Aquí fue. Y todavía no me atrevo a decirlo completo. Algo allá arriba se mueve despacio.'],
  },
  {
    radius: 150,
    hint: 'Mira al cielo, aunque duela.',
    done: [
      'Nadie puede ser astronauta con los pies en la Tierra.',
      'Lo sé ahora. No sé todavía qué hacer con eso.',
      'Por ahora vuelvo al fuego y me quedo quieta.',
    ],
  },
];

/** First thoughts on waking by the fire, before she dares to look at anything. */
export const WAKE_LINES: readonly string[] = [
  'Otra vez aquí. El fuego, y la misma pregunta de siempre.',
  'Si me quedo quieta, tal vez por fin pueda mirarlo de frente.',
];

/** Whispered when the player walks into the edge of what she dares to look at. */
export const EDGE_LINES: readonly string[] = [
  'Todavía no. Eso no.',
  'El miedo pesa más que la curiosidad, por ahora.',
  'Hay algo más cerca que sí puedo mirar.',
];

export const STILLNESS_LINE = 'Quédate quieta un momento.';
