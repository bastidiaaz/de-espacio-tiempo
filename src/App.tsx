import { useEffect, useMemo, useRef, useState } from 'react';
import { Game } from './game/Game';
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
    const game = new Game(hostRef.current!, store);
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
      toggleSound: () => gameRef.current?.toggleSound(),
      toggleRetro: () => gameRef.current?.toggleRetro(),
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
