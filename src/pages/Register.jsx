import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, User, ShieldAlert, CheckCircle } from 'lucide-react'

export default function Register() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.')
    }

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.')
    }

    setLoading(true)

    try {
      await register(email, password, nombre)
      setSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Ocurrió un error al registrar el usuario.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass rounded-3xl p-8 relative z-10 shadow-2xl">
        {/* Cabecera */}
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">Crear Cuenta</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Únete a Vida Nueva App</p>
        </div>

        {/* Mensaje de Éxito */}
        {success && (
          <div className="glass-emerald flex items-start space-x-2 p-4 rounded-xl text-emerald-300 text-sm mb-6 animate-fade-in">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>¡Registro exitoso! Redireccionando a la aplicación...</span>
          </div>
        )}

        {/* Alerta de Error */}
        {error && (
          <div className="glass-rose flex items-start space-x-2 p-4 rounded-xl text-rose-300 text-sm mb-6 animate-fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full bg-white/80 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full bg-white/80 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white/80 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full bg-white/80 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-950/50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm font-display"
          >
            {loading ? 'Creando Cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
