import { SHELL_COPY } from '../../content/shellCopy';
import { useShell } from './ShellContext';

/** Options button (touch-friendly) + panel. Opening it pauses the act (ActHost syncs `optionsOpen`). */
export function OptionsPanel() {
  const open = useShell((s) => s.optionsOpen);
  const sound = useShell((s) => s.sound);
  const retro = useShell((s) => s.retro);
  const setOptionsOpen = useShell((s) => s.setOptionsOpen);
  const toggleSound = useShell((s) => s.toggleSound);
  const toggleRetro = useShell((s) => s.toggleRetro);
  const exitToMenu = useShell((s) => s.exitToMenu);
  return (
    <>
      <button className="options-button" hidden={open} onClick={() => setOptionsOpen(true)}>
        {SHELL_COPY.options}
      </button>
      {open && (
        <div className="veil shell-screen" role="dialog" aria-modal="true" aria-label={SHELL_COPY.options}>
          <div className="card">
            <h2>{SHELL_COPY.options}</h2>
            <button className="primary" autoFocus onClick={() => setOptionsOpen(false)}>
              {SHELL_COPY.resume}
            </button>
            <div className="options-toggles">
              <button className="quiet" aria-pressed={sound} onClick={toggleSound}>
                {SHELL_COPY.sound}
              </button>
              <button className="quiet" aria-pressed={retro} onClick={toggleRetro}>
                {SHELL_COPY.pixels}
              </button>
            </div>
            <button className="quiet" onClick={exitToMenu}>
              {SHELL_COPY.toMenu}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
