import { actEvent, track } from '../../analytics';
import { COPY } from '../../content/copy';
import { useGameActions, useGameState } from '../GameContext';
import './Ending.css';

export function Ending() {
  const visible = useGameState((s) => s.endingVisible);
  const { keepWandering, restart } = useGameActions();
  return (
    <div id="ending" className={visible ? 'veil' : 'veil gone'}>
      <div className="card">
        <h1>{COPY.ending.title}</h1>
        <p className="lede">{COPY.ending.body}</p>
        <button className="primary" onClick={keepWandering}>
          {COPY.ending.wander}
        </button>
        <button className="quiet" onClick={restart}>
          {COPY.ending.restart}
        </button>
        <div className="invite">
          <p>{COPY.ending.invite}</p>
          <a
            className="quiet"
            href={COPY.ending.listenUrl}
            target="_blank"
            rel="noopener"
            onClick={() => track(actEvent(1, 'escuchar'))}
          >
            {COPY.ending.listen}
          </a>
        </div>
      </div>
    </div>
  );
}
