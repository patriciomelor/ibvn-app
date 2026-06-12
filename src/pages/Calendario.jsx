import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Calendar, AlertCircle } from 'lucide-react'

export default function Calendario() {
  const { churchSettings } = useAuth()
  const calendarUrl = churchSettings?.calendar_url

  if (!calendarUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">Calendario no configurado</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          El administrador aún no ha vinculado el enlace de Google Calendar en los ajustes globales.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      {/* Cabecera */}
      <div>
        <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600/10 rounded-xl border border-indigo-500/20 text-indigo-500">
            <Calendar className="w-6 h-6" />
          </div>
          <span>Calendario Oficial</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Revisa las próximas reuniones, servicios y actividades de la iglesia.
        </p>
      </div>

      {/* Visor de Calendario */}
      <div className="flex-1 min-h-[600px] glass rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-950/5 relative">
        <iframe 
          src={calendarUrl} 
          style={{ border: 0, width: '100%', height: '100%', minHeight: '600px' }}
          title="Google Calendar"
          className="absolute inset-0 bg-white"
        />
      </div>
    </div>
  )
}
