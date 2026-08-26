import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { initAnalytics } from './lib/analytics'
import './index.css'
import App from './App.jsx'

import { initPalette } from './lib/theme'

// Inicializar Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: import.meta.env.DEV ? 0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Inicializar PostHog
initAnalytics();

// Inicializar paleta de colores guardada antes de montar React para evitar parpadeos
initPalette()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
