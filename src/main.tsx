/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nueva versión disponible de Ilumina. ¿Desea actualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Ilumina está listo para funcionar sin conexión.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
