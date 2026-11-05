import { useState } from 'react';
import { Blink } from './components/Blink';
import { DebugPanel } from './components/DebugPanel';
import { Ending } from './components/Ending';
import { Fade } from './components/Fade';
import { Hud } from './components/Hud';
import { Intro } from './components/Intro';
import { Journal } from './components/Journal';
import { MemoryCard } from './components/MemoryCard';
import { Reticle } from './components/Reticle';
import { Stick } from './components/Stick';
import { Whisper } from './components/Whisper';
import { useGameState } from './GameContext';

/** Act I's own UI layers. Must render inside its GameContext provider. */
export function Act1Ui() {
  const [journalOpen, setJournalOpen] = useState(false);
  const debug = useGameState((s) => s.debug);
  // DOM order defines stacking (every layer is position: fixed).
  return (
    <>
      <Blink />
      <Fade />
      <Reticle />
      <Whisper />
      <MemoryCard />
      <Hud onOpenJournal={() => setJournalOpen(true)} />
      <Intro />
      <Journal open={journalOpen} onClose={() => setJournalOpen(false)} />
      <Ending />
      <Stick />
      {debug && <DebugPanel />}
    </>
  );
}
