import { useGameState } from '../GameContext';
import './Whisper.css';

/** Short inner-monologue lines under the reticle (hints, edge of the world, "be still"). */
export function Whisper() {
  const text = useGameState((s) => s.whisper);
  const visible = useGameState((s) => s.whisperVisible);
  return (
    <div id="whisper" className={visible ? 'show' : undefined} aria-live="polite">
      {text}
    </div>
  );
}
