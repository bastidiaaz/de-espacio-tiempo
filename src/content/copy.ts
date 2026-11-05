/**
 * Interface copy (not story). Speaks to the player in second person; Isi's own voice lives in story.ts.
 * Los textos viven en `acto1.json` (sección "interfaz"); aquí solo se ensamblan.
 */
import { ACTO1_TEXTS } from './story';

const ui = ACTO1_TEXTS.interfaz;

/** Where the ending invites the player to listen to the song (DIS-07). A link, not prose. */
const LISTEN_URL = 'https://ffm.to/tiann-astronauta';

export const COPY = {
  title: ui.titulo,
  act: ui.acto,
  intro: {
    fresh: ui.intro.primera_vez,
    resumed: ui.intro.retomando,
    complete: ui.intro.completo,
    how: (coarse: boolean) =>
      `${coarse ? ui.intro.como_jugar_tactil : ui.intro.como_jugar_teclado} ${ui.intro.como_jugar_final}`,
    start: ui.intro.boton_empezar,
  },
  hud: {
    countNone: ui.hud.nada_mirado,
    count: (n: number, total: number) =>
      ui.hud.contador.replace('{n}', String(n)).replace('{total}', String(total)),
    journal: ui.hud.diario,
  },
  card: {
    next: (coarse: boolean) => (coarse ? ui.tarjeta.continuar_tactil : ui.tarjeta.continuar_teclado),
    label: ui.tarjeta.etiqueta_boton,
  },
  journal: {
    title: ui.diario.titulo,
    unknown: ui.diario.desconocido,
    back: ui.diario.volver,
    restart: ui.diario.reiniciar,
  },
  ending: {
    title: ui.final.titulo,
    body: ui.final.cuerpo,
    wander: ui.final.seguir_caminando,
    restart: ui.final.reiniciar,
    invite: ui.final.invitacion,
    listen: ui.final.escuchar,
    listenUrl: LISTEN_URL,
  },
  canvasLabel: ui.etiqueta_del_lienzo,
};
