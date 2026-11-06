import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { analytics } from './analytics';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';

analytics.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
