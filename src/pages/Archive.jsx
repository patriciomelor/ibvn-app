import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Search, Calendar, ChevronDown, ChevronUp, BookOpen, Clock, Loader } from 'lucide-react'

export default function Archive() {
  const { user } = useAuth()
  const [devocionales, setDevocionales] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [journalEntry, setJournalEntry] = useState(null)
  const [loadingJournal, setLoadingJournal] = useState(false)

  // Cargar todos los devocionales
  const fetchDevocionales = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('devocionales')
        .select('*')
        .order('published_at', { ascending: false })

      if (error) throw error
      setDevocionales(data || [])
    } catch (err) {
      console.error('Error fetching archive:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevocionales()
  }, [])

  // Cargar diario del usuario al expandir un devocional
  const handleToggleExpand = async (devocionalId) => {
    if (expandedId === devocionalId) {
      setExpandedId(null)
      setJournalEntry(null)
      return
    }

    setExpandedId(devocionalId)
    setJournalEntry(null)

    if (!user) return

    try {
      setLoadingJournal(true)
      const { data, error } = await supabase
        .from('devotional_journal')
        .select('*')
        .eq('user_id', user.id)
        .eq('devocional_id', devocionalId)
        .maybeSingle()

      if (error) throw error
      setJournalEntry(data)
    } catch (err) {
      console.error('Error fetching journal in archive:', err.message)
    } finally {
      setLoadingJournal(false)
    }
  }

  // Filtrar devocionales basados en la búsqueda
  const filteredDevocionales = devocionales.filter((dev) => {
    const titleMatch = dev.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    const textMatch = dev.texto_biblico.toLowerCase().includes(searchTerm.toLowerCase())
    return titleMatch || textMatch
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando archivo histórico...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Archivo Histórico</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Busca y repasa devocionales y tu diario de vida espiritual.</p>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título o pasaje..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Lista de Devocionales */}
      <div className="space-y-4">
        {filteredDevocionales.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No se encontraron devocionales que coincidan con la búsqueda.</p>
          </div>
        ) : (
          filteredDevocionales.map((dev) => {
            const isExpanded = expandedId === dev.id
            return (
              <div
                key={dev.id}
                className={`glass rounded-2xl overflow-hidden border transition-all duration-200 ${
                  isExpanded ? 'border-indigo-500/30 shadow-lg' : 'border-slate-200 dark:border-slate-850 hover:border-slate-750'
                }`}
              >
                {/* Cabecera del Item */}
                <button
                  onClick={() => handleToggleExpand(dev.id)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-900/20 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
                        {dev.titulo}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-medium">
                        <span className="text-indigo-400">{dev.texto_biblico}</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(dev.published_at)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Semana {dev.semana}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Contenido Expandido */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/20 space-y-6 animate-fade-in">
                    
                    {/* Detalles del Devocional */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <div>
                          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">
                            Reflexión
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed text-justify whitespace-pre-line">
                            {dev.reflexion}
                          </p>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-800/40 pt-4">
                          <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                            Oración
                          </span>
                          <p className="text-indigo-200 text-sm leading-relaxed italic">
                            {dev.oracion}
                          </p>
                        </div>
                      </div>

                      {/* Registro del Diario en este devocional */}
                      <div className="bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5">
                        <h5 className="font-bold font-display text-slate-900 dark:text-white text-sm mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                          Mi Diario de ese día
                        </h5>
                        
                        {loadingJournal ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader className="w-5 h-5 text-indigo-500 animate-spin" />
                          </div>
                        ) : journalEntry ? (
                          <div className="space-y-3.5 text-xs">
                            <div>
                              <span className="text-slate-500 font-semibold block mb-0.5">1. ¿Qué me enseñó Dios?</span>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850">
                                {journalEntry.apreciacion}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500 font-semibold block mb-0.5">2. Cosas a cambiar:</span>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850">
                                {journalEntry.cambios}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500 font-semibold block mb-0.5">3. Oración:</span>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 italic">
                                {journalEntry.oracion_personal}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs italic text-center py-4">
                            No registraste ninguna nota en tu diario para este devocional.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
