import React from 'react'
import { Bell, BellOff } from 'lucide-react'

export default function Notificaciones() {
  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div>
        <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <Bell className="w-8 h-8 text-indigo-500" />
          <span>Notificaciones</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Aquí verás las actualizaciones y avisos importantes de la iglesia.
        </p>
      </div>

      {/* Estado vacío */}
      <div className="glass rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
          <BellOff className="w-10 h-10 text-indigo-500/50" />
        </div>
        <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
          Sin notificaciones
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
          No tienes notificaciones por el momento. Cuando haya avisos importantes, nuevos devocionales o actividades, aparecerán aquí.
        </p>
        <div className="mt-6 inline-flex items-center space-x-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold">
          <Bell className="w-4 h-4" />
          <span>Las notificaciones push estarán disponibles próximamente</span>
        </div>
      </div>
    </div>
  )
}
