import { useGameState } from '../GameContext';
import './Blink.css';

/** Eyes opening: plays once when the player wakes up. */
export function Blink() {
  const awake = useGameState((s) => s.phase !== 'intro');
  return <div id="blink" className={awake ? 'on' : undefined} />;
}
