// Sistema de Paletas de Colores — IBVN App
// Inspirado en editores de código (VSCode, Zed) para la salud y accesibilidad visual

export const PALETTES = [
  // ☀️ PALETAS CLARAS
  {
    id: 'light-classic',
    name: 'Nieve Clásico',
    type: 'light',
    tag: 'Estándar',
    description: 'Fondo slate claro equilibrado con acentos índigo. Claridad visual óptima para el uso diario.',
    colors: {
      bg: '#f8fafc',
      card: '#ffffff',
      text: '#0f172a',
      accent: '#4f46e5',
      border: '#e2e8f0'
    }
  },
  {
    id: 'light-sepia',
    name: 'Sepia Lectura',
    type: 'light',
    tag: 'Lectura Suave',
    description: 'Tono papel cálido y suave con acento ámbar. Reduce la luz azul y la fatiga ocular al leer pasajes.',
    colors: {
      bg: '#fbf7ee',
      card: '#f4ecd8',
      text: '#292524',
      accent: '#d97706',
      border: '#e7dcc8'
    }
  },
  {
    id: 'light-contrast',
    name: 'Alto Contraste Claro',
    type: 'light',
    tag: 'Baja Visión',
    description: 'Blanco puro y texto negro con nitidez extrema. Diseñado para maximizar la legibilidad.',
    colors: {
      bg: '#ffffff',
      card: '#f1f5f9',
      text: '#000000',
      accent: '#1d4ed8',
      border: '#000000'
    }
  },

  // 🌙 PALETAS OSCURAS
  {
    id: 'dark-slate',
    name: 'Noche Slate',
    type: 'dark',
    tag: 'Modo Oscuro',
    description: 'Tono slate profundo elegante con acentos índigo brillante. Cómodo para entornos oscuros.',
    colors: {
      bg: '#020617',
      card: '#0f172a',
      text: '#f8fafc',
      accent: '#6366f1',
      border: '#1e293b'
    }
  },
  {
    id: 'dark-ocean',
    name: 'Medianoche Oceánica',
    type: 'dark',
    tag: 'Tonos Fríos',
    description: 'Fondo azul marino profundo con acentos cian y esmeralda. Sensación apacible y descansada.',
    colors: {
      bg: '#090d16',
      card: '#111827',
      text: '#e2e8f0',
      accent: '#06b6d4',
      border: '#1f2937'
    }
  },
  {
    id: 'dark-oled',
    name: 'OLED Negro Puro',
    type: 'dark',
    tag: 'Alto Contraste OLED',
    description: 'Negro absoluto con texto en alto contraste y acento violeta eléctrico. Ahorro de batería en pantallas OLED.',
    colors: {
      bg: '#000000',
      card: '#121212',
      text: '#ffffff',
      accent: '#818cf8',
      border: '#27272a'
    }
  }
]

export const DEFAULT_PALETTE_ID = 'light-classic'

/**
 * Obtener la paleta actual desde localStorage
 */
export function getCurrentPaletteId() {
  const saved = localStorage.getItem('theme_palette')
  if (saved && PALETTES.some(p => p.id === saved)) {
    return saved
  }
  
  // Soporte de migración desde el valor antiguo 'theme' (light/dark)
  const oldTheme = localStorage.getItem('theme')
  if (oldTheme === 'dark') return 'dark-slate'
  if (oldTheme === 'light') return 'light-classic'
  
  // Si el SO está en modo oscuro
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark-slate'
  }

  return DEFAULT_PALETTE_ID
}

/**
 * Aplica una paleta al documento (html[data-palette="..."])
 */
export function applyPalette(paletteId, markChosen = true) {
  if (typeof window === 'undefined') return
  
  const palette = PALETTES.find(p => p.id === paletteId) || PALETTES[0]
  const root = document.documentElement

  // Set attribute and dataset
  root.setAttribute('data-palette', palette.id)
  
  // Sync standard Tailwind .dark / .light class
  if (palette.type === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }

  // Guardar en localStorage
  localStorage.setItem('theme_palette', palette.id)
  // Guardar el tema antiguo equivalente para mantener compatibilidad
  localStorage.setItem('theme', palette.type)

  if (markChosen) {
    localStorage.setItem('theme_palette_chosen', 'true')
  }

  return palette
}

/**
 * Inicialización previa al montaje de React
 */
export function initPalette() {
  const paletteId = getCurrentPaletteId()
  applyPalette(paletteId, false)
}
