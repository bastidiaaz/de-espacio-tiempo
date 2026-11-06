import { describe, expect, it } from 'vitest';
import { validateActo1, acto1Raw } from './acto1Texts';
import { COPY } from './copy';
import {
  CAMPFIRE_CHAPTER,
  CHAPTERS,
  EDGE_LINES,
  EXPECTED_IDS,
  HIDDEN,
  MEMORIES,
  STILLNESS_LINE,
  WAKE_LINES,
} from './story';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clone = (): any => JSON.parse(JSON.stringify(acto1Raw));

describe('acto1.json', () => {
  it('no tiene problemas (ids completos, sin textos vacíos)', () => {
    const problems = validateActo1(acto1Raw, EXPECTED_IDS);
    expect(problems, `Problemas en src/content/acto1.json:\n- ${problems.join('\n- ')}`).toEqual([]);
  });

  it('avisa qué memoria falta', () => {
    const d = clone();
    delete d.memorias.helmet;
    expect(validateActo1(d, EXPECTED_IDS)).toEqual(['Falta "helmet" en "memorias".']);
  });

  it('avisa qué id sobra', () => {
    const d = clone();
    d.memorias.cohete = { titulo: 'x', texto: 'y' };
    d.capitulos.capitulo9 = { pista: 'x', al_terminar: ['y'] };
    const p = validateActo1(d, EXPECTED_IDS);
    expect(p).toContain('Sobra "cohete" en "memorias": el juego no sabe dónde usarlo.');
    expect(p).toContain('Sobra "capitulo9" en "capitulos": el juego no sabe dónde usarlo.');
  });

  it('avisa de textos vacíos y de claves de interfaz faltantes', () => {
    const d = clone();
    d.memorias.fire.texto = '   ';
    d.capitulos.capitulo5.al_terminar = ['  '];
    delete d.interfaz.hud.diario;
    const p = validateActo1(d, EXPECTED_IDS);
    expect(p).toContain('"memorias.fire.texto" está vacío.');
    expect(p).toContain('"capitulos.capitulo5.al_terminar[1]" está vacío.');
    expect(p).toContain('Falta "diario" en "interfaz.hud".');
  });

  it('al_terminar de un capítulo puede quedar vacío', () => {
    const d = clone();
    d.capitulos.capitulo5.al_terminar = [];
    expect(validateActo1(d, EXPECTED_IDS)).toEqual([]);
  });

  it('avisa qué oculto falta o sobra', () => {
    const d = clone();
    delete d.ocultos.guitar;
    d.ocultos.cohete = { titulo: 'x', texto: 'y' };
    const p = validateActo1(d, EXPECTED_IDS);
    expect(p).toContain('Falta "guitar" en "ocultos".');
    expect(p).toContain('Sobra "cohete" en "ocultos": el juego no sabe dónde usarlo.');
  });

  it('exige conservar {n} y {total} en el contador', () => {
    const d = clone();
    d.interfaz.hud.contador = 'mirados';
    expect(validateActo1(d, EXPECTED_IDS)).toHaveLength(1);
  });
});

// Comprueba que cada texto del JSON llega a su lugar. Compara contra el propio
// JSON (no contra frases fijas) para que el autor pueda reescribir sin romper tests.
describe('textos cargados (cableados desde acto1.json)', () => {
  const raw = acto1Raw;

  it('memorias y capítulos', () => {
    expect(MEMORIES).toHaveLength(11);
    expect(MEMORIES.map((m) => m.id).slice(8)).toEqual(['ship', 'campfire', 'star']);
    expect(MEMORIES.find((m) => m.id === 'campfire')!.chapter).toBe(CAMPFIRE_CHAPTER);
    for (const m of MEMORIES) {
      expect(m.title).toBe(raw.memorias[m.id].titulo);
      expect(m.text).toBe(raw.memorias[m.id].texto);
    }
    expect(MEMORIES[10].attention.range).toBe(Infinity);
    expect(CHAPTERS.map((c) => c.radius)).toEqual([14, 48, 90, 150, 150, 150]);
    expect(raw.capitulos.capitulo4.al_terminar.at(-1)).toBe(
      'Tengo mucho en mi cabeza. Necesito sentarme a reordenar mis ideas...',
    );
    CHAPTERS.forEach((c, i) => {
      const ch = raw.capitulos[`capitulo${i + 1}` as keyof typeof raw.capitulos];
      expect(c.hint).toBe(ch.pista);
      expect(c.done).toEqual(ch.al_terminar);
    });
  });

  it('ocultos', () => {
    expect(HIDDEN.map((h) => h.id)).toEqual(Object.keys(raw.ocultos));
    for (const h of HIDDEN) {
      expect(h.title).toBe(raw.ocultos[h.id].titulo);
      expect(h.text).toBe(raw.ocultos[h.id].texto);
    }
  });

  it('líneas sueltas', () => {
    expect(WAKE_LINES).toEqual(raw.voz_de_isi.al_despertar);
    expect(EDGE_LINES).toEqual(raw.voz_de_isi.al_llegar_al_borde);
    expect(STILLNESS_LINE).toBe(raw.voz_de_isi.quedarse_quieta);
  });

  it('COPY', () => {
    const ui = raw.interfaz;
    expect(COPY.title).toBe(ui.titulo);
    expect(COPY.act).toBe(ui.acto);
    expect(COPY.hud.count(3, 10)).toBe(ui.hud.contador.replace('{n}', '3').replace('{total}', '10'));
    expect(COPY.intro.how(true)).toBe(`${ui.intro.como_jugar_tactil} ${ui.intro.como_jugar_final}`);
    expect(COPY.intro.how(false)).toBe(`${ui.intro.como_jugar_teclado} ${ui.intro.como_jugar_final}`);
    expect(COPY.card.next(false)).toBe(ui.tarjeta.continuar_teclado);
    expect(COPY.ending.title).toBe(ui.final.titulo);
    expect(COPY.ending.invite).toBe(ui.final.invitacion);
    expect(COPY.ending.listen).toBe(ui.final.escuchar);
    expect(COPY.ending.listenUrl).toBe('https://ffm.to/tiann-astronauta');
  });
});
