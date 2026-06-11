import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { 
  Activity, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  UserPlus, 
  UserMinus, 
  Loader, 
  AlertCircle, 
  CheckCircle,
  Trophy,
  ArrowRight,
  Shield
} from 'lucide-react'

export default function Deportes() {
  const { user, isLider } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null) // holds activity_id during registration action
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Cargar actividades y sus inscripciones
  const fetchActivities = async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      
      // Consultar actividades y sus inscripciones asociadas
      const { data, error } = await supabase
        .from('sports_activities')
        .select(`
          *,
          sports_registrations (
            id,
            user_id,
            profiles (
              id,
              nombre,
              email,
              tel,
              rol
            )
          )
        `)
        .order('datetime', { ascending: true })

      if (error) throw error
      setActivities(data || [])
    } catch (err) {
      console.error('Error fetching sports activities:', err.message)
      setErrorMessage('No se pudieron cargar las actividades deportivas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [user])

  // Inscribirse en una actividad
  const handleRegister = async (activityId) => {
    if (!user || actionLoading) return
    setActionLoading(activityId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('sports_registrations')
        .insert({
          activity_id: activityId,
          user_id: user.id
        })

      if (error) {
        // Capturar error de trigger de cupos u otros
        if (error.message.includes('No quedan cupos')) {
          throw new Error('¡Cupos agotados! No quedan espacios disponibles para esta actividad.')
        }
        throw error
      }

      setSuccessMessage('¡Te has inscrito con éxito en la actividad!')
      await fetchActivities()
    } catch (err) {
      console.error('Error registering in sports activity:', err.message)
      setErrorMessage(err.message || 'No se pudo procesar la inscripción.')
    } finally {
      setActionLoading(null)
    }
  }

  // Cancelar inscripción
  const handleCancelRegister = async (registrationId, activityId) => {
    if (!user || actionLoading) return
    setActionLoading(activityId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('sports_registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error

      setSuccessMessage('Has cancelado tu inscripción para esta actividad.')
      await fetchActivities()
    } catch (err) {
      console.error('Error canceling registration:', err.message)
      setErrorMessage('No se pudo cancelar la inscripción.')
    } finally {
      setActionLoading(null)
    }
  }

  // Eliminar participante (solo Líderes / Pastores)
  const handleRemoveParticipantByAdmin = async (registrationId, activityId, participantName) => {
    if (!isLider || actionLoading) return
    if (!window.confirm(`¿Estás seguro de que deseas remover a ${participantName} de esta actividad?`)) return
    
    setActionLoading(activityId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('sports_registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error

      setSuccessMessage(`Se removió a ${participantName} de la actividad.`);
      await fetchActivities()
    } catch (err) {
      console.error('Error removing participant:', err.message)
      setErrorMessage('No se pudo remover al participante.')
    } finally {
      setActionLoading(null)
    }
  }

  // Helper para retornar icono según tipo de deporte
  const getSportIcon = (sportType) => {
    const type = sportType.toLowerCase()
    if (type.includes('fútbol') || type.includes('futbol') || type.includes('soccer')) {
      return <Trophy className="w-6 h-6 text-emerald-400" />
    } else if (type.includes('trekking') || type.includes('senderismo') || type.includes('cerro')) {
      return <MapPin className="w-6 h-6 text-amber-400" />
    } else if (type.includes('básquet') || type.includes('basquet') || type.includes('basket')) {
      return <Activity className="w-6 h-6 text-orange-400" />
    }
    return <Activity className="w-6 h-6 text-indigo-400" />
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando actividades deportivas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-8 h-8 text-indigo-500" />
            <span>Deportes y Recreación</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Espacios deportivos y recreativos para compartir en comunidad. Inscríbete y participa en nuestros próximos encuentros.
          </p>
        </div>
        {isLider && (
          <div className="flex items-center space-x-2 bg-indigo-950/30 border border-indigo-500/20 px-4 py-2 rounded-2xl text-[11px] text-indigo-300 font-semibold">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Modo Organizador Activado</span>
          </div>
        )}
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="glass-rose flex items-start space-x-2 p-4 rounded-2xl text-rose-300 text-sm max-w-2xl">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="glass-emerald flex items-center space-x-2 p-4 rounded-2xl text-emerald-300 text-sm max-w-2xl">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Listado de Actividades */}
      {activities.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center max-w-xl mx-auto border border-slate-200 dark:border-slate-850">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">No hay actividades programadas</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Pronto subiremos nuevos torneos y salidas recreativas. ¡Mantente atento!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {activities.map((act) => {
            const registrations = act.sports_registrations || []
            const registeredCount = registrations.length
            const isUserRegistered = user ? registrations.some(r => r.user_id === user.id) : false
            const userRegistration = user ? registrations.find(r => r.user_id === user.id) : null
            const isFull = registeredCount >= act.limit_slots
            const slotsRemaining = Math.max(0, act.limit_slots - registeredCount)
            
            // Determinar porcentaje de ocupación para progress bar
            const occupancyPercentage = Math.min(100, (registeredCount / act.limit_slots) * 100)
            
            return (
              <div 
                key={act.id} 
                className={`glass rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-6 ${
                  isUserRegistered 
                    ? 'border-indigo-500/30 shadow-lg shadow-indigo-950/20' 
                    : 'border-slate-200 dark:border-slate-850 hover:border-slate-805'
                }`}
              >
                <div className="space-y-4">
                  {/* Categoría & Icono */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
                        {getSportIcon(act.sport_type)}
                      </div>
                      <div>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
                          {act.sport_type}
                        </span>
                        <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white mt-0.5 leading-tight">
                          {act.title}
                        </h3>
                      </div>
                    </div>

                    {isUserRegistered && (
                      <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Inscrito
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed text-justify">
                    {act.description}
                  </p>

                  {/* Datos del Evento (Fecha, Hora, Lugar) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-850">
                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{new Date(act.datetime).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{new Date(act.datetime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 sm:col-span-2 mt-1">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate">{act.place}</span>
                    </div>
                  </div>

                  {/* Barra de Cupos */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Cupos ocupados</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {registeredCount} / {act.limit_slots} {isFull && <span className="text-rose-400 font-bold">(Lleno)</span>}
                      </span>
                    </div>
                    {/* Barra */}
                    <div className="w-full bg-white dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull 
                            ? 'bg-rose-500' 
                            : occupancyPercentage > 75 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      {isFull 
                        ? 'Actividad sin cupos disponibles.' 
                        : `Quedan ${slotsRemaining} cupos disponibles para inscribirte.`}
                    </p>
                  </div>
                </div>

                {/* Botón de Acción Principal */}
                <div className="pt-2">
                  {!user ? (
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-indigo-400 border border-slate-200 dark:border-slate-800 py-3 rounded-xl transition-all active:scale-[0.98] text-xs font-semibold font-display"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Inicia sesión para inscribirte</span>
                    </button>
                  ) : isUserRegistered ? (
                    <button
                      onClick={() => handleCancelRegister(userRegistration.id, act.id)}
                      disabled={actionLoading === act.id}
                      className="w-full flex items-center justify-center space-x-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-500/20 py-3 rounded-xl transition-all active:scale-[0.98] text-xs font-semibold font-display"
                    >
                      {actionLoading === act.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserMinus className="w-4 h-4" />
                          <span>Cancelar Inscripción</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(act.id)}
                      disabled={isFull || actionLoading === act.id}
                      className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl transition-all active:scale-[0.98] text-xs font-semibold font-display ${
                        isFull 
                          ? 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-850 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white shadow-lg shadow-indigo-950/40'
                      }`}
                    >
                      {actionLoading === act.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : isFull ? (
                        <span>Cupos Agotados</span>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Inscribirme Ahora</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Sección de participantes (Solo para Líderes / Pastores) */}
                {isLider && (
                  <div className="border-t border-slate-200 dark:border-slate-850/80 pt-4 mt-2 space-y-3">
                    <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                      <Users className="w-4.5 h-4.5" />
                      <span>Lista de Participantes ({registeredCount})</span>
                    </div>

                    {registrations.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic pl-1">Aún no hay inscritos en esta actividad.</p>
                    ) : (
                      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-850 overflow-hidden divide-y divide-slate-850/60 max-h-48 overflow-y-auto">
                        {registrations.map((reg) => {
                          const p = reg.profiles || {}
                          return (
                            <div key={reg.id} className="p-3 flex items-center justify-between text-[11px] hover:bg-white dark:bg-slate-900 transition-colors">
                              <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{p.nombre || 'Miembro'}</p>
                                <p className="text-slate-500 text-[10px]">{p.email || 'Sin correo'} {p.tel ? `• ${p.tel}` : ''}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveParticipantByAdmin(reg.id, act.id, p.nombre || 'el miembro')}
                                disabled={actionLoading === act.id}
                                className="text-rose-400 hover:text-rose-300 font-semibold p-1 hover:bg-rose-950/20 rounded transition-all"
                                title="Remover de la lista"
                              >
                                Quitar
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
