import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Devocional from './pages/Devocional'
import Archive from './pages/Archive'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Misiones from './pages/Misiones'
import EscuelaLideres from './pages/EscuelaLideres'
import Deportes from './pages/Deportes'
import Recursos from './pages/Recursos'

function ProtectedRoute({ children, moduleKey, adminOnly = false }) {
  const { user, loading, isPastorAdmin, moduleVisibility } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Verificando sesión...</p>
      </div>
    )
  }

  // Si requiere administrador
  if (adminOnly) {
    if (!user || !isPastorAdmin) {
      return <Navigate to="/" replace />
    }
    return <Layout>{children}</Layout>
  }

  // Si no hay usuario activo
  if (!user) {
    const isPublic = moduleVisibility && moduleVisibility[moduleKey]
    if (isPublic) {
      return <Layout>{children}</Layout>
    }
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas Protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute moduleKey="devocional">
                <Devocional />
              </ProtectedRoute>
            }
          />
          <Route
            path="/archive"
            element={
              <ProtectedRoute moduleKey="archive">
                <Archive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/misiones"
            element={
              <ProtectedRoute moduleKey="misiones">
                <Misiones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/escuela"
            element={
              <ProtectedRoute moduleKey="escuela">
                <EscuelaLideres />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deportes"
            element={
              <ProtectedRoute moduleKey="deportes">
                <Deportes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recursos"
            element={
              <ProtectedRoute moduleKey="recursos">
                <Recursos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute moduleKey="profile">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Redirección por Defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
