import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Globe, MapPin, Calendar, Users, ChevronRight, CheckCircle, AlertCircle, Loader, Heart } from 'lucide-react'

export default function Misiones() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [misiones, setMisiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal de Postulación
  const [selectedMision, setSelectedMision] = useState(null)
  const [motivacion, setMotivacion] = useState('')
  const [areas, setAreas] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [postulacionSuccess, setPostulacionSuccess] = useState(false)
  const [misPostulaciones, setMisPostulaciones] = useState([])

  const AREAS_SERVICIO = [
    'Evangelismo', 'Medicina / Salud', 'Logística', 
    'Niños', 'Música / Alabanza', 'Traducción'
  ]

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Cargar misiones
      const { data: misionesData, error: misionesErr } = await supabase
        .from('misiones')
        .select('*')
        .order('fecha_inicio', { ascending: true })

      if (misionesErr) throw misionesErr
      setMisiones(misionesData || [])

      // Cargar postulaciones del usuario
      if (user) {
        const { data: postData, error: postErr } = await supabase
          .from('misiones_postulaciones')
          .select('mision_id, estado')
          .eq('user_id', user.id)
        
        if (!postErr && postData) {
          setMisPostulaciones(postData)
        }
      }
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los viajes misioneros.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const toggleArea = (area) => {
    if (areas.includes(area)) {
      setAreas(areas.filter(a => a !== area))
    } else {
      setAreas([...areas, area])
    }
  }

  const handlePostular = async (e) => {
    e.preventDefault()
    if (!user || !selectedMision) return
    
    setSubmitting(true)
    setError('')

    try {
      const { error: insertErr } = await supabase
        .from('misiones_postulaciones')
        .insert({
          mision_id: selectedMision.id,
          user_id: user.id,
          motivacion: motivacion.trim(),
          estado: 'pendiente'
        })

      if (insertErr) throw insertErr

      setPostulacionSuccess(true)
      setMisPostulaciones([...misPostulaciones, { mision_id: selectedMision.id, estado: 'pendiente' }])
      
      setTimeout(() => {
        setPostulacionSuccess(false)
        setSelectedMision(null)
        setMotivacion('')
        setAreas([])
      }, 3000)

    } catch (err) {
      console.error(err)
      if (err.code === '23505') {
        setError('Ya estás postulado a este viaje.')
      } else {
        setError('Ocurrió un error al enviar tu postulación.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getPostulacionStatus = (misionId) => {
    return misPostulaciones.find(p => p.mision_id === misionId)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando viajes misioneros...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center space-x-2 text-indigo-300 font-semibold uppercase tracking-wider text-xs mb-4">
            <Globe className="w-4 h-4" />
            <span>Misiones Globales</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-display tracking-tight mb-4 leading-tight">
            Llevando Esperanza <br/> a las Naciones
          </h1>
          <p className="text-indigo-100/80 text-sm sm:text-base leading-relaxed max-w-xl">
            Súmate a nuestros próximos viajes misioneros. Dios está buscando corazones dispuestos a ir donde hay necesidad. ¿Responderás al llamado?
          </p>
        </div>
      </div>

      {error && !selectedMision && (
        <div className="glass-rose flex items-center space-x-2 p-4 rounded-xl text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Listado de Misiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {misiones.length === 0 ? (
          <div className="col-span-full glass rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <Globe className="w-12 h-12 text-indigo-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">No hay viajes programados</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Vuelve a revisar pronto. Estamos planificando nuestros próximos destinos.</p>
          </div>
        ) : (
          misiones.map((mision) => {
            const status = getPostulacionStatus(mision.id)
            return (
              <div key={mision.id} className="glass bg-white/50 dark:bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="h-48 bg-slate-200 dark:bg-slate-800 relative overflow-hidden shrink-0">
                  {mision.imagen_url ? (
                    <img src={mision.imagen_url} alt={mision.titulo} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/10">
                      <Globe className="w-16 h-16 text-indigo-500/20" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border border-white/20 shadow-sm">
                    {mision.estado}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2 line-clamp-1">{mision.titulo}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs">
                      <MapPin className="w-4 h-4 mr-2 text-indigo-400 shrink-0" />
                      <span className="truncate">{mision.destino}</span>
                    </div>
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs">
                      <Calendar className="w-4 h-4 mr-2 text-indigo-400 shrink-0" />
                      <span>{new Date(mision.fecha_inicio).toLocaleDateString()} - {new Date(mision.fecha_fin).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs">
                      <Users className="w-4 h-4 mr-2 text-indigo-400 shrink-0" />
                      <span>{mision.cupos} Cupos Totales</span>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-6 flex-1">
                    {mision.descripcion}
                  </p>

                  <div className="mt-auto">
                    {status ? (
                      <div className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        status.estado === 'aprobado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                        status.estado === 'rechazado' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {status.estado === 'aprobado' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>Estado: {status.estado}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!user) {
                            navigate('/login')
                          } else {
                            setSelectedMision(mision)
                          }
                        }}
                        disabled={mision.estado !== 'abierta'}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center space-x-2 text-sm shadow-sm"
                      >
                        <Heart className="w-4 h-4" />
                        <span>{mision.estado === 'abierta' ? 'Postular al Viaje' : 'Viaje Cerrado'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de Postulación */}
      {selectedMision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">Formulario de Voluntariado</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedMision.titulo}</p>
            </div>

            <div className="p-6 overflow-y-auto">
              {postulacionSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">¡Postulación Enviada!</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Tus líderes revisarán tu solicitud y se pondrán en contacto contigo pronto.
                  </p>
                </div>
              ) : (
                <form id="postulacion-form" onSubmit={handlePostular} className="space-y-6">
                  {error && (
                    <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2 uppercase tracking-wider">
                      ¿Por qué deseas ir a este viaje?
                    </label>
                    <textarea
                      required
                      rows="4"
                      value={motivacion}
                      onChange={(e) => setMotivacion(e.target.value)}
                      placeholder="Escribe brevemente tu motivación y cómo crees que Dios te usará..."
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-3 uppercase tracking-wider">
                      Áreas en las que podrías servir (Opcional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AREAS_SERVICIO.map(area => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleArea(area)}
                          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                            areas.includes(area)
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl">
              {!postulacionSuccess && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedMision(null)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="postulacion-form"
                    disabled={submitting || !motivacion.trim()}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 transition-all flex items-center space-x-2 shadow-md"
                  >
                    {submitting && <Loader className="w-4 h-4 animate-spin" />}
                    <span>Enviar Postulación</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
