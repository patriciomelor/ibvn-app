import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { DISCIPULADO_CLASES } from '../config/discipulado'
import { Award, CheckCircle, Lock, PlayCircle, MessageSquare, Phone, Mail, Loader, User } from 'lucide-react'

export default function EscuelaLideres() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [spiritualRecord, setSpiritualRecord] = useState(null)
  const [mentor, setMentor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedClass, setExpandedClass] = useState('conectar')

  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)

      // 1. Cargar perfil del miembro e información de su mentor
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*, celulas:celula_id(nombre), ministerios:ministerio_id(nombre)')
        .eq('id', user.id)
        .single()
      
      if (profErr) throw profErr
      setProfileData(prof)

      // Cargar datos del mentor si tiene uno asignado
      if (prof.mentor_id) {
        const { data: ment, error: mentErr } = await supabase
          .from('profiles')
          .select('nombre, email, tel')
          .eq('id', prof.mentor_id)
          .single()
        
        if (!mentErr) {
          setMentor(ment)
        }
      }

      // 2. Cargar progreso espiritual
      const { data: record, error: recErr } = await supabase
        .from('spiritual_records')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (recErr) throw recErr
      setSpiritualRecord(record || {
        bautizado: false,
        conectar: false,
        crecer: false,
        intro_lid: false,
        dones: false,
        aplicadas: false
      })

    } catch (err) {
      console.error('Error loading discipulado data:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  // Obtener estado de cada clase
  const getClassStatus = (classId) => {
    if (!spiritualRecord) return 'locked'

    const order = ['conectar', 'crecer', 'intro_lid', 'dones', 'aplicadas']
    const idx = order.indexOf(classId)

    if (spiritualRecord[classId]) {
      return 'completed'
    }

    // Si es la primera clase, está "en curso" si no está completada
    if (idx === 0) {
      return 'in_progress'
    }

    // Si la clase anterior en el orden está completada, esta está "en curso", si no, está "bloqueada"
    const prevClassId = order[idx - 1]
    if (spiritualRecord[prevClassId]) {
      return 'in_progress'
    }

    return 'locked'
  }

  // Calcular porcentaje de progreso del discipulado (de 6 hitos: bautismo + 5 clases)
  const calculateProgress = () => {
    if (!spiritualRecord) return 0
    let points = 0
    if (spiritualRecord.bautizado) points++
    if (spiritualRecord.conectar) points++
    if (spiritualRecord.crecer) points++
    if (spiritualRecord.intro_lid) points++
    if (spiritualRecord.dones) points++
    if (spiritualRecord.aplicadas) points++
    return Math.round((points / 6) * 100)
  }

  const progressPercent = calculateProgress()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando ciclo de clases...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div>
        <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Escuela de Líderes</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sigue tu progreso de discipulado, conecta con tu mentor y prepárate para servir.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Progreso y Clases */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card de Progreso Donut */}
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* SVG Donut Chart */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#6366f1"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-display text-slate-900 dark:text-white">{progressPercent}%</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Avance</span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h4 className="text-lg font-bold font-display text-slate-900 dark:text-white">Tu Trayecto de Discipulado</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md">
                El ciclo de formación ministerial consta de 5 cursos consecutivos y tu bautismo formal. Cada nivel aprobado te capacita y acerca para guiar células o apoyar ministerios activos.
              </p>
            </div>
          </div>

          {/* Listado de Cursos */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">Cursos del Ciclo</h3>
            
            {DISCIPULADO_CLASES.map((clase) => {
              const status = getClassStatus(clase.id)
              const isOpen = expandedClass === clase.id

              return (
                <div
                  key={clase.id}
                  className={`glass rounded-2xl overflow-hidden border transition-all duration-200 ${
                    isOpen ? 'border-indigo-500/30' : 'border-slate-200 dark:border-slate-850'
                  }`}
                >
                  {/* Fila del Curso */}
                  <button
                    onClick={() => status !== 'locked' && setExpandedClass(isOpen ? '' : clase.id)}
                    disabled={status === 'locked'}
                    className={`w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus:outline-none ${
                      status === 'locked' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white dark:bg-slate-900/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${
                        status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : status === 'in_progress'
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-600'
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : status === 'in_progress' ? (
                          <PlayCircle className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{clase.nombre}</h4>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{clase.descripcion}</p>
                      </div>
                    </div>

                    <div>
                      {status === 'completed' ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase">Aprobada</span>
                      ) : status === 'in_progress' ? (
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase">En Curso</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 px-2 py-0.5 rounded-md uppercase">Bloqueada</span>
                      )}
                    </div>
                  </button>

                  {/* Detalle del Curso (Módulos) */}
                  {isOpen && status !== 'locked' && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-200 dark:border-slate-800/40 bg-white dark:bg-slate-900/10 space-y-3 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {clase.modulos.map((mod, index) => (
                          <div
                            key={mod.id}
                            className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex.col text-xs leading-relaxed"
                          >
                            <span className="text-slate-500 font-bold block mb-1">Módulo {index + 1}: {mod.titulo}</span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium leading-tight">{mod.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Lado Derecho: Mentor y Requisitos */}
        <div className="space-y-6">
          
          {/* Ficha de Mentor Asignado */}
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-850 space-y-4">
            <h3 className="text-md font-bold font-display text-slate-900 dark:text-white flex items-center space-x-2">
              <User className="w-5 h-5 text-indigo-400" />
              <span>Mi Mentor Espiritual</span>
            </h3>

            {mentor ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3.5 border-b border-slate-200 dark:border-slate-850 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/25 flex items-center justify-center font-bold text-indigo-300 font-display text-lg">
                    {mentor.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-700 dark:text-slate-200">{mentor.nombre}</h5>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Consejero / Acompañante</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{mentor.email}</span>
                  </div>
                  {mentor.tel && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{mentor.tel}</span>
                    </div>
                  )}
                </div>

                {mentor.tel && (
                  <a
                    href={`https://wa.me/${mentor.tel.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(mentor.nombre)},%20te%20escribo%20desde%20la%20Vida%20Nueva%20App.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-medium py-2 rounded-xl transition-all text-xs font-display"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Contactar por WhatsApp</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500 text-xs italic mb-4">
                  Aún no tienes un mentor asignado para tu trayecto espiritual.
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Ponte en contacto con los pastores o líderes de tu célula para coordinar la asignación de un mentor de acompañamiento.
                </p>
              </div>
            )}
          </div>

          {/* Requisitos y Checklist de Liderazgo */}
          <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-850 space-y-4">
            <h3 className="text-md font-bold font-display text-slate-900 dark:text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Requisitos de Liderazgo</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Para ser habilitado formalmente como líder activo en ministerios o células, debes cumplir con los siguientes requisitos integrales:
            </p>

            <div className="space-y-3 mt-4">
              {[
                { label: 'Bautismo en agua', checked: spiritualRecord?.bautizado },
                { label: 'Clase 1: Conectar aprobada', checked: spiritualRecord?.conectar },
                { label: 'Clase 2: Crecer aprobada', checked: spiritualRecord?.crecer },
                { label: 'Servicio en un ministerio', checked: !!profileData?.ministerio_id },
                { label: 'Acompañamiento de Mentor', checked: !!profileData?.mentor_id },
                { label: 'Clase 3: Liderazgo aprobada', checked: spiritualRecord?.intro_lid }
              ].map((req, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs font-medium">
                  {req.checked ? (
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-4.5 h-4.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0" />
                  )}
                  <span className={req.checked ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
