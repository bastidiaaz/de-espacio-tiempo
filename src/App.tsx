import { useEffect, useMemo, useRef, useState } from 'react';
import { Game } from './game/Game';
import { STORAGE_KEYS } from './game/config';
import { storage } from './game/platform';
import { createGameStore, type GameActions } from './state/gameStore';
import { Blink } from './ui/components/Blink';
import { Ending } from './ui/components/Ending';
import { Hud } from './ui/components/Hud';
import { Intro } from './ui/components/Intro';
import { Journal } from './ui/components/Journal';
import { MemoryCard } from './ui/components/MemoryCard';
import { Reticle } from './ui/components/Reticle';
import { Stick } from './ui/components/Stick';
import { Whisper } from './ui/components/Whisper';
import { GameContext } from './ui/GameContext';

export default function App() {
  const [store] = useState(createGameStore);
  const gameRef = useRef<Game | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [journalOpen, setJournalOpen] = useState(false);

  useEffect(() => {
    // Transitional: the shell (ActHost) takes over mounting in the next step.
    const game = new Game(hostRef.current!, store, {
      settings: {
        sound: storage.get(STORAGE_KEYS.sound) !== '0',
        retro: storage.get(STORAGE_KEYS.retro) !== '0',
      },
      onComplete: () => {},
      onRestart: () => location.reload(),
    });
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [store]);

  const actions = useMemo<GameActions>(
    () => ({
      wake: () => gameRef.current?.wake(),
      advanceCard: () => gameRef.current?.advanceCard(),
      keepWandering: () => gameRef.current?.keepWandering(),
      restart: () => gameRef.current?.restart(),
    }),
    [],
  );
  const context = useMemo(() => ({ store, actions }), [store, actions]);

  // DOM order defines stacking (every layer is position: fixed).
  return (
    <GameContext.Provider value={context}>
      <div ref={hostRef} />
      <Blink />
      <Reticle />
      <Whisper />
      <MemoryCard />
      <Hud onOpenJournal={() => setJournalOpen(true)} />
      <Intro />
      <Journal open={journalOpen} onClose={() => setJournalOpen(false)} />
      <Ending />
      <Stick />
    </GameContext.Provider>
  );
}
