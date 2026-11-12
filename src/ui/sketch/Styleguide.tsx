import { useEffect, useState } from 'react';
import { TEXT_LEVELS } from '../../state/accessibility';
import { BoilFilters } from './BoilFilters';
import { SketchButton, SketchPanel, SketchRule, SketchStar } from './Sketch';
import './Styleguide.css';

/**
 * Test page of the sketch UI (ART-01), served at /estilo.html. It is how the author approves the
 * direction on a phone, so it is laid out for a phone and shows the real tokens, not copies.
 * The sample copy is filler: in-game text is written by the author.
 */

const COLORS = [
  ['--sk-black', 'Negro de la portada. Fondo.'],
  ['--sk-line', 'La línea. Texto y trazo.'],
  ['--sk-line-soft', 'Texto secundario.'],
  ['--sk-line-faint', 'Solo decorativo.'],
  ['--sk-panel', 'Relleno de paneles sobre el mundo 3D.'],
  ['--sk-gaze', 'Destello de la mirada. Solo para el foco.'],
] as const;

const SPACES = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-7'] as const;
const STROKES = ['--stroke-thin', '--stroke', '--stroke-bold'] as const;
const BOIL_MODES = [
  ['on', 'Hierve'],
  ['still', 'Quieto'],
  ['off', 'Sin filtro'],
] as const;
const GLYPHS = '¿Qué? ¡Sí! «ñandú» · áéíóú ü Ñ';
const PANGRAM = 'El veloz murciélago hindú comía feliz cardillo y kiwi.';

export function Styleguide() {
  const [scale, setScale] = useState<number>(1);
  const [boil, setBoil] = useState<(typeof BOIL_MODES)[number][0]>('on');

  // Same mechanism as the game (ENG-09), but local to this page: nothing is saved.
  useEffect(() => {
    document.documentElement.style.fontSize = scale === 1 ? '' : `${scale * 100}%`;
  }, [scale]);
  useEffect(() => {
    document.documentElement.dataset.boil = boil;
  }, [boil]);

  return (
    <main className="sg">
      <BoilFilters />

      <header className="sg-cover">
        <SketchStar className="sg-star sg-star--a" />
        <SketchStar className="sg-star sg-star--b" />
        <SketchStar className="sg-star sg-star--c" />
        <SketchStar className="sg-star sg-star--d" />
        <h1 className="sk-title sk-title--lg">De Espacio-Tiempo</h1>
        <SketchRule className="sg-cover-rule" />
        <p className="sk-hand sk-hand--lg">Acto I — Astronauta</p>
        <p className="sk-label">Página de prueba · ART-01</p>
      </header>

      <section className="sg-section" aria-labelledby="sg-ajustes">
        <h2 id="sg-ajustes" className="sk-label">
          Ajustes de esta página
        </h2>
        <div className="sg-row" role="group" aria-label="Tamaño de texto">
          {TEXT_LEVELS.map((level) => (
            <SketchButton
              key={level}
              tone={scale === level ? 'solid' : 'outline'}
              aria-pressed={scale === level}
              onClick={() => setScale(level)}
            >
              {Math.round(level * 100)} %
            </SketchButton>
          ))}
        </div>
        <div className="sg-row" role="group" aria-label="Trazo">
          {BOIL_MODES.map(([mode, label]) => (
            <SketchButton
              key={mode}
              tone={boil === mode ? 'solid' : 'outline'}
              aria-pressed={boil === mode}
              onClick={() => setBoil(mode)}
            >
              {label}
            </SketchButton>
          ))}
        </div>
        <p className="sk-text sk-text--sm sk-text--soft">
          El tamaño es la opción de texto del juego. «Quieto» es lo que ve quien pide menos movimiento en su teléfono.
        </p>
      </section>

      <section className="sg-section" aria-labelledby="sg-tipos">
        <h2 id="sg-tipos" className="sk-label">
          Tipografías
        </h2>

        <div className="sg-specimen">
          <p className="sk-label">Belleza · títulos</p>
          <p className="sk-title sk-title--lg">Astronauta</p>
          <p className="sk-title">Título mediano</p>
          <p className="sk-title sk-title--sm">Título pequeño · {GLYPHS}</p>
        </div>

        <div className="sg-specimen">
          <p className="sk-label">Caveat · lo que Isi escribe a mano</p>
          <p className="sk-hand sk-hand--lg">Acto I — Astronauta</p>
          <p className="sk-hand">{PANGRAM}</p>
          <p className="sk-hand sk-hand--sm">{GLYPHS} · 0123456789</p>
        </div>

        <div className="sg-specimen">
          <p className="sk-label">Glacial Indifference · texto</p>
          <p className="sk-text">{PANGRAM} Texto de relleno para medir el párrafo en el teléfono.</p>
          <p className="sk-text">
            <em>Cursiva real: {PANGRAM}</em>
          </p>
          <p className="sk-text">
            <strong>Negrita: {GLYPHS}</strong>
          </p>
          <p className="sk-text sk-text--sm sk-text--soft">Texto pequeño y secundario · 0123456789</p>
        </div>
      </section>

      <section className="sg-section" aria-labelledby="sg-color">
        <h2 id="sg-color" className="sk-label">
          Color
        </h2>
        <ul className="sg-list">
          {COLORS.map(([token, use]) => (
            <li key={token} className="sg-swatch">
              <span className="sg-chip" style={{ background: `var(${token})` }} />
              <span>
                <code className="sg-code">{token}</code>
                <span className="sk-text sk-text--sm sk-text--soft sg-block">{use}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sg-section" aria-labelledby="sg-trazo">
        <h2 id="sg-trazo" className="sk-label">
          Trazo
        </h2>
        <ul className="sg-list">
          {STROKES.map((token) => (
            <li key={token} className="sg-stroke">
              <code className="sg-code">{token}</code>
              <span style={{ ['--stroke' as string]: `var(${token})` }}>
                <SketchRule />
              </span>
            </li>
          ))}
        </ul>
        <div className="sg-stars">
          <SketchStar />
          <span style={{ ['--star' as string]: '2.75rem' }}>
            <SketchStar />
          </span>
          <span style={{ ['--star' as string]: '1.1rem' }}>
            <SketchStar />
          </span>
          <span className="sk-hand sk-boil-soft">también hierve la letra, suave</span>
        </div>
      </section>

      <section className="sg-section" aria-labelledby="sg-botones">
        <h2 id="sg-botones" className="sk-label">
          Botones
        </h2>
        <SketchButton tone="solid" block variant={0}>
          Acción principal
        </SketchButton>
        <SketchButton block variant={2}>
          Otra acción
        </SketchButton>
        <SketchButton block disabled>
          No disponible
        </SketchButton>
        <SketchButton tone="bare">Volver</SketchButton>
      </section>

      <section className="sg-section" aria-labelledby="sg-tarjeta">
        <h2 id="sg-tarjeta" className="sk-label">
          Tarjeta
        </h2>
        <SketchPanel className="sg-card" variant={0}>
          <p className="sk-label">Etiqueta</p>
          <h3 className="sk-title">Título de ejemplo</h3>
          <p className="sk-text">
            Texto de relleno. El texto real lo escribe el autor; aquí solo se mide cómo cae un párrafo dentro del marco.
          </p>
          <SketchButton tone="solid" block>
            Seguir
          </SketchButton>
        </SketchPanel>

        <SketchPanel className="sg-card sg-world" variant={1}>
          <p className="sk-label">Sobre el mundo 3D</p>
          <p className="sk-hand">Una nota a mano, de relleno, para ver Caveat dentro del marco.</p>
          <SketchRule className="sg-short-rule" />
          <p className="sk-text sk-text--sm sk-text--soft">El fondo imita los colores del valle de noche.</p>
        </SketchPanel>
      </section>

      <section className="sg-section" aria-labelledby="sg-espacio">
        <h2 id="sg-espacio" className="sk-label">
          Espaciado
        </h2>
        <ul className="sg-list">
          {SPACES.map((token) => (
            <li key={token} className="sg-space">
              <code className="sg-code">{token}</code>
              <span className="sg-bar" style={{ width: `var(${token})` }} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
