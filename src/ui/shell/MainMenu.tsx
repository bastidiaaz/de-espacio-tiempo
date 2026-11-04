import { COPY } from '../../content/copy';
import { SHELL_COPY } from '../../content/shellCopy';
import { useShell } from './ShellContext';

export function MainMenu() {
  const openSelect = useShell((s) => s.openSelect);
  return (
    <div className="veil shell-screen">
      <div className="card">
        <h1>{COPY.title}</h1>
        <button className="primary" autoFocus onClick={openSelect}>
          {SHELL_COPY.selectAct}
        </button>
      </div>
    </div>
  );
}
