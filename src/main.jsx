import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
