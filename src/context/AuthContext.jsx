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
    recursos: false,
    calendario: false
  })
  const [churchSettings, setChurchSettings] = useState(null)

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('church_settings').select('*').eq('id', 1).single()
      if (!error && data) {
        setChurchSettings(data)
      } else {
        // Fallback
        setChurchSettings({
          name: 'Vida Nueva',
          logo_url: null,
          address: 'Santiago, Chile',
          phone: '',
          email: '',
          social_facebook: '',
          social_instagram: '',
          social_youtube: '',
          mayordomo_name: '',
          calendar_url: ''
        })
      }
    } catch (err) {
      console.warn('Error fetching church settings:', err.message)
    }
  }

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
      console.warn('Error fetching module visibility:', err.message)
    }
  }

  const fetchProfile = async (userId) => {
    try {
      try {
        await supabase.rpc('ensure_profile_exists')
      } catch (rpcErr) {}

      let { data, error } = await supabase
        .from('profiles')
        .select('*, cargo, celulas:celula_id(nombre), ministerios:ministerio_id(nombre)')
        .eq('id', userId)
        .single()
      
      if (error) {
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
                .select('*, cargo, celulas:celula_id(nombre), ministerios:ministerio_id(nombre)')
                .single()
              
              if (!insertError && fallbackProfile) {
                setProfile(fallbackProfile)
                await supabase.from('spiritual_records').insert({ user_id: userId })
                return
              }
            }
          } catch (fallbackErr) {}
        }
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error(err)
      setProfile(null)
    }
  }

  useEffect(() => {
    fetchVisibility()
    fetchSettings()
    
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
        setUser(null)
        setProfile(null)
      })
      .finally(() => {
        setLoading(false)
      })

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setLoading(false); throw error; }
    return data
  }

  const register = async (email, password, nombre) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { nombre: nombre } }
    })
    if (error) { setLoading(false); throw error; }
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
      .select('*, cargo, celulas:celula_id(nombre), ministerios:ministerio_id(nombre)')
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
    churchSettings,
    fetchSettings,
    resetPassword: () => {},
    refreshProfile: () => user && fetchProfile(user.id)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
