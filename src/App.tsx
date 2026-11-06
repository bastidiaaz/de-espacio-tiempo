import { useEffect, useState } from 'react';
import { ActHost } from './ActHost';
import { createShellStore } from './state/shellStore';
import { ActSelect } from './ui/shell/ActSelect';
import { MainMenu } from './ui/shell/MainMenu';
import { OptionsPanel } from './ui/shell/OptionsPanel';
import { ShellContext, useShell, useShellStore } from './ui/shell/ShellContext';
import './ui/shell/Shell.css';

/** The shell: main menu → act select → the chosen act. See docs/adr/0001-multi-acto.md. */
export default function App() {
  const [store] = useState(() => createShellStore());
  return (
    <ShellContext.Provider value={store}>
      <Shell />
    </ShellContext.Provider>
  );
}

function Shell() {
  const store = useShellStore();
  const screen = useShell((s) => s.screen);
  const actNumber = useShell((s) => s.actNumber);
  const mountKey = useShell((s) => s.mountKey);
  const textScale = useShell((s) => s.textScale);

  // Every UI font size is in rem: scaling the root scales all text, on top of the browser's own setting.
  useEffect(() => {
    document.documentElement.style.fontSize = textScale === 1 ? '' : `${textScale * 100}%`;
  }, [textScale]);

  // Bubble phase: an act's open overlay (e.g. Act I's journal) handles Escape first, in capture phase.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) store.getState().escape();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [store]);

  if (screen === 'menu') return <MainMenu />;
  if (screen === 'select') return <ActSelect />;
  return (
    <>
      {actNumber !== null && <ActHost key={`${actNumber}-${mountKey}`} number={actNumber} />}
      <OptionsPanel />
    </>
  );
}
