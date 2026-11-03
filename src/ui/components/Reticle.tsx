import { useGameState } from '../GameContext';
import './Reticle.css';

const CIRCUMFERENCE = 132;

/** Center dot + the ring that fills while holding attention on a memory. */
export function Reticle() {
  const near = useGameState((s) => s.reticleNear);
  const focus = useGameState((s) => s.focus);
  return (
    <svg id="reticle" className={near ? 'near' : undefined} viewBox="0 0 64 64" aria-hidden="true">
      <circle className="dot" cx="32" cy="32" r="2.2" />
      <circle className="track" cx="32" cy="32" r="21" />
      <circle className="arc" cx="32" cy="32" r="21" style={{ strokeDashoffset: CIRCUMFERENCE * (1 - focus) }} />
    </svg>
  );
}
