import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { BookOpen, UserCheck, ShieldAlert, Award, Save, PlusCircle, Search, Edit2, Loader, CheckCircle, AlertCircle, FileSpreadsheet, Activity, ChevronRight, MessageSquare, Trash2, CheckSquare, FileText, Calendar, ExternalLink } from 'lucide-react'

export default function Admin() {
  const { user, isPastorAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('devocional')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // 1. Datos del Formulario Devocional
  const [semana, setSemana] = useState(23)
  const [titulo, setTitulo] = useState('')
  const [textoBiblico, setTextoBiblico] = useState('')
  const [reflexion, setReflexion] = useState('')
  const [oracion, setOracion] = useState('')

  // 2. Datos de Miembros y Catastro
  const [profiles, setProfiles] = useState([])
  const [celulas, setCelulas] = useState([])
  const [ministerios, setMinisterios] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRol, setFilterRol] = useState('')
  const [filterCelula, setFilterCelula] = useState('')
  const [filterMinisterio, setFilterMinisterio] = useState('')

  // 3. Ficha seleccionada en CRM y sus Sub-pestañas
  const [selectedUser, setSelectedUser] = useState(null)
  const [crmTab, setCrmTab] = useState('info') // info, discipulado, historial, notas
  const [selectedUserSpiritual, setSelectedUserSpiritual] = useState(null)
  const [pastoralNotes, setPastoralNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loadingSubData, setLoadingSubData] = useState(false)

  // 4. Formulario de Nueva Alerta
  const [alertTipo, setAlertTipo] = useState('Inactividad')
  const [alertDesc, setAlertDesc] = useState('')
  const [showAlertForm, setShowAlertForm] = useState(false)

  // 5. Métricas y Alertas Globales
  const [unresolvedAlerts, setUnresolvedAlerts] = useState([])

  // --- NUEVOS ESTADOS MVP 4 DEPORTES Y RECURSOS ---
  const [sports, setSports] = useState([])
  const [sportTitle, setSportTitle] = useState('')
  const [sportDesc, setSportDesc] = useState('')
  const [sportType, setSportType] = useState('Fútbol / Baby Fútbol')
  const [sportDatetime, setSportDatetime] = useState('')
  const [sportPlace, setSportPlace] = useState('')
  const [sportLimitSlots, setSportLimitSlots] = useState(10)
  const [editingSportId, setEditingSportId] = useState(null)

  const [resources, setResources] = useState([])
  const [recursoTitle, setRecursoTitle] = useState('')
  const [recursoDesc, setRecursoDesc] = useState('')
  const [recursoCategory, setRecursoCategory] = useState('Manuales')
  const [recursoFileUrl, setRecursoFileUrl] = useState('')
  const [editingRecursoId, setEditingRecursoId] = useState(null)

  const fetchSportsAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('sports_activities')
        .select(`
          *,
          sports_registrations (
            id,
            profiles (
              nombre
            )
          )
        `)
        .order('datetime', { ascending: true })
      if (error) throw error
      setSports(data || [])
    } catch (err) {
      console.error('Error fetching sports for admin:', err.message)
    }
  }

  const fetchResourcesAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('recursos')
        .order('created_at', { ascending: false })
      if (error) throw error
      setResources(data || [])
    } catch (err) {
      console.error('Error fetching resources for admin:', err.message)
    }
  }

  useEffect(() => {
    if (activeTab === 'deportes') {
      fetchSportsAdmin()
    } else if (activeTab === 'recursos') {
      fetchResourcesAdmin()
    }
  }, [activeTab])

  const handleSaveSport = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const sportData = {
        title: sportTitle,
        description: sportDesc,
        sport_type: sportType,
        datetime: new Date(sportDatetime).toISOString(),
        place: sportPlace,
        limit_slots: parseInt(sportLimitSlots)
      }

      if (editingSportId) {
        const { error } = await supabase
          .from('sports_activities')
          .update(sportData)
          .eq('id', editingSportId)
        if (error) throw error
        setSuccessMessage('¡Actividad deportiva actualizada con éxito!')
      } else {
        const { error } = await supabase
          .from('sports_activities')
          .insert(sportData)
        if (error) throw error
        setSuccessMessage('¡Actividad deportiva creada con éxito!')
      }

      setSportTitle('')
      setSportDesc('')
      setSportType('Fútbol / Baby Fútbol')
      setSportDatetime('')
      setSportPlace('')
      setSportLimitSlots(10)
      setEditingSportId(null)
      await fetchSportsAdmin()
    } catch (err) {
      console.error(err)
      setErrorMessage(err.message || 'Error al guardar la actividad deportiva.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSport = (sport) => {
    setEditingSportId(sport.id)
    setSportTitle(sport.title)
    setSportDesc(sport.description)
    setSportType(sport.sport_type)
    // Convert to datetime-local format
    const dt = new Date(sport.datetime)
    const offset = dt.getTimezoneOffset() * 60000
    const localISOTime = new Date(dt.getTime() - offset).toISOString().slice(0, 16)
    setSportDatetime(localISOTime)
    setSportPlace(sport.place)
    setSportLimitSlots(sport.limit_slots)
  }

  const handleDeleteSport = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta actividad deportiva? Se eliminarán todas las inscripciones asociadas.')) return
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const { error } = await supabase
        .from('sports_activities')
        .delete()
        .eq('id', id)
      if (error) throw error
      setSuccessMessage('Actividad deportiva eliminada con éxito.')
      await fetchSportsAdmin()
    } catch (err) {
      console.error(err)
      setErrorMessage('Error al eliminar la actividad.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRecurso = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const recursoData = {
        title: recursoTitle,
        description: recursoDesc,
        category: recursoCategory,
        file_url: recursoFileUrl
      }

      if (editingRecursoId) {
        const { error } = await supabase
          .from('recursos')
          .update(recursoData)
          .eq('id', editingRecursoId)
        if (error) throw error
        setSuccessMessage('¡Recurso actualizado con éxito!')
      } else {
        const { error } = await supabase
          .from('recursos')
          .insert(recursoData)
        if (error) throw error
        setSuccessMessage('¡Recurso publicado con éxito!')
      }

      setRecursoTitle('')
      setRecursoDesc('')
      setRecursoCategory('Manuales')
      setRecursoFileUrl('')
      setEditingRecursoId(null)
      await fetchResourcesAdmin()
    } catch (err) {
      console.error(err)
      setErrorMessage(err.message || 'Error al guardar el recurso.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditRecurso = (res) => {
    setEditingRecursoId(res.id)
    setRecursoTitle(res.title)
    setRecursoDesc(res.description)
    setRecursoCategory(res.category)
    setRecursoFileUrl(res.file_url)
  }

  const handleDeleteRecurso = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este recurso?')) return
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const { error } = await supabase
        .from('recursos')
        .delete()
        .eq('id', id)
      if (error) throw error
      setSuccessMessage('Recurso eliminado con éxito.')
      await fetchResourcesAdmin()
    } catch (err) {
      console.error(err)
      setErrorMessage('Error al eliminar el recurso.')
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos administrativos generales
  const loadAdminData = async () => {
    if (!isPastorAdmin) return
    try {
      setLoading(true)
      
      // 1. Obtener perfiles de usuarios
      const { data: profs, error: profsErr } = await supabase
        .from('profiles')
        .select('*, celulas(nombre), ministerios(nombre)')
        .order('nombre')
      if (profsErr) throw profsErr
      setProfiles(profs || [])

      // 2. Obtener células
      const { data: cels, error: celsErr } = await supabase
        .from('celulas')
        .select('*')
        .order('nombre')
      if (celsErr) throw celsErr
      setCelulas(cels || [])

      // 3. Obtener ministerios
      const { data: mins, error: minsErr } = await supabase
        .from('ministerios')
        .select('*')
        .order('nombre')
      if (minsErr) throw minsErr
      setMinisterios(mins || [])

      // 4. Obtener alertas no resueltas
      const { data: alrts, error: alrtsErr } = await supabase
        .from('people_alerts')
        .select('*, profiles:user_id(nombre)')
        .eq('resuelta', false)
        .order('created_at', { ascending: false })
      
      if (!alrtsErr) {
        setUnresolvedAlerts(alrts || [])
      }

    } catch (err) {
      console.error('Error loading admin data:', err.message)
      setErrorMessage('No se pudieron cargar los datos de administración.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [isPastorAdmin])

  // Crear Devocional
  const handleCreateDevotional = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('devocionales')
        .insert({
          semana: parseInt(semana),
          titulo,
          texto_biblico: textoBiblico,
          reflexion,
          oracion,
          published_at: new Date().toISOString()
        })

      if (error) throw error

      setSuccessMessage('¡Devocional publicado con éxito en la aplicación!')
      setTitulo('')
      setTextoBiblico('')
      setReflexion('')
      setOracion('')
    } catch (err) {
      console.error(err)
      setErrorMessage('Ocurrió un error al publicar el devocional.')
    } finally {
      setLoading(false)
    }
  }

  // Cargar sub-datos de la ficha seleccionada en CRM (Clases y Notas)
  const handleSelectUserCRM = async (member) => {
    setSelectedUser(member)
    setCrmTab('info')
    setSelectedUserSpiritual(null)
    setPastoralNotes([])
    setNewNote('')
    setShowAlertForm(false)
    setAlertDesc('')

    try {
      setLoadingSubData(true)
      
      // 1. Cargar progreso de discipulado
      const { data: spData, error: spErr } = await supabase
        .from('spiritual_records')
        .select('*')
        .eq('user_id', member.id)
        .maybeSingle()

      if (spErr) throw spErr
      setSelectedUserSpiritual(spData || {
        user_id: member.id,
        bautizado: false,
        fecha_bautismo: null,
        conectar: false,
        crecer: false,
        intro_lid: false,
        dones: false,
        aplicadas: false
      })

      // 2. Cargar notas pastorales privadas
      const { data: notes, error: notesErr } = await supabase
        .from('pastoral_notes')
        .select('*, author:author_id(nombre)')
        .eq('user_id', member.id)
        .order('created_at', { ascending: false })

      if (!notesErr) {
        setPastoralNotes(notes || [])
      }

    } catch (err) {
      console.error('Error fetching sub-data for member:', err.message)
    } finally {
      setLoadingSubData(false)
    }
  }

  // Guardar Cambios en la Ficha del Miembro (Info, Célula, Ministerio, Mentor)
  const handleUpdateMemberConfig = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      // 1. Actualizar perfil básico
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          rol: selectedUser.rol,
          celula_id: selectedUser.celula_id || null,
          ministerio_id: selectedUser.ministerio_id || null,
          mentor_id: selectedUser.mentor_id || null,
          tel: selectedUser.tel,
          direccion: selectedUser.direccion,
          como_llego: selectedUser.como_llego
        })
        .eq('id', selectedUser.id)

      if (profErr) throw profErr

      // 2. Actualizar registro espiritual
      if (selectedUserSpiritual) {
        const { error: spErr } = await supabase
          .from('spiritual_records')
          .upsert(selectedUserSpiritual)

        if (spErr) throw spErr
      }

      setSuccessMessage(`¡Miembro ${selectedUser.nombre} actualizado con éxito!`)
      setSelectedUser(null)
      await loadAdminData() // Recargar listado
    } catch (err) {
      console.error(err)
      setErrorMessage('Ocurrió un error al actualizar el miembro.')
    } finally {
      setLoading(false)
    }
  }

  // Crear una Nota Pastoral Privada
  const handleAddPastoralNote = async (e) => {
    e.preventDefault()
    if (!selectedUser || !newNote.trim()) return
    setLoadingSubData(true)

    try {
      const { error } = await supabase
        .from('pastoral_notes')
        .insert({
          user_id: selectedUser.id,
          author_id: user.id,
          content: newNote.trim()
        })

      if (error) throw error

      setNewNote('')
      // Recargar notas
      const { data: notes } = await supabase
        .from('pastoral_notes')
        .select('*, author:author_id(nombre)')
        .eq('user_id', selectedUser.id)
        .order('created_at', { ascending: false })
      
      setPastoralNotes(notes || [])
    } catch (err) {
      console.error('Error adding note:', err.message)
      setErrorMessage('No se pudo guardar la nota pastoral.')
    } finally {
      setLoadingSubData(false)
    }
  }

  // Crear una Alerta de Seguimiento Pastoral
  const handleAddAlert = async (e) => {
    e.preventDefault()
    if (!selectedUser || !alertDesc.trim()) return
    setLoadingSubData(true)

    try {
      const { error } = await supabase
        .from('people_alerts')
        .insert({
          user_id: selectedUser.id,
          tipo: alertTipo,
          descripcion: alertDesc.trim(),
          resuelta: false,
          created_by: user.id
        })

      if (error) throw error

      setAlertDesc('')
      setShowAlertForm(false)
      setSuccessMessage('Alerta de seguimiento creada.')
      await loadAdminData()
    } catch (err) {
      console.error(err)
      setErrorMessage('Error al crear alerta.')
    } finally {
      setLoadingSubData(false)
    }
  }

  // Marcar Alerta Global como Resuelta
  const handleResolveAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from('people_alerts')
        .update({ resuelta: true })
        .eq('id', alertId)

      if (error) throw error
      
      setSuccessMessage('Alerta resuelta con éxito.')
      await loadAdminData()
    } catch (err) {
      console.error(err)
      setErrorMessage('Error al resolver la alerta.')
    }
  }

  // Exportar Catastro en Formato CSV
  const handleExportCSV = () => {
    if (profiles.length === 0) return

    const headers = [
      'Nombre',
      'Email',
      'Telefono',
      'Direccion',
      'Rol',
      'Celula',
      'Ministerio',
      'Fecha Registro'
    ]

    const rows = profiles.map((p) => [
      p.nombre,
      p.email,
      p.tel || '',
      p.direccion || '',
      p.rol,
      p.celulas?.nombre || 'Ninguna',
      p.ministerios?.nombre || 'Ninguno',
      new Date(p.created_at).toLocaleDateString('es-CL')
    ])

    const csvContent = 
      'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `catastro_miembros_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtrar lista de perfiles
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRol = filterRol ? p.rol === filterRol : true
    const matchesCelula = filterCelula ? p.celula_id === parseInt(filterCelula) : true
    const matchesMinisterio = filterMinisterio ? p.ministerio_id === parseInt(filterMinisterio) : true

    return matchesSearch && matchesRol && matchesCelula && matchesMinisterio
  })

  // Estadísticas básicas
  const statsTotal = profiles.length
  const statsMiembros = profiles.filter(p => p.rol === 'miembro').length
  const statsLideres = profiles.filter(p => p.rol === 'lider').length
  const statsPastores = profiles.filter(p => p.rol === 'pastor_admin').length

  if (!isPastorAdmin) {
    return (
      <div className="glass-rose p-8 rounded-3xl text-center max-w-xl mx-auto my-12 border border-rose-500/20">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold font-display text-white mb-2">Acceso Denegado</h3>
        <p className="text-rose-300/80 text-sm">
          Esta zona es de carácter restringido y solo está disponible para los Pastores y Administradores de la Iglesia Bautista Vida Nueva.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-white tracking-tight">Panel de Administración</h2>
          <p className="text-slate-400 text-sm mt-1">Gestión pastoral integral, publicaciones y estadísticas del ministerio.</p>
        </div>
        
        {/* Exportador */}
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/25 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0 self-start sm:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Catastro CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => { setActiveTab('devocional'); setSelectedUser(null); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'devocional'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Publicar Devocional</span>
        </button>
        <button
          onClick={() => { setActiveTab('crm'); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'crm'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>CRM Pastoral</span>
        </button>
        <button
          onClick={() => { setActiveTab('metricas'); setSelectedUser(null); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'metricas'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Métricas y Alertas ({unresolvedAlerts.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('deportes'); setSelectedUser(null); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'deportes'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Deportes</span>
        </button>
        <button
          onClick={() => { setActiveTab('recursos'); setSelectedUser(null); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'recursos'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Recursos</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="glass-emerald flex items-center space-x-2 p-4 rounded-xl text-emerald-300 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="glass-rose flex items-start space-x-2 p-4 rounded-xl text-rose-300 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: PUBLICAR DEVOCIONAL */}
      {activeTab === 'devocional' && (
        <div className="glass rounded-3xl p-6 border border-slate-850">
          <h3 className="text-lg font-bold font-display text-white mb-6 flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <span>Crear Devocional Semanal</span>
          </h3>

          <form onSubmit={handleCreateDevotional} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Semana del Año
                </label>
                <input
                  type="number"
                  required
                  value={semana}
                  onChange={(e) => setSemana(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Título del Devocional
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="La Fidelidad en el Desierto"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Texto Bíblico Clave (LBLA)
              </label>
              <input
                type="text"
                required
                value={textoBiblico}
                onChange={(e) => setTextoBiblico(e.target.value)}
                placeholder="Génesis 15:6"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Reflexión Pastoral
              </label>
              <textarea
                rows="8"
                required
                value={reflexion}
                onChange={(e) => setReflexion(e.target.value)}
                placeholder="Escribe la reflexión del devocional aquí..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Oración de Cierre / Guía
              </label>
              <textarea
                rows="3"
                required
                value={oracion}
                onChange={(e) => setOracion(e.target.value)}
                placeholder="Señor Jesús, te pedimos..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50 text-sm font-display"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publicar Devocional</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: CRM PASTORAL */}
      {activeTab === 'crm' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Listado y Filtros Avanzados */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-3xl p-5 border border-slate-850 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">Catastro y Búsqueda</h3>
              
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Filtros */}
              <div className="space-y-3 pt-2 border-t border-slate-850">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Filtrar por Rol</label>
                  <select
                    value={filterRol}
                    onChange={(e) => setFilterRol(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="">Todos los roles</option>
                    <option value="miembro">Miembro</option>
                    <option value="lider">Líder</option>
                    <option value="pastor_admin">Pastor</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Filtrar por Célula</label>
                  <select
                    value={filterCelula}
                    onChange={(e) => setFilterCelula(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="">Todas las células</option>
                    {celulas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Filtrar por Ministerio</label>
                  <select
                    value={filterMinisterio}
                    onChange={(e) => setFilterMinisterio(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="">Todos los ministerios</option>
                    {ministerios.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Listado Resultante */}
            <div className="glass rounded-3xl overflow-hidden border border-slate-850 max-h-[350px] overflow-y-auto">
              <div className="divide-y divide-slate-850">
                {filteredProfiles.length === 0 ? (
                  <p className="text-slate-500 text-xs italic text-center py-6">No se encontraron miembros.</p>
                ) : (
                  filteredProfiles.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectUserCRM(member)}
                      className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                        selectedUser?.id === member.id ? 'bg-indigo-600/10' : 'hover:bg-slate-900/20'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">{member.nombre}</p>
                        <span className="text-[10px] text-slate-500 capitalize">{member.rol}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Ficha Detallada del Miembro */}
          <div className="lg:col-span-2 space-y-6">
            {selectedUser ? (
              <div className="glass rounded-3xl p-6 border border-slate-850 space-y-6">
                
                {/* Cabecera Ficha */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 font-display text-lg">
                      {selectedUser.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold font-display text-white leading-tight">{selectedUser.nombre}</h4>
                      <p className="text-xs text-slate-400">{selectedUser.email}</p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 uppercase tracking-wider">
                    {selectedUser.rol}
                  </span>
                </div>

                {/* Sub-Tabs de Ficha */}
                <div className="flex border-b border-slate-850 gap-4 text-xs font-semibold">
                  {[
                    { id: 'info', label: 'Información' },
                    { id: 'discipulado', label: 'Discipulado' },
                    { id: 'historial', label: 'Historial / Vida' },
                    { id: 'notas', label: 'Notas Pastorales' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCrmTab(tab.id)}
                      className={`pb-2 border-b-2 transition-all ${
                        crmTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* SUB-TAB A: INFORMACIÓN DE FICHA */}
                {crmTab === 'info' && (
                  <form onSubmit={handleUpdateMemberConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Teléfono</label>
                      <input
                        type="text"
                        value={selectedUser.tel || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, tel: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Dirección</label>
                      <input
                        type="text"
                        value={selectedUser.direccion || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, direccion: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Asignar Célula</label>
                      <select
                        value={selectedUser.celula_id || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, celula_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                      >
                        <option value="">Sin Asignar</option>
                        {celulas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Asignar Ministerio</label>
                      <select
                        value={selectedUser.ministerio_id || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, ministerio_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                      >
                        <option value="">Sin Asignar</option>
                        {ministerios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">¿Cómo llegó a la Iglesia?</label>
                      <input
                        type="text"
                        value={selectedUser.como_llego || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, como_llego: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-850 flex items-center justify-between">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 text-xs font-display"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </button>

                      {/* Botón para crear alerta rápida */}
                      <button
                        type="button"
                        onClick={() => setShowAlertForm(!showAlertForm)}
                        className="flex items-center space-x-1 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl hover:bg-rose-500/20 transition-all"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Crear Alerta de Seguimiento</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* FORMULARIO OCULTO DE NUEVA ALERTA DE SEGUIMIENTO */}
                {showAlertForm && crmTab === 'info' && (
                  <form onSubmit={handleAddAlert} className="glass-rose p-4 rounded-2xl border border-rose-500/25 space-y-4 animate-fade-in">
                    <h5 className="font-bold text-xs text-rose-300 uppercase tracking-wide">Nueva Alerta de Seguimiento Pastoral</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">Categoría</label>
                        <select
                          value={alertTipo}
                          onChange={(e) => setAlertTipo(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-2.5 text-slate-200 focus:outline-none text-xs"
                        >
                          <option value="Inactividad">Inactividad</option>
                          <option value="Apoyo Espiritual">Apoyo Espiritual</option>
                          <option value="Enfermedad">Salud / Enfermedad</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">Descripción del caso</label>
                        <input
                          type="text"
                          required
                          value={alertDesc}
                          onChange={(e) => setAlertDesc(e.target.value)}
                          placeholder="Hermano ausente en células por 3 semanas consecutivas..."
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-2.5 text-slate-200 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="submit"
                        className="bg-rose-600 hover:bg-rose-500 text-white font-medium py-1.5 px-4 rounded-lg text-xs"
                      >
                        Crear Alerta
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAlertForm(false)}
                        className="bg-slate-800 text-slate-300 border border-slate-700 py-1.5 px-3 rounded-lg text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-TAB B: DISCIPULADO Y MENTORES */}
                {crmTab === 'discipulado' && (
                  <form onSubmit={handleUpdateMemberConfig} className="space-y-6 animate-fade-in">
                    
                    {/* Asignación de Rol y Mentor */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Rol del Miembro</label>
                        <select
                          value={selectedUser.rol}
                          onChange={(e) => setSelectedUser({ ...selectedUser, rol: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                        >
                          <option value="miembro">Miembro / Asistente</option>
                          <option value="lider">Líder de Ministerio / Célula</option>
                          <option value="pastor_admin">Pastor / Administrador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Mentor Espiritual</label>
                        <select
                          value={selectedUser.mentor_id || ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, mentor_id: e.target.value || null })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                        >
                          <option value="">Sin Asignar</option>
                          {profiles
                            .filter(p => (p.rol === 'lider' || p.rol === 'pastor_admin') && p.id !== selectedUser.id)
                            .map(p => (
                              <option key={p.id} value={p.id}>{p.nombre} ({p.rol === 'pastor_admin' ? 'Pastor' : 'Líder'})</option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Hitos y Clases */}
                    <div className="border-t border-slate-850 pt-4 space-y-4">
                      <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                        <Award className="w-4 h-4 text-indigo-400" />
                        <span>Requisitos Aprobados</span>
                      </label>

                      {loadingSubData ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
                        </div>
                      ) : selectedUserSpiritual ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {[
                            { key: 'bautizado', label: 'Bautizado en Agua' },
                            { key: 'conectar', label: 'Clase 1: Conectar' },
                            { key: 'crecer', label: 'Clase 2: Crecer' },
                            { key: 'intro_lid', label: 'Clase 3: Intro al Liderazgo' },
                            { key: 'dones', label: 'Clase 4: Descubre tus Dones' },
                            { key: 'aplicadas', label: 'Clase 5: Herramientas Aplicadas' }
                          ].map((item) => (
                            <label key={item.key} className="flex items-center space-x-2.5 bg-slate-900/55 p-3 rounded-xl border border-slate-850 text-xs font-medium cursor-pointer select-none text-slate-300 hover:text-slate-100">
                              <input
                                type="checkbox"
                                checked={selectedUserSpiritual[item.key]}
                                onChange={(e) => setSelectedUserSpiritual({
                                  ...selectedUserSpiritual,
                                  [item.key]: e.target.checked
                                })}
                                className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900 w-4 h-4 cursor-pointer"
                              />
                              <span>{item.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="pt-4 border-t border-slate-850">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 text-xs font-display"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-TAB C: HISTORIAL Y LÍNEA DE TIEMPO */}
                {crmTab === 'historial' && (
                  <div className="space-y-6 animate-fade-in">
                    <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wide">Línea de Tiempo de Progreso Espiritual</h5>
                    
                    <div className="relative border-l border-slate-800 ml-3.5 pl-6 space-y-6 text-xs">
                      {/* 1. Registro */}
                      <div className="relative">
                        <div className="absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full bg-indigo-500 border-4 border-slate-950"></div>
                        <p className="font-bold text-slate-200">Se registró en la aplicación</p>
                        <p className="text-[10px] text-slate-500">{new Date(selectedUser.created_at).toLocaleDateString('es-CL')}</p>
                      </div>

                      {/* 2. Bautismo */}
                      {selectedUserSpiritual?.bautizado && (
                        <div className="relative">
                          <div className="absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-slate-950"></div>
                          <p className="font-bold text-slate-200">Paso de fe: Bautismo en Agua</p>
                          <p className="text-[10px] text-slate-500">Registrado en la base de discipulado.</p>
                        </div>
                      )}

                      {/* 3. Clases */}
                      {['conectar', 'crecer', 'intro_lid', 'dones', 'aplicadas'].map((clsKey) => {
                        const isDone = selectedUserSpiritual?.[clsKey]
                        if (!isDone) return null
                        
                        const labelMap = {
                          conectar: 'Aprobó Clase 1: Conectar',
                          crecer: 'Aprobó Clase 2: Crecer',
                          intro_lid: 'Aprobó Clase 3: Intro Liderazgo',
                          dones: 'Aprobó Clase 4: Descubre Dones',
                          aplicadas: 'Aprobó Clase 5: Herr. Aplicadas'
                        }
                        
                        return (
                          <div key={clsKey} className="relative">
                            <div className="absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full bg-indigo-500 border-4 border-slate-950"></div>
                            <p className="font-bold text-slate-200">{labelMap[clsKey]}</p>
                            <p className="text-[10px] text-slate-500">Nivel de discipulado aprobado por el equipo de mentores.</p>
                          </div>
                        )
                      })}

                      {/* 4. Ministerio */}
                      {selectedUser.ministerio_id && (
                        <div className="relative">
                          <div className="absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full bg-indigo-400 border-4 border-slate-950"></div>
                          <p className="font-bold text-slate-200">Incorporación ministerial</p>
                          <p className="text-[10px] text-indigo-400 font-semibold">Sirviendo en: {selectedUser.ministerios?.nombre}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-TAB D: NOTAS PASTORALES PRIVADAS */}
                {crmTab === 'notas' && (
                  <div className="space-y-6 animate-fade-in">
                    <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wide">Bitácora de Notas Pastorales (Confidencial)</h5>

                    {/* Redactar Nota */}
                    <form onSubmit={handleAddPastoralNote} className="space-y-3">
                      <textarea
                        rows="3"
                        required
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Registrar notas de consejería, visitas pastorales, o acuerdos de discipulado confidenciales..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
                      />
                      <button
                        type="submit"
                        disabled={loadingSubData || !newNote.trim()}
                        className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-xl text-xs font-display"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Añadir Nota</span>
                      </button>
                    </form>

                    {/* Feed de Notas */}
                    <div className="space-y-4 pt-4 border-t border-slate-850">
                      {loadingSubData ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
                        </div>
                      ) : pastoralNotes.length === 0 ? (
                        <p className="text-slate-500 text-xs italic text-center py-4">No se han registrado notas pastorales para este miembro todavía.</p>
                      ) : (
                        pastoralNotes.map((note) => (
                          <div key={note.id} className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl text-xs space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-850/50 pb-1.5 font-bold">
                              <span>Registrado por: {note.author?.nombre || 'Pastor/Admin'}</span>
                              <span>{new Date(note.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed text-justify whitespace-pre-line">
                              {note.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="glass rounded-3xl p-12 border border-slate-850 text-center py-24">
                <UserCheck className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h4 className="font-bold text-white text-md">Ficha del Miembro</h4>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2">
                  Selecciona a un miembro del catastro de búsqueda lateral para ver su información personal, clases de discipulado, línea de tiempo espiritual y notas de consejería pastoral.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: MÉTRICAS Y ALERTAS */}
      {activeTab === 'metricas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Alertas Pastorales Activas */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">Alertas Pastorales de Seguimiento Activas</h3>
            
            {unresolvedAlerts.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center border border-slate-850">
                <p className="text-slate-500 text-xs italic">No hay alertas de seguimiento activas. ¡Excelente!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unresolvedAlerts.map((alert) => (
                  <div key={alert.id} className="glass-rose rounded-2xl p-5 border border-rose-500/20 flex items-start justify-between gap-4 animate-fade-in text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase">
                          {alert.tipo}
                        </span>
                        <h4 className="font-bold text-white">{alert.profiles?.nombre}</h4>
                      </div>
                      <p className="text-rose-300/80 leading-relaxed text-justify">
                        {alert.descripcion}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Creada el: {new Date(alert.created_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="flex items-center space-x-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 rounded-lg shadow-md transition-all active:scale-95 shrink-0"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Resolver Alerta</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estadísticas Generales */}
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6 border border-slate-850 space-y-4">
              <h3 className="text-md font-bold font-display text-white">Métricas de la Congregación</h3>
              
              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-850/80">
                  <span className="text-xs text-slate-400 font-medium">Registrados Totales</span>
                  <span className="text-sm font-bold text-white">{statsTotal}</span>
                </div>
                
                <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-850/80">
                  <span className="text-xs text-slate-400 font-medium">Miembros / Asistentes</span>
                  <span className="text-sm font-bold text-indigo-400">{statsMiembros}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-850/80">
                  <span className="text-xs text-slate-400 font-medium">Líderes Activos</span>
                  <span className="text-sm font-bold text-indigo-300">{statsLideres}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-850/80">
                  <span className="text-xs text-slate-400 font-medium">Cuerpo Pastoral (Pastores)</span>
                  <span className="text-sm font-bold text-rose-400">{statsPastores}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: GESTIÓN DEPORTES */}
      {activeTab === 'deportes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de Actividad */}
          <div className="glass rounded-3xl p-6 border border-slate-850 h-fit space-y-6">
            <div>
              <h3 className="text-lg font-bold font-display text-white">
                {editingSportId ? 'Editar Actividad' : 'Nueva Actividad'}
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Completa los detalles para convocar a un encuentro o torneo deportivo.
              </p>
            </div>

            <form onSubmit={handleSaveSport} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Título de la Actividad</label>
                <input
                  type="text"
                  required
                  value={sportTitle}
                  onChange={(e) => setSportTitle(e.target.value)}
                  placeholder="Ej: Torneo de Ping Pong Familiar"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-605 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Descripción</label>
                <textarea
                  required
                  rows="3"
                  value={sportDesc}
                  onChange={(e) => setSportDesc(e.target.value)}
                  placeholder="Detalles prácticos, qué llevar, etc..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-605 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">Deporte / Tipo</label>
                  <select
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Fútbol / Baby Fútbol">Fútbol / Baby Fútbol</option>
                    <option value="Senderismo / Trekking">Senderismo / Trekking</option>
                    <option value="Básquetbol">Básquetbol</option>
                    <option value="Recreación Familiar">Recreación Familiar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">Límite de Cupos</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sportLimitSlots}
                    onChange={(e) => setSportLimitSlots(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  required
                  value={sportDatetime}
                  onChange={(e) => setSportDatetime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-805 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Lugar del Evento</label>
                <input
                  type="text"
                  required
                  value={sportPlace}
                  onChange={(e) => setSportPlace(e.target.value)}
                  placeholder="Ej: Gimnasio Bicentenario"
                  className="w-full bg-slate-900 border border-slate-805 rounded-xl p-3 text-slate-200 placeholder-slate-605 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all text-xs font-display flex items-center justify-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSportId ? 'Guardar Cambios' : 'Publicar Actividad'}</span>
                </button>
                {editingSportId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSportId(null)
                      setSportTitle('')
                      setSportDesc('')
                      setSportType('Fútbol / Baby Fútbol')
                      setSportDatetime('')
                      setSportPlace('')
                      setSportLimitSlots(10)
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 py-2.5 px-4 rounded-xl transition-all text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Listado de Actividades Deportivas */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">Actividades Programadas</h3>
            {sports.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center border border-slate-850">
                <p className="text-slate-500 text-xs italic">No hay actividades registradas en la base de datos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sports.map((sport) => {
                  const regCount = sport.sports_registrations?.length || 0
                  return (
                    <div key={sport.id} className="glass rounded-3xl p-6 border border-slate-850 space-y-4">
                      <div className="flex justify-between items-start border-b border-slate-850/60 pb-3">
                        <div>
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">{sport.sport_type}</span>
                          <h4 className="font-bold text-sm text-slate-200 mt-0.5">{sport.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-1">Lugar: {sport.place} | Cupos: {regCount} / {sport.limit_slots}</p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleEditSport(sport)}
                            className="p-1.5 text-indigo-400 hover:bg-indigo-950/40 border border-indigo-500/10 rounded-lg hover:text-indigo-300 transition-all"
                            title="Editar actividad"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSport(sport.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-950/40 border border-rose-500/10 rounded-lg hover:text-rose-300 transition-all"
                            title="Eliminar actividad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lista corta de inscritos */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Inscritos ({regCount}):</span>
                        {regCount === 0 ? (
                          <p className="text-[10.5px] text-slate-500 italic pl-1">Aún no hay inscripciones.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {sport.sports_registrations.map((reg) => (
                              <span 
                                key={reg.id} 
                                className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 px-2.5 py-1 rounded-lg font-medium"
                              >
                                {reg.profiles?.nombre || 'Miembro'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: GESTIÓN RECURSOS */}
      {activeTab === 'recursos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de Recurso */}
          <div className="glass rounded-3xl p-6 border border-slate-850 h-fit space-y-6">
            <div>
              <h3 className="text-lg font-bold font-display text-white">
                {editingRecursoId ? 'Editar Recurso' : 'Nuevo Recurso'}
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Agrega manuales, guías o el kit replicable a la biblioteca digital.
              </p>
            </div>

            <form onSubmit={handleSaveRecurso} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Título del Recurso</label>
                <input
                  type="text"
                  required
                  value={recursoTitle}
                  onChange={(e) => setRecursoTitle(e.target.value)}
                  placeholder="Ej: Manual del Discipulador"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-605 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Descripción Corta</label>
                <textarea
                  required
                  rows="3"
                  value={recursoDesc}
                  onChange={(e) => setRecursoDesc(e.target.value)}
                  placeholder="Breve descripción del contenido del archivo..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-605 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">Categoría</label>
                <select
                  value={recursoCategory}
                  onChange={(e) => setRecursoCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="Manuales">Manuales</option>
                  <option value="Escuela">Escuela de Líderes</option>
                  <option value="Kit Replicable">Kit Replicable</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">URL de Descarga del Archivo</label>
                <input
                  type="url"
                  required
                  value={recursoFileUrl}
                  onChange={(e) => setRecursoFileUrl(e.target.value)}
                  placeholder="https://ejemplo.com/recurso.pdf"
                  className="w-full bg-slate-900 border border-slate-805 rounded-xl p-3 text-slate-200 placeholder-slate-605 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all text-xs font-display flex items-center justify-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingRecursoId ? 'Guardar Cambios' : 'Publicar Recurso'}</span>
                </button>
                {editingRecursoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecursoId(null)
                      setRecursoTitle('')
                      setRecursoDesc('')
                      setRecursoCategory('Manuales')
                      setRecursoFileUrl('')
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 py-2.5 px-4 rounded-xl transition-all text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Listado de Recursos */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">Biblioteca de Recursos</h3>
            {resources.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center border border-slate-850">
                <p className="text-slate-500 text-xs italic">No hay recursos publicados en la base de datos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map((res) => (
                  <div key={res.id} className="glass rounded-3xl p-5 border border-slate-850 flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="bg-indigo-950/20 border border-indigo-900/10 text-indigo-400 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase">
                          {res.category === 'Escuela' ? 'Escuela de Líderes' : res.category}
                        </span>
                        <h4 className="font-bold text-xs text-slate-200">{res.title}</h4>
                      </div>
                      <p className="text-slate-400 text-[10.5px] leading-relaxed">{res.description}</p>
                      <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                        <span>Descargas: {res.downloads_count}</span>
                        <span>•</span>
                        <a 
                          href={res.file_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-indigo-400 hover:underline flex items-center space-x-0.5"
                        >
                          <span>Ver archivo</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleEditRecurso(res)}
                        className="p-1.5 text-indigo-400 hover:bg-indigo-950/40 border border-indigo-500/10 rounded-lg hover:text-indigo-300 transition-all"
                        title="Editar recurso"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecurso(res.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-950/40 border border-rose-500/10 rounded-lg hover:text-rose-300 transition-all"
                        title="Eliminar recurso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
