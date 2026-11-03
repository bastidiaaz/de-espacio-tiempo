import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { GameActions, GameStore, GameUiState } from '../state/gameStore';

export interface GameContextValue {
  store: GameStore;
  actions: GameActions;
}

export const GameContext = createContext<GameContextValue | null>(null);

const useGameContext = (): GameContextValue => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('GameContext is missing. Render inside <App />.');
  return ctx;
};

/** Subscribe to one slice of the engine's UI state. Return primitives or stable references. */
export function useGameState<T>(selector: (s: GameUiState) => T): T {
  return useStore(useGameContext().store, selector);
}

export const useGameActions = (): GameActions => useGameContext().actions;
