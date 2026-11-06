import type { MouseEvent } from 'react';
import { CHAPTERS, HIDDEN, MEMORIES } from '../../content/story';
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
  const found = useGameState((s) => s.hiddenFound);
  const { debugJumpToChapter, debugJumpToItem, debugCompleteAll, debugJumpToHidden, debugResetHidden } =
    useGameActions();
  return (
    <details id="debug">
      <summary>
        debug · {chapter < CHAPTERS.length ? `cap. ${chapter + 1}` : 'final'} · radio {radius}
        {radius !== radiusTarget ? ` → ${radiusTarget}` : ''} m
      </summary>
      <p className="note">No se guarda nada en este modo.</p>
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
    </details>
  );
}
