import { SHELL_COPY } from '../../content/shellCopy';
import { LOOK_LEVELS, TEXT_LEVELS } from '../../state/accessibility';
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
  const lookSensitivity = useShell((s) => s.lookSensitivity);
  const textScale = useShell((s) => s.textScale);
  const setLookSensitivity = useShell((s) => s.setLookSensitivity);
  const setTextScale = useShell((s) => s.setTextScale);
  const lookIndex = Math.max(0, LOOK_LEVELS.indexOf(lookSensitivity as (typeof LOOK_LEVELS)[number]));
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
            <label className="options-field">
              <span className="options-label">
                {SHELL_COPY.lookSensitivity}
                <span className="options-value">{SHELL_COPY.lookValue(lookSensitivity)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={LOOK_LEVELS.length - 1}
                step={1}
                value={lookIndex}
                aria-valuetext={SHELL_COPY.lookValue(lookSensitivity)}
                onChange={(e) => setLookSensitivity(LOOK_LEVELS[Number(e.target.value)])}
              />
            </label>
            <fieldset className="options-field">
              <legend className="options-label">{SHELL_COPY.textSize}</legend>
              <div className="options-segmented">
                {TEXT_LEVELS.map((level) => (
                  <button
                    key={level}
                    className="quiet"
                    aria-pressed={textScale === level}
                    onClick={() => setTextScale(level)}
                  >
                    {SHELL_COPY.textSizes[level]}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="quiet" onClick={exitToMenu}>
              {SHELL_COPY.toMenu}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
