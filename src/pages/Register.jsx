import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, User, Phone, ShieldAlert, CheckCircle, Eye, EyeOff, Check, MessageSquare } from 'lucide-react'
import { sendWhatsAppMessage } from '../lib/whatsapp'

export default function Register() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [tel, setTel] = useState('')
  const [whatsappOptin, setWhatsappOptin] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, churchSettings } = useAuth()
  const navigate = useNavigate()

  // Requisitos reactivos de contraseña
  const hasMinLength = password.length >= 6
  const hasNumber = /\d/.test(password)
  const passwordsMatch = Boolean(confirmPassword && password === confirmPassword)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!hasMinLength) {
      return setError('La contraseña debe tener al menos 6 caracteres.')
    }

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.')
    }

    setLoading(true)

    try {
      await register({ email, password, nombre, tel, whatsappOptin })

      if (whatsappOptin) {
        sendWhatsAppMessage({
          to: tel,
          templateName: 'ibvn_bienvenida',
          languageCode: 'es_CL',
          templateParams: [nombre]
        }).catch((whatsappError) => {
          console.error('Error enviando bienvenida por WhatsApp:', whatsappError)
        })
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 4000)
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
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Únete a {churchSettings?.name || 'Vida Nueva'} App</p>
        </div>

        {/* Mensaje de Éxito */}
        {success && (
          <div className="glass-emerald flex items-start space-x-2 p-4 rounded-xl text-emerald-300 text-sm mb-6 animate-fade-in">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>¡Registro exitoso! Redirigiendo al inicio de sesión...</span>
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
              Nombre Completo *
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
              Correo Electrónico *
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
              Teléfono de Contacto *
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="tel"
                required
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full bg-white/80 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappOptin}
              onChange={(e) => setWhatsappOptin(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <MessageSquare className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              <span>Autorizo a IBVN a enviarme por WhatsApp la bienvenida, devocionales y recursos de la iglesia.</span>
            </span>
          </label>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full bg-white/80 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-11 text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Confirmar Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full bg-white/80 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-11 text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Requisitos Reactivos de Contraseña */}
          {password.length > 0 && (
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 space-y-1.5 animate-fade-in">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Requisitos de contraseña:</p>
              <div className="flex items-center space-x-2 text-xs">
                <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-400 font-bold' : 'text-slate-600'}`} />
                <span className={hasMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>Mínimo 6 caracteres</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-600'}`} />
                <span className={hasNumber ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>Incluye al menos un número (0-9)</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <Check className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-400 font-bold' : 'text-slate-600'}`} />
                <span className={passwordsMatch ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>Las contraseñas coinciden</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-950/50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm font-display"
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
