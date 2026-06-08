import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Globe, Heart, BookOpen, Users, Compass, Calendar, Download, Loader, CheckCircle, HeartCrack } from 'lucide-react'

export default function Misiones() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('pueblo')
  const [loading, setLoading] = useState(true)
  
  // Pueblo del Mes
  const [pueblo, setPueblo] = useState(null)
  const [prayCount, setPrayCount] = useState(0)
  const [isPraying, setIsPraying] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Misioneros y Actualizaciones
  const [misioneros, setMisioneros] = useState([])
  const [updates, setUpdates] = useState([])

  // Sub-módulos
  const [testimonios, setTestimonios] = useState([])
  const [cursos, setCursos] = useState([])
  const [viajes, setViajes] = useState([])

  const fetchMissionsData = async () => {
    try {
      setLoading(true)

      // 1. Pueblo del Mes Activo
      const { data: pbl, error: pblErr } = await supabase
        .from('missions_pueblos')
        .select('*')
        .eq('activo', true)
        .limit(1)
        .maybeSingle()

      if (pblErr) throw pblErr
      
      if (pbl) {
        setPueblo(pbl)
        
        // Obtener contador de oración
        const { count, error: countErr } = await supabase
          .from('missions_oracion_registro')
          .select('*', { count: 'exact', head: true })
          .eq('pueblo_id', pbl.id)
        
        if (!countErr) setPrayCount(count || 0)

        // Verificar si el usuario ya está orando
        if (user) {
          const { data: userPray, error: userPrayErr } = await supabase
            .from('missions_oracion_registro')
            .select('*')
            .eq('user_id', user.id)
            .eq('pueblo_id', pbl.id)
            .maybeSingle()
          
          setIsPraying(!!userPray)
        }
      }

      // 2. Misioneros y Updates
      const { data: mis, error: misErr } = await supabase
        .from('missions_misioneros')
        .select('*')
      if (misErr) throw misErr
      setMisioneros(mis || [])

      const { data: upd, error: updErr } = await supabase
        .from('missions_updates')
        .select('*, missions_misioneros(nombre)')
        .order('fecha', { ascending: false })
      if (updErr) throw updErr
      setUpdates(upd || [])

      // 3. Testimonios, Cursos y Viajes
      const { data: tst } = await supabase.from('missions_testimonios').select('*')
      setTestimonios(tst || [])

      const { data: crs } = await supabase.from('missions_cursos').select('*')
      setCursos(crs || [])

      const { data: vjs } = await supabase.from('missions_viajes').select('*')
      setViajes(vjs || [])

    } catch (err) {
      console.error('Error fetching missions data:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissionsData()
  }, [user])

  // Comprometerse / Cancelar compromiso de oración
  const handleTogglePrayer = async () => {
    if (!user || !pueblo || actionLoading) return
    setActionLoading(true)

    try {
      if (isPraying) {
        // Borrar registro
        const { error } = await supabase
          .from('missions_oracion_registro')
          .delete()
          .eq('user_id', user.id)
          .eq('pueblo_id', pueblo.id)
        
        if (error) throw error
        setIsPraying(false)
        setPrayCount(prev => Math.max(0, prev - 1))
      } else {
        // Insertar registro
        const { error } = await supabase
          .from('missions_oracion_registro')
          .insert({
            user_id: user.id,
            pueblo_id: pueblo.id
          })
        
        if (error) throw error
        setIsPraying(true)
        setPrayCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Error toggling prayer:', err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando centro de misiones...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div>
        <h2 className="text-3xl font-bold font-display text-white tracking-tight">Ministerio de Misiones</h2>
        <p className="text-slate-400 text-sm mt-1">Conoce los campos misioneros, apoya en oración y capacítate para ir.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('pueblo')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'pueblo'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Pueblo del Mes</span>
        </button>
        <button
          onClick={() => setActiveTab('misioneros')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'misioneros'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Misioneros Apoyados</span>
        </button>
        <button
          onClick={() => setActiveTab('submodulos')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'submodulos'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Equipar y Movilizar</span>
        </button>
      </div>

      {/* CONTENIDO TAB 1: PUEBLO DEL MES */}
      {activeTab === 'pueblo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card de Ficha del Pueblo */}
          {pueblo ? (
            <div className="lg:col-span-2 glass rounded-3xl p-6 border border-slate-850 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Enfoque Global de Oración</span>
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">{pueblo.nombre}</h3>
                <p className="text-slate-400 text-xs mt-1">Región: {pueblo.region}</p>
              </div>

              {/* Estadísticas Demográficas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Población</span>
                  <span className="text-slate-200 text-sm font-bold">{(pueblo.poblacion / 1000000).toFixed(1)} M</span>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Religión</span>
                  <span className="text-slate-200 text-sm font-bold truncate block">{pueblo.religion || 'Etnorreligión'}</span>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">% Cristiano</span>
                  <span className="text-emerald-400 text-sm font-bold">{pueblo.porcentaje_cristiano || 0}%</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-300">¿Por qué orar por ellos?</h4>
                <p className="text-slate-400 text-xs leading-relaxed text-justify">
                  Este pueblo es considerado un grupo "no alcanzado" debido a que la presencia del evangelio y de iglesias cristianas autóctonas es inferior al 2%. La mayoría de ellos no tiene acceso a la Biblia en su propio dialecto ni conoce a ningún seguidor de Jesús en su comunidad de origen.
                </p>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 glass rounded-3xl p-8 text-center border border-slate-850">
              <p className="text-slate-500 text-sm">No hay un pueblo del mes configurado actualmente.</p>
            </div>
          )}

          {/* Compromiso de Oración Lateral */}
          {pueblo && (
            <div className="glass rounded-3xl p-6 border border-slate-850 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold font-display text-white text-md flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-indigo-400" />
                  <span>Cadena de Intercesión</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Únete como intercesor por el {pueblo.nombre}. Oramos por barreras culturales rotas y para que obreros sean enviados a sus campos.
                </p>

                <div className="p-4 bg-indigo-950/20 border border-indigo-900/10 rounded-2xl text-center">
                  <span className="text-[28px] font-bold font-display text-indigo-400 block leading-none">{prayCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Hermanos comprometidos</span>
                </div>
              </div>

              <button
                onClick={handleTogglePrayer}
                disabled={actionLoading}
                className={`w-full flex items-center justify-center space-x-2 font-medium py-3 rounded-xl transition-all active:scale-[0.98] text-xs font-display ${
                  isPraying
                    ? 'bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                }`}
              >
                {actionLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : isPraying ? (
                  <>
                    <HeartCrack className="w-4 h-4" />
                    <span>Quitar de mis Oraciones</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    <span>Comprometerse a Orar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO TAB 2: MISIONEROS APOYADOS */}
      {activeTab === 'misioneros' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Feed de Actualizaciones y Cartas del Campo */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">Reportes desde el Campo</h3>
            
            {updates.length === 0 ? (
              <p className="text-slate-500 text-xs italic">Aún no hay reportes publicados.</p>
            ) : (
              updates.map((upd) => (
                <div key={upd.id} className="glass rounded-3xl p-6 border border-slate-850 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{upd.titulo}</h4>
                      <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">Enviado por: {upd.missions_misioneros?.nombre}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{new Date(upd.fecha).toLocaleDateString('es-CL')}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed text-justify whitespace-pre-line">
                    {upd.contenido}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Listado lateral de Misioneros */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">Fichas de Misioneros</h3>
            
            {misioneros.map((mis) => (
              <div key={mis.id} className="glass rounded-2xl p-5 border border-slate-850 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 font-display">
                    {mis.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-200 leading-tight">{mis.nombre}</h5>
                    <span className="text-[10px] text-slate-400 font-medium">Servicio en: {mis.pais_servicio}</span>
                  </div>
                </div>

                <div className="space-y-3.5 text-[11px] leading-relaxed">
                  <div>
                    <span className="text-slate-500 font-bold block mb-0.5">Su Historia:</span>
                    <p className="text-slate-400 text-justify">{mis.historia}</p>
                  </div>
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                    <span className="text-indigo-400 font-bold block mb-0.5">Petición de Oración:</span>
                    <p className="text-indigo-200 italic">{mis.pedido_oracion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: EQUIPAR Y MOVILIZAR */}
      {activeTab === 'submodulos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Motivar (Testimonios) */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-2 px-1">
              <Heart className="w-4.5 h-4.5" />
              <span>Motivar (Testimonios)</span>
            </h4>
            
            {testimonios.map((tst) => (
              <div key={tst.id} className="glass rounded-2xl p-5 border border-slate-850 space-y-3 text-xs leading-relaxed">
                <p className="text-slate-300 italic text-justify">"{tst.contenido}"</p>
                <span className="text-[10px] text-slate-500 font-bold block text-right">— {tst.autor} ({tst.titulo})</span>
              </div>
            ))}
          </div>

          {/* Entrenar (Cursos) */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-2 px-1">
              <BookOpen className="w-4.5 h-4.5" />
              <span>Entrenar (Capacitación)</span>
            </h4>

            {cursos.map((crs) => (
              <div key={crs.id} className="glass rounded-2xl p-5 border border-slate-850 flex flex-col justify-between min-h-[160px]">
                <div className="space-y-1.5">
                  <h5 className="font-bold text-xs text-slate-200">{crs.titulo}</h5>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{crs.descripcion}</p>
                </div>
                
                {crs.url_material && (
                  <a
                    href={crs.url_material}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 py-1.5 rounded-xl text-[10.5px] font-semibold mt-4 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Material</span>
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Movilizar (Viajes) */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-2 px-1">
              <Compass className="w-4.5 h-4.5" />
              <span>Movilizar (Viajes)</span>
            </h4>

            {viajes.map((vj) => (
              <div key={vj.id} className="glass rounded-2xl p-5 border border-slate-850 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1 text-slate-500 text-[9px] font-bold uppercase">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(vj.fecha_inicio).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-200">{vj.destino}</h5>
                  <p className="text-slate-400 text-[11px] leading-relaxed text-justify">{vj.descripcion}</p>
                </div>

                <div className="border-t border-slate-850 pt-3 text-[10.5px]">
                  <span className="text-slate-500 font-bold block mb-1">Requisitos:</span>
                  <p className="text-slate-400 leading-normal">{vj.requisitos}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
