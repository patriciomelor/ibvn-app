import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, History, User, ShieldCheck, LogOut, LogIn, Globe, Award, Activity, FileText, Download, Calendar as CalendarIcon, ArrowLeft, Menu, X, Bell } from 'lucide-react'
import OnboardingModal from './OnboardingModal'
import PaletteSelectorModal from './PaletteSelectorModal'

// Módulos ocultos del front (backend se mantiene intacto)
const HIDDEN_MODULES = ['misiones', 'escuela', 'deportes']

export default function Layout({ children }) {
  const { profile, logout, isPastorAdmin, moduleVisibility, churchSettings } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setInstallPrompt(null)
      }
    } else {
      setShowInstallModal(true)
    }
  }

  const allNavItems = [
    { path: '/', label: 'Devocional', icon: BookOpen },
    { path: '/archive', label: 'Historial', icon: History },
    { path: '/misiones', label: 'Misiones', icon: Globe },
    { path: '/escuela', label: 'Escuela', icon: Award },
    { path: '/deportes', label: 'Actividades', icon: Activity },
    { path: '/recursos', label: 'Recursos', icon: FileText },
    { path: '/calendario', label: 'Calendario', icon: CalendarIcon },
  ]

  // Filtrar módulos ocultos
  const navItems = allNavItems.filter(item => {
    const key = item.path === '/' ? 'devocional' : item.path.slice(1)
    return !HIDDEN_MODULES.includes(key)
  })

  // Filtrar ítems de navegación según estado de autenticación y configuraciones de visibilidad
  const visibleNavItems = navItems.filter(item => {
    if (!profile) {
      const key = item.path === '/' ? 'devocional' : item.path.slice(1)
      return moduleVisibility && moduleVisibility[key] === true
    }
    return true
  })

  // Añadir Notificaciones (solo para usuarios autenticados)
  if (profile) {
    visibleNavItems.push({
      path: '/notificaciones',
      label: 'Notificaciones',
      icon: Bell
    })
  }

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
      <PaletteSelectorModal />
      {/* 1. SIDEBAR (Escritorio) */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 h-screen p-5">
        {/* Header Logo */}
        <div className="flex items-center space-x-3 mb-8 px-2">
          <img src={churchSettings?.logo_url || "/favicon.png"} alt="Logo Iglesia" className="w-10 h-10 rounded-xl shadow-lg border border-indigo-500/20 object-cover" />
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight text-slate-900 dark:text-white m-0 leading-tight">{churchSettings?.name || 'Vida Nueva'}</h1>
            <span className="text-xs text-indigo-400 font-medium">{churchSettings?.address || 'Santiago, Chile'}</span>
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
              {profile ? (profile.cargo || (profile.rol === 'pastor_admin' ? 'Pastor / Admin' : profile.rol)) : 'Navegación Pública'}
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

        <button
          onClick={handleInstallClick}
          className="flex items-center space-x-3 px-4 py-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-sm font-medium transition-all duration-200 mt-4 mb-2"
        >
          <Download className="w-5 h-5 shrink-0 text-indigo-400" />
          <span>Instalar App</span>
        </button>

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
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2 truncate">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="mr-1 p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src={churchSettings?.logo_url || "/favicon.png"} alt="Logo" className="w-8 h-8 rounded-lg shadow-sm border border-indigo-500/20 object-cover shrink-0" />
          <h1 className="text-sm font-bold font-display tracking-tight text-slate-900 dark:text-white truncate">{churchSettings?.name || 'Vida Nueva'}</h1>
        </div>
        
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={handleInstallClick}
            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center space-x-1 border border-indigo-500/20 px-2"
            title="Instalar App"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs font-bold font-display">Instalar</span>
          </button>

          {profile && (
            <Link
              to="/notificaciones"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
            </Link>
          )}

          {profile && isPastorAdmin && (
            <Link
              to="/admin"
              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Administración"
            >
              <ShieldCheck className="w-5 h-5" />
            </Link>
          )}

          {profile ? (
            <Link
              to="/profile"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Mi Perfil"
            >
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Iniciar Sesión"
            >
              <LogIn className="w-5 h-5" />
            </Link>
          )}
        </div>
      </header>

      {/* 2.5. SIDEBAR DRAWER MÓVIL */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="md:hidden fixed top-0 left-0 z-50 w-72 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col shadow-2xl transform transition-transform duration-300 animate-slide-in-left">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <img src={churchSettings?.logo_url || "/favicon.png"} alt="Logo" className="w-9 h-9 rounded-xl shadow-lg border border-indigo-500/20 object-cover" />
                <div>
                  <h1 className="text-base font-bold font-display tracking-tight text-slate-900 dark:text-white m-0 leading-tight">{churchSettings?.name || 'Vida Nueva'}</h1>
                  <span className="text-[10px] text-indigo-400 font-medium">{churchSettings?.address || 'Santiago, Chile'}</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info usuario */}
            <div className="mb-5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-700/30 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 font-display overflow-hidden shrink-0 text-sm">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.nombre?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{profile?.nombre || 'Invitado'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {profile ? (profile.cargo || (profile.rol === 'pastor_admin' ? 'Pastor / Admin' : profile.rol)) : 'Navegación Pública'}
                </p>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-3 px-4 py-2.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-sm font-medium transition-all duration-200 mt-3 mb-2"
            >
              <Download className="w-5 h-5" />
              <span>Instalar App</span>
            </button>

            {/* Logout / Login */}
            {profile ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 border border-transparent rounded-xl text-sm font-medium transition-all duration-200 mt-auto"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center space-x-3 px-4 py-2.5 text-indigo-400 hover:bg-indigo-950/20 hover:text-indigo-300 border border-transparent rounded-xl text-sm font-medium transition-all duration-200 mt-auto"
              >
                <LogIn className="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </aside>
        </>
      )}

      {/* 3. CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 pb-6 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto p-4 md:p-8 animate-fade-in">
          {children}
        </div>
      </main>

      {/* 4. MODAL GUÍA DE INSTALACIÓN PWA */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">Instalar {churchSettings?.name || 'Vida Nueva'} App</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Agrega la app a tu pantalla de inicio para acceso rápido.</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Opción iPhone / iPad */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-xs text-slate-900 dark:text-white">
                  <span>📱 En iPhone / iPad (Safari)</span>
                </div>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal pl-4">
                  <li>Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.</li>
                  <li>Desplázate hacia abajo y selecciona <strong>"Agregar a inicio"</strong>.</li>
                </ol>
              </div>

              {/* Opción Android / Chrome */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-xs text-slate-900 dark:text-white">
                  <span>🤖 En Android (Chrome / Navegadores)</span>
                </div>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal pl-4">
                  <li>Toca los <strong>3 puntos del menú</strong> (esquina superior derecha).</li>
                  <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all text-xs font-display shadow-lg shadow-indigo-900/30"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
