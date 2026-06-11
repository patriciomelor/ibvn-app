import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [moduleVisibility, setModuleVisibility] = useState({
    devocional: false,
    archive: false,
    misiones: false,
    escuela: false,
    deportes: false,
    recursos: false
  })

  const fetchVisibility = async () => {
    try {
      const { data, error } = await supabase
        .from('module_visibility')
        .select('*')
      if (!error && data) {
        const dict = {}
        data.forEach(item => {
          dict[item.module_key] = item.is_public
        })
        setModuleVisibility(dict)
      }
    } catch (err) {
      console.warn('Error fetching module visibility (table might not exist yet):', err.message)
    }
  }

  const fetchProfile = async (userId) => {
    try {
      // 1. Asegurar la existencia del perfil en la base de datos (auto-healing)
      try {
        await supabase.rpc('ensure_profile_exists')
      } catch (rpcErr) {
        console.warn('ensure_profile_exists RPC error (might not exist yet):', rpcErr.message)
      }

      // 2. Consultar el perfil
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error.message)
        
        // Fallback: si falla por no existir (PGRST116), intentar insertar desde el cliente
        if (error.code === 'PGRST116') {
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
              const { data: fallbackProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: userId,
                  email: authUser.email,
                  nombre: authUser.user_metadata?.nombre || authUser.user_metadata?.name || 'Miembro Nuevo',
                  rol: 'miembro'
                })
                .select()
                .single()
              
              if (!insertError && fallbackProfile) {
                setProfile(fallbackProfile)
                // Insertar también registro espiritual
                await supabase.from('spiritual_records').insert({ user_id: userId })
                return
              }
            }
          } catch (fallbackErr) {
            console.error('Profile fallback creation failed:', fallbackErr.message)
          }
        }
        
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    fetchVisibility()
    // 1. Verificar sesión activa inicial de manera segura
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      })
      .catch((err) => {
        console.error('Error al verificar sesión inicial en Supabase:', err.message)
        setUser(null)
        setProfile(null)
      })
      .finally(() => {
        setLoading(false)
      })

    // 2. Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true)
        if (session) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setLoading(false)
      throw error
    }
    return data
  }

  const register = async (email, password, nombre) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre,
        },
      },
    })
    if (error) {
      setLoading(false)
      throw error
    }
    // Nota: El trigger en Postgres creará automáticamente el registro en public.profiles.
    return data
  }

  const logout = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
    if (error) throw error
  }

  const updateProfileData = async (updates) => {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) throw error
    setProfile(data)
    return data
  }

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    updateProfile: updateProfileData,
    rol: profile?.rol || (user ? 'miembro' : 'invitado'),
    isPastorAdmin: profile?.rol === 'pastor_admin',
    isLider: profile?.rol === 'lider' || profile?.rol === 'pastor_admin',
    moduleVisibility,
    refreshVisibility: fetchVisibility,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
