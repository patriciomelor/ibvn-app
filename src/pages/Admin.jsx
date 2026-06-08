import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { BookOpen, UserCheck, ShieldAlert, Award, Save, PlusCircle, Search, Edit2, Loader, CheckCircle } from 'lucide-react'

export default function Admin() {
  const { isPastorAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('devocional')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Datos del Formulario Devocional
  const [semana, setSemana] = useState(new Date().getWeek ? new Date().getWeek() : 23)
  const [titulo, setTitulo] = useState('')
  const [textoBiblico, setTextoBiblico] = useState('')
  const [reflexion, setReflexion] = useState('')
  const [oracion, setOracion] = useState('')

  // Datos de Miembros y Configuración
  const [profiles, setProfiles] = useState([])
  const [celulas, setCelulas] = useState([])
  const [ministerios, setMinisterios] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // Estado del usuario editando en CRM
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUserSpiritual, setSelectedUserSpiritual] = useState(null)

  // Cargar datos administrativos
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

  // Cargar progreso espiritual para un miembro seleccionado
  const handleSelectUserEdit = async (member) => {
    setSelectedUser(member)
    setSelectedUserSpiritual(null)
    
    try {
      const { data, error } = await supabase
        .from('spiritual_records')
        .select('*')
        .eq('user_id', member.id)
        .maybeSingle()

      if (error) throw error
      setSelectedUserSpiritual(data || {
        user_id: member.id,
        bautizado: false,
        fecha_bautismo: null,
        conectar: false,
        crecer: false,
        intro_lid: false,
        dones: false,
        aplicadas: false
      })
    } catch (err) {
      console.error('Error loading spiritual record:', err.message)
    }
  }

  // Guardar Cambios del Perfil de Miembro (Rol, Célula, Ministerio)
  const handleUpdateMemberConfig = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      // 1. Actualizar perfil básico (Rol, célula, ministerio)
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          rol: selectedUser.rol,
          celula_id: selectedUser.celula_id || null,
          ministerio_id: selectedUser.ministerio_id || null
        })
        .eq('id', selectedUser.id)

      if (profErr) throw profErr

      // 2. Actualizar registro espiritual (Clases)
      if (selectedUserSpiritual) {
        const { error: spErr } = await supabase
          .from('spiritual_records')
          .upsert(selectedUserSpiritual)

        if (spErr) throw spErr
      }

      setSuccessMessage(`¡Miembro ${selectedUser.nombre} actualizado con éxito!`)
      setSelectedUser(null)
      setSelectedUserSpiritual(null)
      await loadAdminData() // Recargar listado
    } catch (err) {
      console.error(err)
      setErrorMessage('Ocurrió un error al actualizar el miembro.')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar lista de perfiles
  const filteredProfiles = profiles.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div>
        <h2 className="text-3xl font-bold font-display text-white tracking-tight">Panel de Administración</h2>
        <p className="text-slate-400 text-sm mt-1">Sube contenido semanal y gestiona roles y progreso del discipulado.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => { setActiveTab('devocional'); setSelectedUser(null); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'devocional'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Publicar Devocional</span>
        </button>
        <button
          onClick={() => { setActiveTab('miembros'); setSelectedUser(null); }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'miembros'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Gestionar Miembros</span>
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

      {/* CONTENIDO DE TAB 1: PUBLICAR DEVOCIONAL */}
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

      {/* CONTENIDO DE TAB 2: GESTIONAR MIEMBROS */}
      {activeTab === 'miembros' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Listado de Miembros */}
          <div className="lg:col-span-2 glass rounded-3xl p-6 border border-slate-850 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold font-display text-white">Catastro de Personas</h3>
              
              {/* Buscador */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar miembro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Nombre</th>
                    <th className="py-3 px-2 hidden sm:table-cell">Célula / Ministerio</th>
                    <th className="py-3 px-2">Rol</th>
                    <th className="py-3 px-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredProfiles.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 px-2">
                        <p className="font-semibold text-slate-200">{member.nombre}</p>
                        <p className="text-[10px] text-slate-500">{member.email}</p>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <p className="text-slate-300 font-medium">{member.celulas?.nombre || 'Sin Célula'}</p>
                        <p className="text-[10px] text-indigo-400 font-semibold">{member.ministerios?.nombre || 'Sin Min.'}</p>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          member.rol === 'pastor_admin'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : member.rol === 'lider'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}>
                          {member.rol}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleSelectUserEdit(member)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-700/50"
                          title="Editar Ficha"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulario de Edición Lateral (CRM Pastoral / Discipulado) */}
          <div className="space-y-6">
            {selectedUser ? (
              <div className="glass rounded-3xl p-6 border border-indigo-500/30 shadow-lg shadow-indigo-950/20 space-y-6 animate-fade-in">
                <div className="border-b border-slate-850 pb-4">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Editando Ficha</span>
                  <h4 className="text-lg font-bold font-display text-white">{selectedUser.nombre}</h4>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>

                <form onSubmit={handleUpdateMemberConfig} className="space-y-5">
                  {/* Cambiar Rol */}
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                      Rol de Acceso
                    </label>
                    <select
                      value={selectedUser.rol}
                      onChange={(e) => setSelectedUser({ ...selectedUser, rol: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="miembro">Miembro / Asistente</option>
                      <option value="lider">Líder Ministerial</option>
                      <option value="pastor_admin">Pastor / Administrador</option>
                    </select>
                  </div>

                  {/* Asignar Célula */}
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                      Asignar Célula
                    </label>
                    <select
                      value={selectedUser.celula_id || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, celula_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="">Sin Asignar</option>
                      {celulas.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Asignar Ministerio */}
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                      Asignar Ministerio
                    </label>
                    <select
                      value={selectedUser.ministerio_id || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, ministerio_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="">Sin Asignar</option>
                      {ministerios.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Estatus Espiritual (CRM Pastoral) */}
                  <div className="border-t border-slate-850 pt-4 space-y-3">
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Requisitos de Liderazgo</span>
                    </label>
                    
                    {selectedUserSpiritual ? (
                      <div className="space-y-2.5">
                        {[
                          { key: 'bautizado', label: 'Bautizado' },
                          { key: 'conectar', label: 'Clase 1: Conectar' },
                          { key: 'crecer', label: 'Clase 2: Crecer' },
                          { key: 'intro_lid', label: 'Clase 3: Intro Liderazgo' },
                          { key: 'dones', label: 'Clase 4: Descubre Dones' },
                          { key: 'aplicadas', label: 'Clase 5: Herr. Aplicadas' }
                        ].map((chk) => (
                          <label key={chk.key} className="flex items-center space-x-2 text-slate-300 text-xs cursor-pointer hover:text-slate-100">
                            <input
                              type="checkbox"
                              checked={selectedUserSpiritual[chk.key]}
                              onChange={(e) => setSelectedUserSpiritual({
                                ...selectedUserSpiritual,
                                [chk.key]: e.target.checked
                              })}
                              className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900 w-4 h-4 cursor-pointer"
                            />
                            <span>{chk.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <Loader className="w-4 h-4 text-indigo-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 border-t border-slate-850 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl text-xs font-display"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedUser(null); setSelectedUserSpiritual(null); }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 py-2 px-3 rounded-xl text-xs font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="glass rounded-3xl p-6 border border-slate-850 text-center py-12">
                <UserCheck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-xs font-semibold">Selecciona un miembro de la lista para editar su ficha o clases.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
