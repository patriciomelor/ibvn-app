import React from 'react'
import { Bell, MessageSquare, CheckCircle, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Notificaciones() {
  const { profile } = useAuth()
  const isOptedIn = profile?.whatsapp_optin === true

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div>
        <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <Bell className="w-8 h-8 text-indigo-500" />
          <span>Notificaciones</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Canal oficial de avisos y notificaciones de la iglesia.
        </p>
      </div>

      {/* Estado del Canal WhatsApp */}
      <div className="glass rounded-3xl p-8 border border-slate-200 dark:border-slate-800 max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
          <MessageSquare className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            Notificaciones por WhatsApp (Kapso)
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
            Los comunicados importantes y las alertas de nuevos devocionales diarios se envían directamente a tu número de WhatsApp registrado.
          </p>
        </div>

        {/* Estado actual del usuario */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {profile?.tel ? `Teléfono: ${profile.tel}` : 'Sin teléfono registrado'}
              </p>
              <p className="text-[10px] text-slate-500">
                {isOptedIn ? 'Suscripción a WhatsApp: Activa' : 'Suscripción a WhatsApp: Inactiva'}
              </p>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${isOptedIn ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
            {isOptedIn ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/profile"
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2.5 px-5 rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-950/30"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Configurar Notificaciones en mi Perfil</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
