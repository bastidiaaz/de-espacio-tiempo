import { useEffect, useRef, useState, type ReactNode } from 'react';
import { actByNumber } from './acts/registry';
import type { ActEngine } from './acts/types';
import { useShell, useShellStore } from './ui/shell/ShellContext';

/**
 * Loads and mounts one act, and disposes it on unmount. Restarting is done by the parent changing
 * this component's `key`. Safe under StrictMode's double effects: a load that resolves after cleanup
 * never mounts.
 */
export function ActHost({ number }: { number: number }) {
  const store = useShellStore();
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ActEngine | null>(null);
  const [ui, setUi] = useState<ReactNode>(null);

  useEffect(() => {
    let cancelled = false;
    let engine: ActEngine | null = null;
    const load = actByNumber(number)?.load;
    if (!load) {
      store.getState().loadFailed();
      return;
    }
    load()
      .then((act) => {
        if (cancelled || !hostRef.current) return;
        const s = store.getState();
        const mounted = act.mount(hostRef.current, {
          settings: { sound: s.sound, retro: s.retro, lookSensitivity: s.lookSensitivity },
          markCompleted: () => store.getState().markCompleted(number),
          exitToMenu: () => store.getState().exitToMenu(),
          restart: () => store.getState().restartAct(),
        });
        engine = engineRef.current = mounted.engine;
        engine.setPaused(store.getState().optionsOpen);
        setUi(mounted.ui);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) store.getState().loadFailed();
      });
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
      setUi(null);
    };
  }, [number, store]);

  const optionsOpen = useShell((s) => s.optionsOpen);
  const sound = useShell((s) => s.sound);
  const retro = useShell((s) => s.retro);
  useEffect(() => engineRef.current?.setPaused(optionsOpen), [optionsOpen]);
  useEffect(() => engineRef.current?.setSound(sound), [sound]);
  useEffect(() => engineRef.current?.setRetro(retro), [retro]);
  const lookSensitivity = useShell((s) => s.lookSensitivity);
  useEffect(() => engineRef.current?.setLookSensitivity(lookSensitivity), [lookSensitivity]);

  return (
    <>
      <div ref={hostRef} />
      {ui}
    </>
  );
}
