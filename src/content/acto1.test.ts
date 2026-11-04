import { describe, expect, it } from 'vitest';
import { validateActo1, acto1Raw } from './acto1Texts';
import { COPY } from './copy';
import { CHAPTERS, EDGE_LINES, EXPECTED_IDS, MEMORIES, STILLNESS_LINE, WAKE_LINES } from './story';

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
    d.capitulos.capitulo5.al_terminar = [];
    delete d.interfaz.hud.diario;
    const p = validateActo1(d, EXPECTED_IDS);
    expect(p).toContain('"memorias.fire.texto" está vacío.');
    expect(p.some((m) => m.startsWith('"capitulos.capitulo5.al_terminar"'))).toBe(true);
    expect(p).toContain('Falta "diario" en "interfaz.hud".');
  });

  it('exige conservar {n} y {total} en el contador', () => {
    const d = clone();
    d.interfaz.hud.contador = 'mirados';
    expect(validateActo1(d, EXPECTED_IDS)).toHaveLength(1);
  });
});

describe('textos cargados (idénticos al contenido original)', () => {
  it('memorias y capítulos', () => {
    expect(MEMORIES).toHaveLength(10);
    expect(MEMORIES[0].title).toBe('El fuego');
    expect(MEMORIES[0].text).toBe(
      'Tres piedras, ramas secas, una chispa contra el guante. Esto sí lo hice yo. Por una vez, no dudé.',
    );
    expect(MEMORIES[6].text).toContain('«Perdiendo altitud. Puedo corregir, puedo—».');
    expect(MEMORIES[9].attention.range).toBe(Infinity);
    expect(CHAPTERS.map((c) => c.radius)).toEqual([14, 48, 90, 150, 150]);
    expect(CHAPTERS[4].done).toHaveLength(3);
    expect(CHAPTERS[3].hint).toBe('El surco termina en la nave.');
  });

  it('líneas sueltas', () => {
    expect(WAKE_LINES).toHaveLength(2);
    expect(EDGE_LINES[0]).toBe('Todavía no. Eso no.');
    expect(STILLNESS_LINE).toBe('Quédate quieta un momento.');
  });

  it('COPY', () => {
    expect(COPY.title).toBe('De Espacio-Tiempo');
    expect(COPY.act).toBe('Acto I — Astronauta');
    expect(COPY.hud.count(3, 10)).toBe('3 de 10 mirados de frente');
    expect(COPY.intro.how(true)).toBe(
      'Arrastra a la izquierda para caminar y a la derecha para mirar. Para mirar algo de frente, quédate quieta y sostén la mirada en eso.',
    );
    expect(COPY.intro.how(false)).toBe(
      'Camina con WASD, arrastra para mirar alrededor. Para mirar algo de frente, quédate quieta y sostén la mirada en eso.',
    );
    expect(COPY.card.next(false)).toBe('Clic o E para continuar');
  });
});
