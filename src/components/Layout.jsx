import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, History, User, ShieldCheck, LogOut, Globe, Award } from 'lucide-react'
import OnboardingModal from './OnboardingModal'

export default function Layout({ children }) {
  const { profile, logout, isPastorAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/', label: 'Devocional', icon: BookOpen },
    { path: '/archive', label: 'Historial', icon: History },
    { path: '/misiones', label: 'Misiones', icon: Globe },
    { path: '/escuela', label: 'Escuela', icon: Award },
    { path: '/profile', label: 'Mi Perfil', icon: User },
  ]

  if (isPastorAdmin) {
    navItems.push({ path: '/admin', label: 'Pastor/Admin', icon: ShieldCheck })
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <OnboardingModal />
      {/* 1. SIDEBAR (Escritorio) */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 border-r border-slate-800 shrink-0 sticky top-0 h-screen p-5">
        {/* Header Logo */}
        <div className="flex items-center space-x-3 mb-8 px-2">
          <img src="/favicon.png" alt="Logo Vida Nueva" className="w-10 h-10 rounded-xl shadow-lg border border-indigo-500/20" />
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight text-white m-0 leading-tight">Vida Nueva</h1>
            <span className="text-xs text-indigo-400 font-medium">Santiago, Chile</span>
          </div>
        </div>

        {/* Info de Usuario Breve */}
        <div className="mb-6 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 font-display">
            {profile?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-200 truncate">{profile?.nombre}</p>
            <p className="text-xs text-slate-400 capitalize">{profile?.rol === 'pastor_admin' ? 'Pastor / Administrador' : profile?.rol}</p>
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-950/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Botón de Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 border border-transparent rounded-xl text-sm font-medium transition-all duration-200 mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* 2. HEADER PARA MÓVIL */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <img src="/favicon.png" alt="Logo Vida Nueva" className="w-8 h-8 rounded-lg border border-indigo-500/20" />
          <span className="text-md font-bold font-display text-white tracking-wide">Vida Nueva App</span>
        </div>
        
        {/* Mini botón logout en móvil */}
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* 3. CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto p-4 md:p-8 animate-fade-in">
          {children}
        </div>
      </main>

      {/* 4. BOTTOM BAR (Navegación Móvil) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 px-2 py-2 flex justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all duration-200 ${
                active ? 'text-indigo-400' : 'text-slate-400'
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
