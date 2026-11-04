import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { ShellState, ShellStore } from '../../state/shellStore';

export const ShellContext = createContext<ShellStore | null>(null);

export const useShellStore = (): ShellStore => {
  const store = useContext(ShellContext);
  if (!store) throw new Error('ShellContext is missing. Render inside <App />.');
  return store;
};

/** Subscribe to one slice of the shell state. Return primitives or stable references (actions are stable). */
export function useShell<T>(selector: (s: ShellState) => T): T {
  return useStore(useShellStore(), selector);
}
