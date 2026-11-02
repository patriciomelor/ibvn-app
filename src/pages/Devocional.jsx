import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import defaultLogo from '../assets/logo-ibvn.png'
import { 
  BookOpen, 
  Calendar, 
  Save, 
  Share2, 
  CheckCircle, 
  Loader, 
  AlertCircle, 
  Flame, 
  Printer, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  TreePine,
  CheckSquare,
  Square
} from 'lucide-react'

// Ilustración SVG del árbol de Salmo 1:3 para la portada estilo libro de bolsillo
const cleanDisplayText = (text) => {
  if (!text) return ''
  return String(text)
    .replace(/^\s*(?:\*{1,2})?(?:Título|Versículo|Comentario|Gratitud|Oración|Acción)(?:\*{1,2})?:(?:\*{1,2})?\s*/i, '')
    .trim()
}

const TreeIllustration = ({ className = "w-48 h-48 mx-auto" }) => (
  <svg 
    viewBox="0 0 300 320" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Copa del árbol con hojas redondeadas */}
    <g opacity="0.95">
      {/* Círculos de follaje en verde bosque */}
      <circle cx="150" cy="115" r="75" fill="#2d5e46" />
      <circle cx="105" cy="120" r="50" fill="#244d39" />
      <circle cx="195" cy="120" r="50" fill="#244d39" />
      <circle cx="130" cy="75" r="42" fill="#366e53" />
      <circle cx="170" cy="75" r="42" fill="#366e53" />
      <circle cx="85" cy="140" r="32" fill="#1e3f2f" />
      <circle cx="215" cy="140" r="32" fill="#1e3f2f" />
      
      {/* Frutos color terracota/salmón */}
      <circle cx="110" cy="95" r="7" fill="#e07a5f" />
      <circle cx="140" cy="65" r="6.5" fill="#e07a5f" />
      <circle cx="165" cy="65" r="6.5" fill="#e07a5f" />
      <circle cx="190" cy="90" r="7" fill="#e07a5f" />
      <circle cx="95" cy="130" r="6" fill="#e07a5f" />
      <circle cx="205" cy="135" r="6" fill="#e07a5f" />
      <circle cx="155" cy="105" r="6" fill="#e07a5f" />
    </g>

    {/* Tronco principal */}
    <path 
      d="M142 135 L142 205 C142 210, 138 218, 130 225 L125 228 M158 135 L158 205 C158 210, 162 218, 170 225 L175 228" 
      stroke="#183325" 
      strokeWidth="10" 
      strokeLinecap="round" 
    />
    <path 
      d="M150 145 L150 215" 
      stroke="#183325" 
      strokeWidth="12" 
      strokeLinecap="round" 
    />

    {/* Ondas de agua (arroyos de aguas) */}
    <path 
      d="M10 200 Q 45 194, 80 200 T 150 200 T 220 200 T 290 200" 
      stroke="#5aa488" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      opacity="0.85"
    />
    <path 
      d="M10 208 Q 45 202, 80 208 T 150 208 T 220 208 T 290 208" 
      stroke="#3d856b" 
      strokeWidth="2" 
      strokeLinecap="round" 
      opacity="0.6"
    />

    {/* Raíces profundas en la tierra */}
    <g stroke="#2d5e46" strokeWidth="3" strokeLinecap="round" opacity="0.9">
      <path d="M145 215 Q 135 240, 120 270 Q 112 285, 100 295" />
      <path d="M155 215 Q 165 240, 180 270 Q 188 285, 200 295" />
      <path d="M150 215 L 150 280 Q 150 295, 148 305" strokeWidth="3.5" />
      <path d="M138 235 Q 120 255, 95 265" strokeWidth="2.5" />
      <path d="M162 235 Q 180 255, 205 265" strokeWidth="2.5" />
      <path d="M148 260 Q 135 280, 130 295" strokeWidth="2" />
      <path d="M152 260 Q 165 280, 170 295" strokeWidth="2" />
    </g>
  </svg>
)

export default function Devocional() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Estados de devocionales de la semana
  const [weekDevotionals, setWeekDevotionals] = useState([])
  const [activeTab, setActiveTab] = useState('day') // 'cover' | 'day'
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Estado del diario devocional para el día activo
  const [journal, setJournal] = useState({
    gratitud_1: '',
    gratitud_2: '',
    gratitud_3: '',
    oracion_personal: '',
    accion_completada: false,
    apreciacion: '',
    cambios: ''
  })
  
  // Caché de diarios de la semana para mostrar checkmarks en pestañas de días
  const [completedDaysMap, setCompletedDaysMap] = useState({})
  
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [userStats, setUserStats] = useState({ racha_actual: 0, puntos_totales: 0 })

  const currentDevocional = weekDevotionals[selectedIndex] || null

  // 1. Cargar devocionales de la semana actual
  const fetchDevotionals = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      // Buscar el devocional más reciente o de hoy
      let { data: latest, error: latestErr } = await supabase
        .from('devocionales')
        .select('*')
        .lte('fecha_asignada', today)
        .order('fecha_asignada', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!latest) {
        // Fallback a cualquier devocional si aún no hay fecha_asignada
        const fallback = await supabase
          .from('devocionales')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        latest = fallback.data
      }

      if (latestErr && !latest) throw latestErr

      if (latest) {
        let weekList = []
        // Si tiene semana asignada, traer todos los devocionales de esa semana
        if (latest.semana) {
          const { data: weekData, error: weekErr } = await supabase
            .from('devocionales')
            .select('*')
            .eq('semana', latest.semana)
            .order('dia_numero', { ascending: true })
            .order('fecha_asignada', { ascending: true })

          if (!weekErr && weekData && weekData.length > 0) {
            weekList = weekData
          }
        }

        // Si no se encontró lista completa por semana, usar al menos el devocional obtenido
        if (weekList.length === 0) {
          weekList = [latest]
        }

        setWeekDevotionals(weekList)

        // Determinar índice inicial: coincidir con el día de hoy si está presente
        const todayIdx = weekList.findIndex(d => d.fecha_asignada === today)
        if (todayIdx !== -1) {
          setSelectedIndex(todayIdx)
          setActiveTab('day')
        } else {
          setSelectedIndex(0)
          setActiveTab('day')
        }

        // Cargar diarios para saber qué días completó el usuario
        if (user) {
          await fetchWeeklyJournals(weekList.map(d => d.id))
        }
      }
    } catch (err) {
      console.error('Error fetching devocionales:', err.message)
      setErrorMessage('No se pudo cargar el devocional de la semana.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Cargar entradas del diario para todos los devocionales de la semana
  const fetchWeeklyJournals = async (devocionalIds) => {
    if (!user || !devocionalIds || devocionalIds.length === 0) return
    try {
      const { data, error } = await supabase
        .from('devotional_journal')
        .select('*')
        .eq('user_id', user.id)
        .in('devocional_id', devocionalIds)

      if (error) throw error

      const map = {}
      if (data) {
        data.forEach(entry => {
          map[entry.devocional_id] = entry
        })
      }
      setCompletedDaysMap(map)

      // Cargar el diario del día actualmente seleccionado
      const curId = weekDevotionals[selectedIndex]?.id || devocionalIds[selectedIndex]
      if (curId && map[curId]) {
        populateJournalState(map[curId])
      }
    } catch (err) {
      console.error('Error fetching weekly journals:', err)
    }
  }

  // Cargar estado de journal al cambiar de día
  const populateJournalState = (entry) => {
    if (!entry) {
      setJournal({
        gratitud_1: '',
        gratitud_2: '',
        gratitud_3: '',
        oracion_personal: '',
        accion_completada: false,
        apreciacion: '',
        cambios: ''
      })
      return
    }

    // Si tiene campos nuevos de gratitud
    let g1 = entry.gratitud_1 || ''
    let g2 = entry.gratitud_2 || ''
    let g3 = entry.gratitud_3 || ''

    // Si no estaban los nuevos campos pero hay apreciación con formato '1. ... \n 2. ...'
    if (!g1 && !g2 && !g3 && entry.apreciacion) {
      const lines = entry.apreciacion.split('\n')
      g1 = lines[0]?.replace(/^[0-9]\.\s*/, '') || ''
      g2 = lines[1]?.replace(/^[0-9]\.\s*/, '') || ''
      g3 = lines[2]?.replace(/^[0-9]\.\s*/, '') || ''
    }

    setJournal({
      gratitud_1: g1,
      gratitud_2: g2,
      gratitud_3: g3,
      oracion_personal: entry.oracion_personal || '',
      accion_completada: !!entry.accion_completada || (entry.cambios?.includes('Acción') || false),
      apreciacion: entry.apreciacion || '',
      cambios: entry.cambios || ''
    })
  }

  // Cargar estadísticas del perfil (racha y puntos)
  const fetchUserStats = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('racha_actual, puntos_totales')
        .eq('id', user.id)
        .maybeSingle()

      if (data && !error) {
        setUserStats({
          racha_actual: data.racha_actual || 0,
          puntos_totales: data.puntos_totales || 0
        })
      }
    } catch (err) {
      console.error('Error fetching user stats:', err)
    }
  }

  useEffect(() => {
    fetchDevotionals()
    if (user) fetchUserStats()
  }, [user])

  // Actualizar el diario cuando se cambie de día seleccionado
  useEffect(() => {
    if (currentDevocional && completedDaysMap[currentDevocional.id]) {
      populateJournalState(completedDaysMap[currentDevocional.id])
    } else {
      populateJournalState(null)
    }
  }, [selectedIndex, weekDevotionals])

  // Guardar diario y actualizar racha
  const handleSaveJournal = async (e) => {
    if (e) e.preventDefault()
    if (!user || !currentDevocional) return

    setSaving(true)
    setSaveSuccess(false)
    setErrorMessage('')

    try {
      // Concatenar gratitudes para apreciacion (compatibilidad con apps previas)
      const apreciacionComp = [
        journal.gratitud_1 ? `1. ${journal.gratitud_1}` : '',
        journal.gratitud_2 ? `2. ${journal.gratitud_2}` : '',
        journal.gratitud_3 ? `3. ${journal.gratitud_3}` : ''
      ].filter(Boolean).join('\n') || journal.apreciacion

      const cambiosComp = journal.accion_completada ? 'Acción diaria realizada' : journal.cambios

      // Llamar al RPC completar_devocional
      const { error } = await supabase.rpc('completar_devocional', {
        p_devocional_id: currentDevocional.id,
        p_apreciacion: apreciacionComp,
        p_cambios: cambiosComp,
        p_oracion_personal: journal.oracion_personal,
        p_gratitud_1: journal.gratitud_1,
        p_gratitud_2: journal.gratitud_2,
        p_gratitud_3: journal.gratitud_3,
        p_accion_completada: journal.accion_completada
      })

      if (error) {
        // Si el RPC falla por firma de parámetros antigua en Supabase, intentar con firma base
        console.warn('Fallback a RPC base:', error.message)
        const fallback = await supabase.rpc('completar_devocional', {
          p_devocional_id: currentDevocional.id,
          p_apreciacion: apreciacionComp || 'Completado',
          p_cambios: cambiosComp || 'Completado',
          p_oracion_personal: journal.oracion_personal || 'Completado'
        })
        if (fallback.error) throw fallback.error
      }

      // Actualizar mapa local de días completados
      setCompletedDaysMap(prev => ({
        ...prev,
        [currentDevocional.id]: {
          ...journal,
          devocional_id: currentDevocional.id
        }
      }))

      await fetchUserStats()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err) {
      console.error('Error saving journal:', err.message)
      setErrorMessage('No se pudo guardar la reflexión. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // Compartir formato devocional por WhatsApp
  const handleShareWhatsApp = () => {
    if (!currentDevocional) return

    const diaLabel = currentDevocional.dia_nombre && currentDevocional.dia_numero 
      ? `*${currentDevocional.dia_nombre.toUpperCase()} · DÍA ${currentDevocional.dia_numero}*`
      : `*Semana ${currentDevocional.semana || ''}*`

    const shareText = 
`📖 *Devocional IBVN · Libro de Bolsillo*
${diaLabel}

*${currentDevocional.titulo}*
${currentDevocional.texto_biblico}

*Comentario Pastoral:*
${currentDevocional.reflexion}

${currentDevocional.gratitud_pregunta ? `✨ *Gratitud:* ${currentDevocional.gratitud_pregunta}\n` : ''}
${currentDevocional.oracion ? `🙏 *Oración:* ${currentDevocional.oracion}\n` : ''}
${currentDevocional.accion ? `🎯 *Acción de Hoy:* ${currentDevocional.accion}\n` : ''}
---
${currentDevocional.sermon_titulo ? `Sermón: «${currentDevocional.sermon_titulo}» · ${currentDevocional.sermon_predicador || 'IBVN'}\n` : ''}📱 _Lee y completa tu diario en:_ https://vidanueva.app/`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
        .then(() => alert('¡Devocional copiado al portapapeles listo para compartir!'))
        .catch(() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank'))
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank')
    }
  }

  // Imprimir / Guardar como PDF
  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Cargando devocional semanal...
        </p>
      </div>
    )
  }

  if (weekDevotionals.length === 0) {
    return (
      <div className="glass rounded-3xl p-8 text-center max-w-xl mx-auto my-12 border border-slate-200 dark:border-slate-800">
        <BookOpen className="w-16 h-16 text-emerald-600/50 mx-auto mb-4" />
        <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
          Aún no hay devocionales publicados
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Los devocionales en formato libro de bolsillo se publican cada semana tras el sermón dominical.
        </p>
      </div>
    )
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const sermonTitle = currentDevocional?.sermon_titulo || weekDevotionals[0]?.sermon_titulo || weekDevotionals[0]?.titulo
  const sermonPreacher = currentDevocional?.sermon_predicador || weekDevotionals[0]?.sermon_predicador || 'Pastor IBVN'
  const sermonDate = currentDevocional?.sermon_fecha || weekDevotionals[0]?.sermon_fecha || weekDevotionals[0]?.fecha_asignada || ''
  const sermonBaseText = currentDevocional?.sermon_texto_base || weekDevotionals[0]?.sermon_texto_base || 'Salmo 1:3'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* 1. BARRA SUPERIOR: ESTADÍSTICAS Y ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e3f32] text-emerald-100 flex items-center justify-center shadow-xs">
            <TreePine className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
              Devocional Semanal IBVN
            </span>
            <h1 className="text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
              {currentDevocional?.sermon_titulo ? currentDevocional.sermon_titulo : `Semana ${currentDevocional?.semana || ''}`}
            </h1>
          </div>
        </div>

        {/* Rachas, Puntos y Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2.5">
          {user && (
            <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Racha: {userStats.racha_actual} d</span>
              <span className="opacity-40">|</span>
              <span>{userStats.puntos_totales} pts</span>
            </div>
          )}

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            title="Compartir por WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compartir</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            title="Imprimir formato de bolsillo A6"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir (A6)</span>
          </button>
        </div>
      </div>

      {/* 2. SELECTOR DE PESTAÑAS: PORTADA + 7 DÍAS DE LA SEMANA */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 hide-scrollbar">
        {/* Pestaña de Portada */}
        <button
          onClick={() => setActiveTab('cover')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'cover'
              ? 'bg-[#183328] text-white shadow-sm ring-2 ring-emerald-500/30'
              : 'bg-white/80 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <TreePine className="w-3.5 h-3.5 text-emerald-400" />
          <span>Portada</span>
        </button>

        {/* 7 Días de Lunes a Domingo */}
        {weekDevotionals.map((dev, idx) => {
          const isSelected = activeTab === 'day' && selectedIndex === idx
          const isToday = dev.fecha_asignada === todayStr
          const isCompleted = !!completedDaysMap[dev.id]
          const dayName = dev.dia_nombre 
            ? dev.dia_nombre.substring(0, 3).toUpperCase()
            : `DÍA`
          const dayNum = dev.dia_numero || (idx + 1)

          return (
            <button
              key={dev.id || idx}
              onClick={() => {
                setSelectedIndex(idx)
                setActiveTab('day')
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#183328] text-white shadow-sm ring-2 ring-emerald-500/30'
                  : 'bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <span>{dayName} · {dayNum}</span>
              
              {/* Checkmark si fue completado */}
              {isCompleted && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}

              {/* Indicador de "Hoy" */}
              {isToday && !isCompleted && (
                <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30 animate-pulse"></span>
              )}
            </button>
          )
        })}
      </div>

      {/* 3. VISTA 1: PORTADA ESTILO LIBRO DE BOLSILLO */}
      {activeTab === 'cover' && (
        <div className="bg-[#183328] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-emerald-900/40 text-center relative overflow-hidden print-page">
          {/* Fondo sutil con resplandor */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-lg mx-auto space-y-6">
            <div className="flex flex-col items-center">
              <img 
                src="/logo-ibvn.png" 
                alt="Logo IBVN" 
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultLogo; }}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md mb-3" 
              />
              <p className="text-[11px] font-semibold tracking-[0.25em] text-emerald-200/80 uppercase">
                Iglesia Bautista Vida Nueva
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold font-serif tracking-tight mt-1 text-white">
                Devocional
              </h2>
              <p className="text-xs tracking-[0.4em] text-emerald-300 font-light mt-0.5 uppercase">
                Semanal
              </p>
            </div>

            {/* Versículo temático de Salmo 1:3 */}
            <p className="text-xs sm:text-sm text-emerald-100/90 italic leading-relaxed px-4 font-serif">
              «Será como el árbol plantado junto a arroyos de aguas, que da su fruto en su tiempo, y su hoja no cae.»
              <span className="block not-italic text-emerald-300 font-medium text-xs mt-1">
                — Salmo 1:3
              </span>
            </p>

            {/* Ilustración del árbol */}
            <div className="py-2">
              <TreeIllustration className="w-52 h-52 sm:w-60 sm:h-60 mx-auto filter drop-shadow-md" />
            </div>

            {/* Datos del sermón semanal */}
            <div className="pt-2 border-t border-emerald-800/60 space-y-2">
              <span className="inline-block bg-[#e07a2c] text-white text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-xs">
                Sermón de la semana
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-wide">
                [{sermonTitle}]
              </h3>
              <p className="text-xs text-emerald-200/80">
                {sermonDate ? `Fecha: ${sermonDate} · ` : ''} 
                {sermonPreacher ? `${sermonPreacher} · ` : ''} 
                <span className="text-emerald-100 font-medium">{sermonBaseText}</span>
              </p>
            </div>

            {/* Botón para comenzar devocional */}
            <div className="pt-4 no-print">
              <button
                onClick={() => {
                  setActiveTab('day')
                  setSelectedIndex(0)
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm tracking-wide transition-all shadow-lg active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Abrir Devocional Diario</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. VISTA 2: DÍA ESPECÍFICO ESTILO LIBRO DE BOLSILLO (A6) */}
      {activeTab === 'day' && currentDevocional && (
        <div className="space-y-6">
          
          {/* TARJETA PRINCIPAL DEL DEVOCIONAL (DISEÑO POCKETBOOK) */}
          <div className="bg-[#fbfbf9] dark:bg-[#121c17] text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-10 border border-[#e5e2d8] dark:border-[#1e3328] shadow-md relative overflow-hidden print-page">
            
            {/* Cabecera del día */}
            <div className="flex items-center justify-between border-b border-[#ece8dc] dark:border-slate-800/80 pb-4 mb-6">
              <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#2d5e46] dark:text-emerald-400 uppercase font-sans">
                IBVN devocional
              </span>
              <span className="bg-[#183328] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                {currentDevocional.dia_nombre 
                  ? `${currentDevocional.dia_nombre.toUpperCase()} · DÍA ${currentDevocional.dia_numero || (selectedIndex + 1)}`
                  : `DÍA ${selectedIndex + 1}`}
              </span>
            </div>

            {/* Título del Día (máximo 7 palabras) */}
            <div className="space-y-3 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#183328] dark:text-emerald-100 leading-tight">
                {cleanDisplayText(currentDevocional.titulo)}
              </h2>

              {/* Texto Bíblico con Referencia */}
              <div className="border-l-3 border-[#2d5e46] pl-4 py-1">
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 italic font-serif leading-relaxed">
                  {cleanDisplayText(currentDevocional.texto_biblico)}
                </p>
              </div>
            </div>

            {/* Comentario Pastoral al estilo Spurgeon (110-130 palabras) */}
            <div className="text-slate-800 dark:text-slate-200 leading-relaxed text-sm sm:text-base text-justify whitespace-pre-line mb-8 font-sans">
              {cleanDisplayText(currentDevocional.reflexion)}
            </div>

            {/* Divisor ornamental de arroyos de aguas */}
            <div className="w-full flex items-center justify-center my-6 opacity-30">
              <svg className="w-36 h-3 text-[#2d5e46]" viewBox="0 0 100 8" fill="none">
                <path d="M0 4 Q 25 0, 50 4 T 100 4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>

            {/* 3 SECCIONES ACTIVAS: GRATITUD, ORACIÓN, ACCIÓN */}
            <div className="space-y-6 pt-2">
              
              {/* 1. GRATITUD */}
              <div className="space-y-3 bg-[#f6f4ee] dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-[#e8e4d8] dark:border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#e07a2c] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                    Gratitud
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {cleanDisplayText(currentDevocional.gratitud_pregunta) || '¿Dónde viste hoy la fidelidad de Dios?'}
                  </span>
                </div>

                {/* 3 Líneas de Gratitud para escribir */}
                <div className="space-y-2 pt-1">
                  {[1, 2, 3].map((num) => {
                    const key = `gratitud_${num}`
                    return (
                      <div key={num} className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#e07a2c]/15 text-[#e07a2c] font-bold text-[11px] flex items-center justify-center shrink-0">
                          {num}
                        </span>
                        <input
                          type="text"
                          value={journal[key]}
                          onChange={(e) => setJournal({ ...journal, [key]: e.target.value })}
                          placeholder={user ? `Motivo de gratitud ${num}...` : 'Inicia sesión para registrar tu gratitud diaria'}
                          disabled={!user}
                          className="flex-1 bg-white dark:bg-slate-950/70 border-b border-dashed border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#e07a2c] transition-colors"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 2. ORACIÓN */}
              <div className="space-y-3 bg-[#eef4f6] dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-[#dae6ea] dark:border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#0e7490] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                    Oración
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {cleanDisplayText(currentDevocional.oracion) || 'Por las necesidades de tu prójimo y tu corazón'}
                  </span>
                </div>

                <div className="pt-1">
                  <textarea
                    rows="2"
                    value={journal.oracion_personal}
                    onChange={(e) => setJournal({ ...journal, oracion_personal: e.target.value })}
                    placeholder={user ? "Escribe aquí tu petición u oración guiada..." : "Inicia sesión para guardar tu oración personal"}
                    disabled={!user}
                    className="w-full bg-white dark:bg-slate-950/70 border border-[#cfe0e6] dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0e7490] leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* 3. ACCIÓN DE HOY */}
              <div className="space-y-3 bg-[#eaf4ed] dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-[#d6e8db] dark:border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#15803d] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                    Acción de hoy
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {cleanDisplayText(currentDevocional.accion) || 'Un paso pequeño y concreto para hoy'}
                  </span>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={journal.accion_completada}
                      onChange={(e) => setJournal({ ...journal, accion_completada: e.target.checked })}
                      disabled={!user}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      journal.accion_completada 
                        ? 'bg-[#15803d] border-[#15803d] text-white shadow-2xs' 
                        : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700'
                    }`}>
                      {journal.accion_completada && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-medium ${journal.accion_completada ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {journal.accion_completada ? '¡Acción diaria completada hoy!' : 'Marcar como realizada hoy'}
                    </span>
                  </label>
                </div>
              </div>

            </div>

            {/* Pie de página con datos del sermón y número de página A6 */}
            <div className="flex items-center justify-between border-t border-[#ece8dc] dark:border-slate-800/80 pt-4 mt-8 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="truncate pr-2">
                Sermón: «{sermonTitle}» · {sermonPreacher} · {sermonDate}
              </div>
              <div className="w-6 h-6 rounded-full bg-[#183328] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {currentDevocional.dia_numero || (selectedIndex + 1)}
              </div>
            </div>

          </div>

          {/* MENSAJES DE GUARDADO Y BOTONES DE ACCIÓN */}
          <div className="no-print space-y-3">
            {errorMessage && (
              <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>¡Reflexión guardada con éxito! Tu racha devocional se ha actualizado. 🔥</span>
              </div>
            )}

            {!user ? (
              <div className="text-center p-6 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <BookOpen className="w-8 h-8 text-emerald-600/60 mx-auto" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Diario Devocional Privado
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
                  Inicia sesión para guardar tus motivos de gratitud, notas de oración y llevar tu racha espiritual.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  Iniciar Sesión
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (selectedIndex > 0) setSelectedIndex(selectedIndex - 1)
                      else setActiveTab('cover')
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Día anterior</span>
                  </button>

                  <button
                    onClick={() => {
                      if (selectedIndex < weekDevotionals.length - 1) {
                        setSelectedIndex(selectedIndex + 1)
                      }
                    }}
                    disabled={selectedIndex >= weekDevotionals.length - 1}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleSaveJournal}
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#183328] hover:bg-[#204537] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin text-emerald-300" />
                      <span>Guardando en tu diario...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-emerald-300" />
                      <span>Guardar Reflexión & Racha</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}
