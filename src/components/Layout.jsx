import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, History, User, ShieldCheck, LogOut, LogIn, Globe, Award, Activity, FileText, Download } from 'lucide-react'
import OnboardingModal from './OnboardingModal'

export default function Layout({ children }) {
  const { profile, logout, isPastorAdmin, moduleVisibility } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const navItems = [
    { path: '/', label: 'Devocional', icon: BookOpen },
    { path: '/archive', label: 'Historial', icon: History },
    { path: '/misiones', label: 'Misiones', icon: Globe },
    { path: '/escuela', label: 'Escuela', icon: Award },
    { path: '/deportes', label: 'Deportes', icon: Activity },
    { path: '/recursos', label: 'Recursos', icon: FileText },
  ]

  // Filtrar ítems de navegación según estado de autenticación y configuraciones de visibilidad
  const visibleNavItems = navItems.filter(item => {
    if (!profile) {
      const key = item.path === '/' ? 'devocional' : item.path.slice(1)
      return moduleVisibility && moduleVisibility[key] === true
    }
    return true
  })

  // Añadir Mi Perfil siempre (apunta a login si no está autenticado)
  visibleNavItems.push({
    path: profile ? '/profile' : '/login',
    label: profile ? 'Mi Perfil' : 'Mi Cuenta',
    icon: User
  })

  if (profile && isPastorAdmin) {
    visibleNavItems.push({ path: '/admin', label: 'Pastor/Admin', icon: ShieldCheck })
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Error logging out:', err.message)
    }
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row">
      <OnboardingModal />
      {/* 1. SIDEBAR (Escritorio) */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 h-screen p-5">
        {/* Header Logo */}
        <div className="flex items-center space-x-3 mb-8 px-2">
          <img src="/favicon.png" alt="Logo Vida Nueva" className="w-10 h-10 rounded-xl shadow-lg border border-indigo-500/20" />
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight text-slate-900 dark:text-white m-0 leading-tight">Vida Nueva</h1>
            <span className="text-xs text-indigo-400 font-medium">Santiago, Chile</span>
          </div>
        </div>

        {/* Info de Usuario Breve */}
        <div className="mb-6 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-700/30 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 font-display overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile?.nombre?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{profile?.nombre || 'Invitado'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {profile ? (profile.rol === 'pastor_admin' ? 'Pastor / Admin' : profile.rol) : 'Navegación Pública'}
            </p>
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-950/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:bg-slate-800/60 hover:text-slate-700 dark:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {installPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center space-x-3 px-4 py-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-sm font-medium transition-all duration-200 mt-4 mb-2"
          >
            <Download className="w-5 h-5" />
            <span>Instalar App</span>
          </button>
        )}

        {/* Botón de Logout / Login */}
        {profile ? (
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 border border-transparent rounded-xl text-sm font-medium transition-all duration-200 mt-auto"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center space-x-3 px-4 py-3 text-indigo-400 hover:bg-indigo-950/20 hover:text-indigo-300 border border-transparent rounded-xl text-sm font-medium transition-all duration-200 mt-auto"
          >
            <LogIn className="w-5 h-5" />
            <span>Iniciar Sesión</span>
          </button>
        )}
      </aside>

      {/* 2. HEADER PARA MÓVIL */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <img src="/favicon.png" alt="Logo Vida Nueva" className="w-8 h-8 rounded-lg border border-indigo-500/20" />
          <span className="text-md font-bold font-display text-slate-900 dark:text-white tracking-wide">Vida Nueva App</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
              title="Instalar App"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        
        {/* Mini botón logout en móvil */}
        {profile ? (
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="p-2 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-slate-805 transition-colors"
            title="Iniciar Sesión"
          >
            <LogIn className="w-5 h-5" />
          </button>
        )}
        </div>
      </header>

      {/* 3. CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto p-4 md:p-8 animate-fade-in">
          {children}
        </div>
      </main>

      {/* 4. BOTTOM BAR (Navegación Móvil) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 flex justify-around shadow-lg">
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all duration-200 ${
                active ? 'text-indigo-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
