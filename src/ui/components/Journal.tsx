import { useEffect, useRef } from 'react';
import { COPY } from '../../content/copy';
import { MEMORIES } from '../../content/story';
import { useGameActions, useGameState } from '../GameContext';
import './Journal.css';

/** Every memory in story order; unrecalled ones stay hidden. */
export function Journal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const remembered = useGameState((s) => s.remembered);
  const { restart } = useGameActions();
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) backRef.current?.focus();
  }, [open]);
  // Capture phase: runs before the shell's Escape handler, which skips handled (defaultPrevented) events.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onClose();
    };
    addEventListener('keydown', onKey, true);
    return () => removeEventListener('keydown', onKey, true);
  }, [open, onClose]);
  return (
    <div id="journal" hidden={!open}>
      <div className="card">
        <h2>{COPY.journal.title}</h2>
        <ul id="jlist">
          {MEMORIES.map((m) =>
            remembered.includes(m.id) ? (
              <li key={m.id}>
                <b>{m.title}</b>
                <p>{m.text}</p>
              </li>
            ) : (
              <li key={m.id} className="lost">
                <p>{COPY.journal.unknown}</p>
              </li>
            ),
          )}
        </ul>
        <button ref={backRef} className="primary" onClick={onClose}>
          {COPY.journal.back}
        </button>
        <button className="quiet" onClick={restart}>
          {COPY.journal.restart}
        </button>
      </div>
    </div>
  );
}
