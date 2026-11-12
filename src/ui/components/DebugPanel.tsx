import { useState, type MouseEvent } from 'react';
import { CHAPTERS, HIDDEN, MEMORIES } from '../../content/story';
import type { MixState } from '../../game/systems/mix';
import { useGameActions, useGameState } from '../GameContext';
import './DebugPanel.css';

/** Give focus back to the game so Enter/WASD don't re-trigger the button. */
const blur = (e: MouseEvent<HTMLButtonElement>) => e.currentTarget.blur();

/**
 * `#debug` only (ENG-03). Developer tool, not in-game text: its labels stay here, not in src/content.
 * Nothing done from here is saved.
 */
export function DebugPanel() {
  const chapter = useGameState((s) => s.debugChapter);
  const radius = useGameState((s) => s.debugRadius);
  const radiusTarget = useGameState((s) => s.debugRadiusTarget);
  const band = useGameState((s) => s.debugBand);
  const found = useGameState((s) => s.hiddenFound);
  const { debugJumpToChapter, debugJumpToItem, debugCompleteAll, debugJumpToHidden, debugJumpToMirador, debugResetHidden, debugAudio, debugPlayChorus } =
    useGameActions();
  // What the panel forces on the audio mix (AUD-03, AUD-06). Local: the engine only needs the result.
  const [mix, setMix] = useState<Partial<MixState>>({});
  const force = (next: Partial<MixState>) => {
    setMix(next);
    debugAudio(Object.keys(next).length ? next : null);
  };
  /** Sets `patch` on top of what is forced, or takes those keys back out if `on` is false. */
  const toggle = (patch: Partial<MixState>, on: boolean) => {
    const next = { ...mix, ...patch };
    if (!on) for (const k of Object.keys(patch) as (keyof MixState)[]) delete next[k];
    force(next);
  };
  const layers = mix.freeRoam ? 'libre' : (mix.chapter ?? 'auto');
  return (
    <details id="debug">
      <summary>
        debug · {chapter < CHAPTERS.length ? `cap. ${chapter + 1}` : 'final'} · radio {radius}
        {radius !== radiusTarget ? ` → ${radiusTarget}` : ''} m
      </summary>
      <p className="note">No se guarda nada en este modo.</p>
      <p className="note">
        Borde: tope en naranjo, franja oscura de {band} m desde el anillo azul.
      </p>
      <h3>Capítulo</h3>
      <div className="row">
        {CHAPTERS.map((_, c) => (
          <button
            key={c}
            aria-pressed={c === chapter}
            onClick={(e) => {
              blur(e);
              debugJumpToChapter(c);
            }}
          >
            {c + 1}
          </button>
        ))}
      </div>
      <h3>Ítem (quedas frente a él)</h3>
      <ul>
        {MEMORIES.map((m) => (
          <li key={m.id}>
            <button
              onClick={(e) => {
                blur(e);
                debugJumpToItem(m.id);
              }}
            >
              <span className="chap">{m.chapter + 1}</span> {m.title}
            </button>
          </li>
        ))}
      </ul>
      <button
        className="all"
        onClick={(e) => {
          blur(e);
          debugCompleteAll();
        }}
      >
        Marcar todo → final
      </button>
      <h3>Audio: capas del capítulo</h3>
      <div className="row">
        <button
          aria-pressed={layers === 'auto'}
          onClick={(e) => {
            blur(e);
            toggle({ chapter: 0, freeRoam: false }, false);
          }}
        >
          auto
        </button>
        {CHAPTERS.map((_, c) => (
          <button
            key={c}
            aria-pressed={layers === c}
            onClick={(e) => {
              blur(e);
              toggle({ chapter: c, freeRoam: false }, true);
            }}
          >
            {c + 1}
          </button>
        ))}
        <button
          aria-pressed={layers === 'libre'}
          onClick={(e) => {
            blur(e);
            toggle({ chapter: CHAPTERS.length, freeRoam: true }, true);
          }}
        >
          libre
        </button>
      </div>
      <h3>Audio: viento y silencio</h3>
      <div className="row">
        {(
          [
            ['silencio', { silence: 'wind' }],
            ['contenido', { silence: 'hush' }],
            ['mirador', { windZone: 1 }],
            ['borde', { edge: 1 }],
          ] as const
        ).map(([label, patch]) => {
          const on = (Object.keys(patch) as (keyof MixState)[]).every(
            (k) => mix[k] === (patch as Partial<MixState>)[k],
          );
          return (
            <button
              key={label}
              aria-pressed={on}
              onClick={(e) => {
                blur(e);
                toggle(patch, !on);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <h3>Ocultos (paseo libre)</h3>
      <ul>
        {HIDDEN.map((h) => (
          <li key={h.id}>
            <button
              onClick={(e) => {
                blur(e);
                debugJumpToHidden(h.id);
              }}
            >
              <span className="chap">{found.includes(h.id) ? '✓' : '·'}</span> {h.title}
            </button>
          </li>
        ))}
      </ul>
      <button
        className="all"
        onClick={(e) => {
          blur(e);
          debugResetHidden();
        }}
      >
        Olvidar ocultos ({found.length}/{HIDDEN.length})
      </button>
      <h3>Mirador (paseo libre)</h3>
      <div className="row">
        <button
          onClick={(e) => {
            blur(e);
            debugJumpToMirador('foot');
          }}
        >
          Al pie
        </button>
        <button
          onClick={(e) => {
            blur(e);
            debugJumpToMirador('summit');
          }}
        >
          A la cima
        </button>
      </div>
      <h3>Sonido</h3>
      <button
        className="all"
        onClick={(e) => {
          blur(e);
          debugPlayChorus();
        }}
      >
        Escuchar el coro (AUD-01)
      </button>
    </details>
  );
}
