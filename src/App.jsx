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

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isPastorAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">Verificando sesión...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isPastorAdmin) {
    return <Navigate to="/" replace />
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
              <ProtectedRoute>
                <Devocional />
              </ProtectedRoute>
            }
          />
          <Route
            path="/archive"
            element={
              <ProtectedRoute>
                <Archive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/misiones"
            element={
              <ProtectedRoute>
                <Misiones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/escuela"
            element={
              <ProtectedRoute>
                <EscuelaLideres />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deportes"
            element={
              <ProtectedRoute>
                <Deportes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recursos"
            element={
              <ProtectedRoute>
                <Recursos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
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
