import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { User, Phone, MapPin, Calendar, Heart, Shield, CheckCircle, Save, Loader, AlertCircle, Laptop, Sun, Moon } from 'lucide-react'

export default function Profile() {
  const { user, profile, updateProfile } = useAuth()
  const [spiritualRecord, setSpiritualRecord] = useState(null)
  
  // Estados de formulario
  const [nombre, setNombre] = useState('')
  const [tel, setTel] = useState('')
  const [direccion, setDireccion] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [comoLlego, setComoLlego] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Estado del tema
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system')

  // Cargar datos extendidos
  const fetchExtendedData = async () => {
    if (!user) return
    try {
      setLoading(true)
      
      // 1. Cargar datos del perfil
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*, celulas(nombre), ministerios(nombre)')
        .eq('id', user.id)
        .single()

      if (profErr) throw profErr

      if (profData) {
        setNombre(profData.nombre || '')
        setTel(profData.tel || '')
        setDireccion(profData.direccion || '')
        setFechaNacimiento(profData.fecha_nacimiento || '')
        setComoLlego(profData.como_llego || '')
      }

      // 2. Cargar registro espiritual
      const { data: spData, error: spErr } = await supabase
        .from('spiritual_records')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (spErr) throw spErr
      setSpiritualRecord(spData)

    } catch (err) {
      console.error('Error fetching profile data:', err.message)
      setErrorMessage('No se pudieron cargar todos los datos de tu perfil.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExtendedData()
  }, [user])

  // Aplicar tema
  useEffect(() => {
    const root = window.document.documentElement
    
    const applyTheme = (t) => {
      root.classList.remove('light', 'dark')
      
      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
      } else {
        root.classList.add(t)
      }
    }

    applyTheme(theme)
    localStorage.setItem('theme', theme)
    
    // Si es del sistema, escuchar cambios del OS
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleSystemThemeChange = (e) => {
        root.classList.remove('light', 'dark')
        root.classList.add(e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handleSystemThemeChange)
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [theme])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setErrorMessage('')

    try {
      await updateProfile({
        nombre,
        tel,
        direccion,
        fecha_nacimiento: fechaNacimiento || null,
        como_llego: comoLlego
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      setErrorMessage('Ocurrió un error al actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando información del perfil...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div>
        <h2 className="text-3xl font-bold font-display text-white tracking-tight">Mi Perfil</h2>
        <p className="text-slate-400 text-sm mt-1">Administra tus datos personales y sigue tu crecimiento ministerial.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Configuración e Info General */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl p-6 border border-slate-850">
            <h3 className="text-lg font-bold font-display text-white mb-6 flex items-center space-x-2">
              <User className="w-5 h-5 text-indigo-400" />
              <span>Información Personal</span>
            </h3>

            {errorMessage && (
              <div className="glass-rose flex items-start space-x-2 p-4 rounded-xl text-rose-300 text-sm mb-6">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="glass-emerald flex items-center space-x-2 p-4 rounded-xl text-emerald-300 text-sm mb-6">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>¡Perfil guardado con éxito!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Correo Electrónico (No modificable)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl py-3 px-4 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Dirección Residencial
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle Falsa 123, Providencia"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Fecha de Nacimiento
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  ¿Cómo llegaste a la Iglesia?
                </label>
                <input
                  type="text"
                  value={comoLlego}
                  onChange={(e) => setComoLlego(e.target.value)}
                  placeholder="Amigo, redes sociales, familiar, etc."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50 text-sm font-display"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Configuración de Preferencias / Tema */}
          <div className="glass rounded-3xl p-6 border border-slate-850">
            <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center space-x-2">
              <Laptop className="w-5 h-5 text-indigo-400" />
              <span>Configuración de Pantalla</span>
            </h3>
            <p className="text-slate-400 text-xs mb-4">Elige la apariencia visual de la aplicación según tu gusto.</p>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'light', label: 'Claro', icon: Sun },
                { name: 'dark', label: 'Oscuro', icon: Moon },
                { name: 'system', label: 'Sistema', icon: Laptop }
              ].map((opt) => {
                const Icon = opt.icon
                const selected = theme === opt.name
                return (
                  <button
                    key={opt.name}
                    onClick={() => setTheme(opt.name)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Estatus Espiritual y Adscripciones */}
        <div className="space-y-6">
          
          {/* Asignaciones ministeriales */}
          <div className="glass rounded-3xl p-6 border border-slate-850">
            <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>Adscripción</span>
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Rol en App</span>
                <span className="text-slate-200 text-sm font-semibold capitalize">{profile?.rol}</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Grupo Pequeño / Célula</span>
                <span className="text-slate-200 text-sm font-semibold">
                  {profile?.celulas?.nombre || 'No asignada todavía'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Ministerio Principal</span>
                <span className="text-slate-200 text-sm font-semibold">
                  {profile?.ministerios?.nombre || 'No asignado todavía'}
                </span>
              </div>
            </div>
          </div>

          {/* Progreso espiritual / Discipulado */}
          <div className="glass rounded-3xl p-6 border border-slate-850">
            <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center space-x-2">
              <Heart className="w-5 h-5 text-indigo-400" />
              <span>Progreso de Discipulado</span>
            </h3>
            <p className="text-slate-400 text-xs mb-6">Historial de requisitos y formación espiritual aprobada.</p>
            
            {spiritualRecord ? (
              <div className="space-y-4">
                {[
                  { key: 'bautizado', label: 'Bautismo' },
                  { key: 'conectar', label: 'Clase 1: Conectar' },
                  { key: 'crecer', label: 'Clase 2: Crecer' },
                  { key: 'intro_lid', label: 'Clase 3: Liderazgo' },
                  { key: 'dones', label: 'Clase 4: Descubre Dones' },
                  { key: 'aplicadas', label: 'Clase 5: Herr. Aplicadas' }
                ].map((item) => {
                  const completed = spiritualRecord[item.key]
                  return (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                      <span className="text-slate-300 text-xs font-semibold">{item.label}</span>
                      {completed ? (
                        <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-[10px] font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Completado</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-900">
                          Pendiente
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic text-center py-4">
                No hay registro espiritual disponible.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
