import { useGameState } from '../GameContext';
import './Fade.css';

/** Short fade to black, used instead of camera motion with reduced motion (DIS-07). */
export function Fade() {
  const on = useGameState((s) => s.fade);
  return <div id="fade" className={on ? 'on' : undefined} />;
}
