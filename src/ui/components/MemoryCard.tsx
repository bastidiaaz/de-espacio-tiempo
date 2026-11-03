import type { KeyboardEvent } from 'react';
import { COPY } from '../../content/copy';
import { isCoarsePointer } from '../../game/platform';
import { useGameActions, useGameState } from '../GameContext';
import './MemoryCard.css';

/** Typed-out memory or thought. Click/tap (or E/Enter) to finish typing or continue. */
export function MemoryCard() {
  const card = useGameState((s) => s.card);
  const visible = useGameState((s) => s.cardVisible);
  const { advanceCard } = useGameActions();
  const className = [visible && 'show', visible && card?.done && 'done'].filter(Boolean).join(' ') || undefined;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      advanceCard();
    }
  };
  return (
    <div
      id="mcard"
      className={className}
      data-kind={card?.kind}
      role="button"
      tabIndex={0}
      aria-label={COPY.card.label}
      onClick={advanceCard}
      onKeyDown={onKeyDown}
    >
      <p id="mtitle">{card?.title}</p>
      <p id="mtext" aria-hidden="true">
        {card?.shown}
      </p>
      <p id="mnext">{COPY.card.next(isCoarsePointer)}</p>
      <span className="sr" aria-live="polite">
        {card ? (card.title ? card.title + '. ' : '') + card.text : ''}
      </span>
    </div>
  );
}
