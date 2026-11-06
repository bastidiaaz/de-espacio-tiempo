import { useGameState } from '../GameContext';
import './EdgeVignette.css';

/** Soft dark vignette that closes in as Isi nears the edge (ENG-14). The engine dims the light itself. */
export function EdgeVignette() {
  const edge = useGameState((s) => s.edge);
  return <div id="edge-vignette" aria-hidden="true" style={{ opacity: edge }} />;
}
