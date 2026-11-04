import { ACTS } from '../../acts/registry';
import { SHELL_COPY } from '../../content/shellCopy';
import { useShell } from './ShellContext';

/** The tracklist: all six acts; only the ones that exist can be chosen. */
export function ActSelect() {
  const startAct = useShell((s) => s.startAct);
  const backToMenu = useShell((s) => s.backToMenu);
  const loadError = useShell((s) => s.loadError);
  const firstAvailable = ACTS.find((a) => a.available)?.number;
  return (
    <div className="veil shell-screen">
      <div className="card">
        <h2>{SHELL_COPY.selectAct}</h2>
        {loadError && (
          <p className="shell-error" role="alert">
            {SHELL_COPY.loadError}
          </p>
        )}
        <ol className="act-list">
          {ACTS.map((a) => (
            <li key={a.number}>
              <button
                className="act-item"
                disabled={!a.available}
                autoFocus={a.number === firstAvailable}
                onClick={() => startAct(a.number)}
              >
                {SHELL_COPY.actLabel(a.roman, a.title)}
              </button>
            </li>
          ))}
        </ol>
        <button className="quiet" onClick={backToMenu}>
          {SHELL_COPY.back}
        </button>
      </div>
    </div>
  );
}
