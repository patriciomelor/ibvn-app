import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { 
  FileText, 
  Search, 
  Download, 
  BookOpen, 
  Layers, 
  Cpu, 
  Loader, 
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Star,
  ChevronDown
} from 'lucide-react'

export default function Recursos() {
  const { user, profile } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [errorMessage, setErrorMessage] = useState('')
  const [openAccordionId, setOpenAccordionId] = useState(null)

  // Cargar biblioteca de recursos
  const fetchResources = async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      
      const { data, error } = await supabase
        .from('recursos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setResources(data || [])
    } catch (err) {
      console.error('Error fetching resources:', err.message)
      setErrorMessage('No se pudieron cargar los recursos de la biblioteca.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [user])

  // Manejar descarga y actualizar contador
  const handleDownload = async (resource) => {
    try {
      const { error } = await supabase
        .rpc('increment_recurso_downloads', { recurso_id: resource.id })

      if (error) throw error
      window.open(resource.file_url, '_blank')
      
      setResources(prev => 
        prev.map(r => r.id === resource.id ? { ...r, downloads_count: (r.downloads_count || 0) + 1 } : r)
      )
    } catch (err) {
      console.error('Error tracking download:', err.message)
      window.open(resource.file_url, '_blank')
    }
  }

  // Comprobar si el usuario tiene permiso para ver el recurso según su rol
  const canAccessResource = (resource) => {
    const userRole = profile?.rol || 'visita'
    const audience = resource.target_audience || 'visita'
    if (userRole === 'pastor_admin' || userRole === 'lider') return true
    if (userRole === 'miembro') return audience === 'visita' || audience === 'miembro'
    return audience === 'visita'
  }

  // Filtrar recursos por permisos de jerarquía de rol
  const accessibleResources = resources.filter(canAccessResource)

  // Filtrar recursos por búsqueda y categoría
  const filteredResources = accessibleResources.filter(res => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      res.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = 
      selectedCategory === 'Todos' || 
      res.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Recursos marcados como destacados accesibles para este usuario
  const featuredResources = accessibleResources.filter(r => r.destacado === true)

  // Obtener categorías únicas
  const categories = ['Todos', 'Manuales', 'Escuela', 'Kit Replicable']

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando biblioteca digital...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabecera */}
      <div>
        <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <FileText className="w-8 h-8 text-indigo-500" />
          <span>Biblioteca Digital y Recursos</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Accede a manuales doctrinales, material académico de la Escuela de Líderes y recursos para la replicación del sistema.
        </p>
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="glass-rose flex items-start space-x-2 p-4 rounded-2xl text-rose-300 text-sm max-w-2xl">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECCIÓN DE RECURSOS DESTACADOS (ADAPTATIVA) */}
      
      {/* CASO 1: 1 SOLO RECURSO DESTACADO -> Formato de Tarjeta Destacada Única */}
      {featuredResources.length === 1 && (() => {
        const item = featuredResources[0]
        return (
          <div className="glass-indigo rounded-3xl p-6 md:p-8 border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>Recurso Destacado</span>
                  </span>
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {item.category === 'Escuela' ? 'Escuela de Líderes' : item.category}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white leading-tight">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed max-w-2xl">
                  {item.description}
                </p>
              </div>

              <div className="flex flex-col justify-center gap-3">
                <button
                  onClick={() => handleDownload(item)}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] text-xs font-display shadow-lg shadow-indigo-950/50"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Recurso</span>
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* CASO 2: MÁS DE 1 RECURSO DESTACADO -> Formato de Lista en Acordeón Desplegable */}
      {featuredResources.length > 1 && (
        <div className="glass-indigo rounded-3xl p-6 md:p-8 border border-indigo-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                Recursos Destacados ({featuredResources.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30">
              Recomendación Pastoral
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {featuredResources.map((item, index) => {
              const isOpen = openAccordionId === item.id || (openAccordionId === null && index === 0)
              return (
                <div 
                  key={item.id} 
                  className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-indigo-500/20 overflow-hidden transition-all shadow-sm"
                >
                  {/* Encabezado del Acordeón */}
                  <button
                    type="button"
                    onClick={() => setOpenAccordionId(isOpen ? 'none' : item.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-indigo-500/5 transition-colors"
                  >
                    <div className="flex items-center space-x-3 pr-4">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                            {item.category === 'Escuela' ? 'Escuela de Líderes' : item.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    <ChevronDown className={`w-5 h-5 text-indigo-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Contenido Desplegable */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-4 animate-fade-in">
                      <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Descargas: {item.downloads_count || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownload(item)}
                          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-indigo-950/30"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Recurso</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Controles de Filtro y Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-850">
        {/* Tabs de Categoría */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-slate-900 dark:text-white font-bold'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800/40'
              }`}
            >
              {cat === 'Escuela' ? 'Escuela de Líderes' : cat}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar recursos por título..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid de Recursos */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850">
          <HelpCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-xs italic">No se encontraron recursos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => {
            // Icono según categoría
            const getCategoryIcon = (cat) => {
              switch (cat) {
                case 'Manuales':
                  return <BookOpen className="w-5 h-5 text-emerald-400" />
                case 'Escuela':
                  return <Layers className="w-5 h-5 text-orange-400" />
                case 'Kit Replicable':
                  return <Cpu className="w-5 h-5 text-indigo-400" />
                default:
                  return <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              }
            }

            return (
              <div 
                key={res.id} 
                className="glass rounded-2xl p-5 border border-slate-200 dark:border-slate-850 flex flex-col justify-between min-h-[200px] hover:border-slate-200 dark:border-slate-800 transition-all hover:translate-y-[-2px] duration-300"
              >
                <div className="space-y-3">
                  {/* Etiqueta y descargas */}
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/20 px-2 py-0.5 rounded-lg border border-indigo-900/10">
                      {getCategoryIcon(res.category)}
                      <span>{res.category === 'Escuela' ? 'Escuela de Líderes' : res.category}</span>
                    </div>
                    <span className="text-slate-500 font-medium font-mono">
                      {res.downloads_count} descargas
                    </span>
                  </div>

                  {/* Título */}
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 font-display leading-tight">
                    {res.title}
                  </h4>

                  {/* Descripción */}
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed text-justify">
                    {res.description}
                  </p>
                </div>

                {/* Botón Descarga */}
                <button
                  onClick={() => handleDownload(res)}
                  className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-indigo-400 py-2.5 rounded-xl text-xs font-semibold mt-4 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Recurso</span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
