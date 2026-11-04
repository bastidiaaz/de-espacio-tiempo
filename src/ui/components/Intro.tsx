import { COPY } from '../../content/copy';
import { isCoarsePointer } from '../../game/platform';
import { useGameActions, useGameState } from '../GameContext';

export function Intro() {
  const gone = useGameState((s) => s.phase !== 'intro');
  const lede = useGameState((s) => s.introLede);
  const { wake } = useGameActions();
  return (
    <div id="intro" className={gone ? 'veil gone' : 'veil'}>
      <div className="card">
        <h1>{COPY.title}</h1>
        <p className="act">{COPY.act}</p>
        <p className="lede">{lede}</p>
        <p className="how">{COPY.intro.how(isCoarsePointer)}</p>
        <button className="primary" onClick={wake}>
          {COPY.intro.start}
        </button>
      </div>
    </div>
  );
}
