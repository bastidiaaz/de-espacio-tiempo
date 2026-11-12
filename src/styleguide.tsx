import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Styleguide } from './ui/sketch/Styleguide';
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/sketch.css';

// Entry of estilo.html, the test page of the sketch UI (ART-01). No game, no analytics, no storage.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Styleguide />
  </StrictMode>,
);
