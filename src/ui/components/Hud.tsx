import { COPY } from '../../content/copy';
import { useGameActions, useGameState } from '../GameContext';
import './Hud.css';

export function Hud({ onOpenJournal }: { onOpenJournal: () => void }) {
  const playing = useGameState((s) => s.phase === 'play');
  const count = useGameState((s) => s.remembered.length);
  const total = useGameState((s) => s.total);
  const sound = useGameState((s) => s.sound);
  const retro = useGameState((s) => s.retro);
  const { toggleSound, toggleRetro } = useGameActions();
  return (
    <div id="hud" hidden={!playing}>
      <div id="count">{count ? COPY.hud.count(count, total) : COPY.hud.countNone}</div>
      <div className="tools">
        <button onClick={onOpenJournal}>{COPY.hud.journal}</button>
        <button aria-pressed={sound} onClick={toggleSound}>
          {COPY.hud.sound}
        </button>
        <button aria-pressed={retro} onClick={toggleRetro}>
          {COPY.hud.pixels}
        </button>
      </div>
    </div>
  );
}
