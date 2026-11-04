/** Interface copy (not story). Speaks to the player in second person; Isi's own voice lives in story.ts. */
export const COPY = {
  title: 'De Espacio-Tiempo',
  act: 'Acto I — Astronauta',
  intro: {
    fresh: 'Despiertas junto a un fuego pequeño. Lo encendiste tú, y lo recuerdas todo.',
    resumed: 'Te quedas dormida junto al fuego. Al despertar, te atreves a mirar un poco más.',
    complete: 'Ya lo miraste todo de frente. El fuego sigue encendido.',
    how: (coarse: boolean) =>
      (coarse
        ? 'Arrastra a la izquierda para caminar y a la derecha para mirar.'
        : 'Camina con WASD, arrastra para mirar alrededor.') +
      ' Para mirar algo de frente, quédate quieta y sostén la mirada en eso.',
    start: 'Despertar',
  },
  hud: {
    countNone: 'Nada mirado de frente todavía',
    count: (n: number, total: number) => `${n} de ${total} mirados de frente`,
    journal: 'Diario',
  },
  card: {
    next: (coarse: boolean) => (coarse ? 'Toca para continuar' : 'Clic o E para continuar'),
    label: 'Continuar',
  },
  journal: {
    title: 'Lo que ya puedo mirar',
    unknown: 'Algo que todavía no me atrevo a mirar.',
    back: 'Volver al valle',
    restart: 'Borrar todo y empezar de nuevo',
  },
  ending: {
    title: 'Por ahora',
    body: 'Isi se queda quieta junto al fuego. Ya mira de frente el medio segundo que la trajo al suelo, y eso no arregla nada. Nadie puede ser astronauta con los pies en la Tierra. El cielo sigue ahí arriba. La pregunta también.',
    wander: 'Seguir caminando',
    restart: 'Empezar de nuevo',
  },
  canvasLabel: 'Un valle alienígena en calma, de noche, iluminado por una hoguera',
} as const;
