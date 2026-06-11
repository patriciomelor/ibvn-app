import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { initAnalytics } from './lib/analytics'
import './index.css'
import App from './App.jsx'

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

// Inicializar tema guardado antes de montar React para evitar parpadeos
const savedTheme = localStorage.getItem('theme') || 'system'
const root = window.document.documentElement
root.classList.remove('light', 'dark')
if (savedTheme === 'system') {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  root.classList.add(systemTheme)
} else {
  root.classList.add(savedTheme)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
