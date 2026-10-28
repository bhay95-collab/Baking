import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/gilda-display/latin-400.css';
import '@fontsource/mrs-saint-delafield/latin-400.css';
import '@fontsource-variable/hanken-grotesk/index.css';
import './ui/styles.css';
import { App } from './ui/App';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
