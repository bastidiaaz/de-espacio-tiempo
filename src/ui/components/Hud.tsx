import { COPY } from '../../content/copy';
import { useGameState } from '../GameContext';
import './Hud.css';

export function Hud({ onOpenJournal }: { onOpenJournal: () => void }) {
  const playing = useGameState((s) => s.phase === 'play');
  const count = useGameState((s) => s.remembered.length);
  const total = useGameState((s) => s.total);
  return (
    <div id="hud" hidden={!playing}>
      <div id="count">{count ? COPY.hud.count(count, total) : COPY.hud.countNone}</div>
      <div className="tools">
        <button onClick={onOpenJournal}>{COPY.hud.journal}</button>
      </div>
    </div>
  );
}
