import { Game } from '../game/Game';
import { createGameStore, type GameActions } from '../state/gameStore';
import { Act1Ui } from '../ui/Act1Ui';
import { GameContext } from '../ui/GameContext';
import type { ActModule } from './types';

/** Act I ("Astronauta"): the original engine and UI, wrapped in the act contract. */
export const act1: ActModule = {
  mount(host, ctx) {
    const store = createGameStore();
    const game = new Game(host, store, {
      settings: ctx.settings,
      onComplete: ctx.markCompleted,
      onRestart: ctx.restart,
    });
    const actions: GameActions = {
      wake: game.wake,
      advanceCard: game.advanceCard,
      keepWandering: game.keepWandering,
      restart: game.restart,
      debugJumpToChapter: game.debugJumpToChapter,
      debugJumpToItem: game.debugJumpToItem,
      debugCompleteAll: game.debugCompleteAll,
      debugJumpToHidden: game.debugJumpToHidden,
      debugResetHidden: game.debugResetHidden,
      debugReplayReveal: game.debugReplayReveal,
    };
    return {
      engine: game,
      ui: (
        <GameContext.Provider value={{ store, actions }}>
          <Act1Ui />
        </GameContext.Provider>
      ),
    };
  },
};
