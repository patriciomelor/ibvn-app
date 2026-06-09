import React, { useEffect, useState } from 'react'
import { BookOpen, Globe, Award, ChevronRight, X } from 'lucide-react'

export default function OnboardingModal() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Verificar si ya completó el onboarding anteriormente
    const completed = localStorage.getItem('onboarding_completed')
    if (!completed) {
      setShow(true)
    }
  }, [])

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    localStorage.setItem('onboarding_completed', 'true')
    setShow(false)
  }

  if (!show) return null

  const steps = [
    {
      title: 'Devocional Diario',
      desc: 'Encuentra el pasaje y comentario pastoral semanal conectado con las predicaciones. Registra tus reflexiones en los 3 bloques de tu Diario Espiritual personal.',
      icon: BookOpen,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'Ministerio de Misiones',
      desc: 'Clama y comprométete a orar por el Pueblo del Mes. Mantente al día con las cartas, pedidos de oración y reportes semanales de nuestros misioneros apoyados.',
      icon: Globe,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Escuela de Líderes',
      desc: 'Sigue el avance de tus cursos y clases de discipulado. Conéctate con tu mentor espiritual asignado y mantente activo en el checklist de requisitos de liderazgo.',
      icon: Award,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    }
  ]

  const CurrentIcon = steps[step].icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:hidden">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl flex flex-col items-center text-center">
        
        {/* Botón Cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icono Principal Animado */}
        <div className={`p-6 rounded-2xl border mb-6 transform hover:scale-105 transition-transform ${steps[step].color}`}>
          <CurrentIcon className="w-12 h-12 animate-pulse" />
        </div>

        {/* Título y Descripción */}
        <div className="space-y-2.5 mb-8">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Paso {step + 1} de 3</span>
          <h3 className="text-xl font-bold font-display text-white">{steps[step].title}</h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            {steps[step].desc}
          </p>
        </div>

        {/* Indicadores de Puntos */}
        <div className="flex space-x-1.5 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Botón Acción */}
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] text-xs font-display shadow-lg shadow-indigo-950/50"
        >
          <span>{step < 2 ? 'Siguiente' : 'Comenzar'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
