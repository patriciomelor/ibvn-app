import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Calendar, Save, Share2, Printer, CheckCircle, Loader, AlertCircle } from 'lucide-react'

export default function Devocional() {
  const { user } = useAuth()
  const [devocional, setDevocional] = useState(null)
  const [journal, setJournal] = useState({
    apreciacion: '',
    cambios: '',
    oracion_personal: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 1. Cargar el último devocional publicado
  const fetchLatestDevotional = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('devocionales')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setDevocional(data)
        // 2. Cargar el diario del usuario para este devocional
        await fetchUserJournal(data.id)
      }
    } catch (err) {
      console.error('Error fetching devocional:', err.message)
      setErrorMessage('No se pudo cargar el devocional del día.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Cargar diario del usuario
  const fetchUserJournal = async (devocionalId) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('devotional_journal')
        .select('*')
        .eq('user_id', user.id)
        .eq('devocional_id', devocionalId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setJournal({
          apreciacion: data.apreciacion || '',
          cambios: data.cambios || '',
          oracion_personal: data.oracion_personal || ''
        })
      }
    } catch (err) {
      console.error('Error fetching journal:', err.message)
    }
  }

  useEffect(() => {
    fetchLatestDevotional()
  }, [user])

  // 3. Guardar diario en Supabase
  const handleSaveJournal = async (e) => {
    e.preventDefault()
    if (!user || !devocional) return

    setSaving(true)
    setSaveSuccess(false)
    setErrorMessage('')

    try {
      // Intentar buscar si ya existe para decidir si hacer INSERT o UPDATE (o usar upsert nativo)
      const { error } = await supabase
        .from('devotional_journal')
        .upsert({
          user_id: user.id,
          devocional_id: devocional.id,
          apreciacion: journal.apreciacion,
          cambios: journal.cambios,
          oracion_personal: journal.oracion_personal,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id,devocional_id' })

      if (error) throw error

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving journal:', err.message)
      setErrorMessage('No se pudo guardar la entrada del diario. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // 4. Formatear y copiar al portapapeles para compartir en WhatsApp
  const handleShareWhatsApp = () => {
    if (!devocional) return

    const shareText = 
`📖 *Devocional Diario - Vida Nueva*
*Semana ${devocional.semana}*

*${devocional.titulo}*
_Pasaje: ${devocional.texto_biblico} (LBLA)_

*Reflexión:*
${devocional.reflexion}

*Oración de Guía:*
${devocional.oracion}

---
📱 _Lee el devocional completo y registra tu diario en la app:_
https://vidanueva.app/`

    navigator.clipboard.writeText(shareText)
      .then(() => {
        alert('¡Devocional copiado al portapapeles en formato listo para WhatsApp!')
      })
      .catch((err) => {
        console.error('Error al copiar:', err)
      })
  }

  // 5. Imprimir devocional
  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando devocional del día...</p>
      </div>
    )
  }

  if (!devocional) {
    return (
      <div className="glass rounded-3xl p-8 text-center max-w-xl mx-auto my-12 border border-slate-800">
        <BookOpen className="w-16 h-16 text-indigo-500/50 mx-auto mb-4" />
        <h3 className="text-xl font-bold font-display text-white mb-2">Aún no hay devocionales publicados</h3>
        <p className="text-slate-400 text-sm mb-6">
          Los devocionales diarios se publican de forma semanal. Vuelve pronto para ver la nueva actualización.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* SECCIÓN DE IMPRESIÓN EXCLUSIVA (Oculta en web, visible en print) */}
      <div className="hidden print:block print-card">
        <h1 className="text-2xl font-bold mb-1">{devocional.titulo}</h1>
        <p className="text-sm text-gray-600 mb-4">Pasaje: {devocional.texto_biblico} | Semana {devocional.semana}</p>
        <div className="mb-4">
          <h3 className="font-bold text-md mb-1">Reflexión</h3>
          <p className="text-gray-800 text-justify">{devocional.reflexion}</p>
        </div>
        <div>
          <h3 className="font-bold text-md mb-1">Oración</h3>
          <p className="text-gray-800 italic">{devocional.oracion}</p>
        </div>
      </div>

      {/* VISTA EN PANTALLA */}
      <div className="print:hidden space-y-8">
        
        {/* Cabecera del Devocional */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800/60">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" />
              <span>Semana {devocional.semana}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white leading-tight">
              {devocional.titulo}
            </h2>
          </div>
          
          {/* Botones de acción rápida */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center space-x-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
              title="Copiar para compartir en WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Compartir</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 px-3.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Bloque de Contenido Bíblico y Reflexión */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Texto Bíblico */}
            <div className="glass-indigo rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                Pasaje Bíblico
              </h3>
              <p className="text-xl sm:text-2xl font-semibold text-indigo-300 font-display italic leading-relaxed">
                "{devocional.texto_biblico}"
              </p>
              <span className="text-[10px] text-slate-500 mt-2 block font-medium">La Biblia de las Américas (LBLA)</span>
            </div>

            {/* Reflexión Pastoral */}
            <div className="glass rounded-3xl p-6 border border-slate-850">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
                Reflexión
              </h3>
              <p className="text-slate-200 leading-relaxed text-justify whitespace-pre-line text-sm sm:text-base">
                {devocional.reflexion}
              </p>
            </div>

            {/* Oración Guiada */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 rounded-3xl p-6 border border-indigo-900/10">
              <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
                Oración de Guía
              </h3>
              <p className="text-indigo-200 leading-relaxed italic text-sm sm:text-base">
                {devocional.oracion}
              </p>
            </div>

          </div>

          {/* SECCIÓN DEL DIARIO PERSONAL (Journaling) */}
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6 border border-slate-850 sticky top-6">
              <div className="flex items-center space-x-2 mb-6">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold font-display text-white">Mi Diario Espiritual</h3>
              </div>

              {errorMessage && (
                <div className="glass-rose flex items-start space-x-2 p-3 rounded-xl text-rose-300 text-xs mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="glass-emerald flex items-center space-x-2 p-3 rounded-xl text-emerald-300 text-xs mb-4">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>¡Guardado con éxito!</span>
                </div>
              )}

              <form onSubmit={handleSaveJournal} className="space-y-5">
                
                {/* Bloque 1: Lo que Dios me dijo */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">
                    1. ¿Qué me enseñó Dios hoy? (Apreciación)
                  </label>
                  <textarea
                    rows="3"
                    value={journal.apreciacion}
                    onChange={(e) => setJournal({ ...journal, apreciacion: e.target.value })}
                    placeholder="Escribe lo que el pasaje o la reflexión hablaron a tu corazón..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs leading-relaxed"
                  />
                </div>

                {/* Bloque 2: Cosas a cambiar */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">
                    2. ¿Qué decisiones prácticas debo tomar? (Cambios)
                  </label>
                  <textarea
                    rows="3"
                    value={journal.cambios}
                    onChange={(e) => setJournal({ ...journal, cambios: e.target.value })}
                    placeholder="Acciones o actitudes concretas que Dios te motiva a corregir o iniciar..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs leading-relaxed"
                  />
                </div>

                {/* Bloque 3: Motivos de oración */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">
                    3. Mis Motivos de Oración
                  </label>
                  <textarea
                    rows="3"
                    value={journal.oracion_personal}
                    onChange={(e) => setJournal({ ...journal, oracion_personal: e.target.value })}
                    placeholder="Escribe tus peticiones de oración de hoy..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 text-xs font-display"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar en Diario</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
