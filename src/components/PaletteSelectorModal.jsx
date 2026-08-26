import React, { useEffect, useState } from 'react'
import { Palette, Check, Sun, Moon, Eye, X } from 'lucide-react'
import { PALETTES, applyPalette, getCurrentPaletteId } from '../lib/theme'
import { useAuth } from '../context/AuthContext'

export default function PaletteSelectorModal() {
  const [show, setShow] = useState(false)
  const [selectedId, setSelectedId] = useState(getCurrentPaletteId())
  const { user, updateProfile } = useAuth()

  useEffect(() => {
    // Mostrar modal si el usuario aún no ha elegido su paleta por primera vez
    const chosen = localStorage.getItem('theme_palette_chosen')
    if (!chosen) {
      setShow(true)
    }
  }, [])

  const handleSelectPalette = (paletteId) => {
    setSelectedId(paletteId)
    // Aplicar inmediatamente en pantalla para vista previa viva
    applyPalette(paletteId, false)
  }

  const handleConfirm = async () => {
    applyPalette(selectedId, true)
    if (user && updateProfile) {
      try {
        await updateProfile({ theme_palette: selectedId })
      } catch (err) {
        console.error('Error guardando paleta en perfil:', err)
      }
    }
    setShow(false)
  }

  if (!show) return null

  const lightPalettes = PALETTES.filter(p => p.type === 'light')
  const darkPalettes = PALETTES.filter(p => p.type === 'dark')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:hidden">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto hide-scrollbar">
        
        {/* Botón Omitir/Cerrar */}
        <button
          onClick={handleConfirm}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Omitir por ahora"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera del Modal */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-3 shadow-inner">
            <Palette className="w-7 h-7 animate-bounce" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
            Accesibilidad & Salud Visual
          </span>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Elige tu Paleta de Colores
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-md">
            Selecciona la apariencia que mejor se adapte a tus ojos (estilo editor de código). Podrás modificarla cuando quieras en tu Perfil.
          </p>
        </div>

        {/* Paletas Claras */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Paletas Claras</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {lightPalettes.map((palette) => {
              const selected = selectedId === palette.id
              return (
                <button
                  key={palette.id}
                  onClick={() => handleSelectPalette(palette.id)}
                  className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden active:scale-95 ${
                    selected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={{ backgroundColor: palette.colors.bg }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: palette.colors.text }}>
                      {palette.name}
                    </span>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] line-clamp-2 mb-3 leading-relaxed" style={{ color: palette.colors.text, opacity: 0.75 }}>
                    {palette.description}
                  </p>
                  
                  {/* Swatches Chips */}
                  <div className="mt-auto flex items-center space-x-1.5 pt-1">
                    <div className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: palette.colors.bg }} title="Fondo" />
                    <div className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: palette.colors.card }} title="Tarjeta" />
                    <div className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: palette.colors.accent }} title="Acento" />
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold ml-auto" style={{ backgroundColor: palette.colors.card, color: palette.colors.text }}>
                      {palette.tag}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Paletas Oscuras */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Paletas Oscuras</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {darkPalettes.map((palette) => {
              const selected = selectedId === palette.id
              return (
                <button
                  key={palette.id}
                  onClick={() => handleSelectPalette(palette.id)}
                  className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden active:scale-95 ${
                    selected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ backgroundColor: palette.colors.bg }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: palette.colors.text }}>
                      {palette.name}
                    </span>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] line-clamp-2 mb-3 leading-relaxed" style={{ color: palette.colors.text, opacity: 0.75 }}>
                    {palette.description}
                  </p>

                  {/* Swatches Chips */}
                  <div className="mt-auto flex items-center space-x-1.5 pt-1">
                    <div className="w-4 h-4 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: palette.colors.bg }} title="Fondo" />
                    <div className="w-4 h-4 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: palette.colors.card }} title="Tarjeta" />
                    <div className="w-4 h-4 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: palette.colors.accent }} title="Acento" />
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold ml-auto" style={{ backgroundColor: palette.colors.card, color: palette.colors.text }}>
                      {palette.tag}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Botón Confirmar */}
        <button
          onClick={handleConfirm}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] text-xs font-display shadow-lg shadow-indigo-950/50"
        >
          <Eye className="w-4 h-4" />
          <span>Confirmar y Guardar Paleta</span>
        </button>
      </div>
    </div>
  )
}
