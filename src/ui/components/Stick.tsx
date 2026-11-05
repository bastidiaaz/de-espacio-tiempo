import { useGameState } from '../GameContext';
import './Stick.css';

/** Floating virtual joystick shown where the left thumb lands. */
export function Stick() {
  const s = useGameState((st) => st.stick);
  const seated = useGameState((st) => st.seated);
  return (
    <div id="stick" style={{ display: s.active && !seated ? 'block' : 'none', left: s.x, top: s.y }}>
      <div id="knob" style={{ transform: s.dx || s.dy ? `translate(${s.dx}px,${s.dy}px)` : undefined }} />
    </div>
  );
}
