import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { applyPalette } from '../lib/theme'

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
      } catch (rpcErr) { }

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
                  tel: authUser.user_metadata?.tel || '',
                  whatsapp_optin: authUser.user_metadata?.whatsapp_optin === true,
                  whatsapp_optin_date: authUser.user_metadata?.whatsapp_optin
                    ? authUser.user_metadata?.whatsapp_optin_date || new Date().toISOString()
                    : null,
                  rol: 'visita'
                })
                .select('*, cargo, celulas:celula_id(nombre), ministerios:ministerio_id(nombre)')
                .single()

              if (!insertError && fallbackProfile) {
                setProfile(fallbackProfile)
                await supabase.from('spiritual_records').insert({ user_id: userId })
                return
              }
            }
          } catch (fallbackErr) { }
        }
        setProfile(null)
      } else {
        // Auto-healing: Si el perfil existe pero no tenía teléfono guardado y auth.user tiene tel
        if ((!data.tel || data.tel.trim() === '') && userId) {
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            const metaTel = authUser?.user_metadata?.tel
            if (metaTel && metaTel.trim() !== '') {
              await supabase.from('profiles').update({ tel: metaTel }).eq('id', userId)
              data.tel = metaTel
            }
          } catch (healErr) { }
        }

        setProfile(data)
        if (data?.theme_palette) {
          applyPalette(data.theme_palette, true)
        }
      }
    } catch (err) {
      console.error(err)
      setProfile(null)
    }
  }

  const updateDynamicManifestAndMetadata = (settings) => {
    if (!settings) return

    // 1. Title & Meta description
    document.title = `${settings.name || 'Vida Nueva'} App`

    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', `Aplicación oficial de ${settings.name || 'Vida Nueva'}.`)
    }

    // 2. Favicon & Apple Icon
    const iconUrl = settings.logo_url || '/favicon.png'
    const favicon = document.querySelector('link[rel="icon"]')
    if (favicon) favicon.setAttribute('href', iconUrl)

    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]')
    if (appleIcon) appleIcon.setAttribute('href', iconUrl)
  }

  useEffect(() => {
    if (churchSettings) {
      updateDynamicManifestAndMetadata(churchSettings)
    }
  }, [churchSettings])

  useEffect(() => {
    let activeSubscription = null

    const initApp = async () => {
      try {
        await Promise.all([
          fetchVisibility(),
          fetchSettings()
        ])
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }

        // Registrar el listener de cambio de sesión solo después de que se carguen los ajustes
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
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
          }
        )
        activeSubscription = data.subscription
      } catch (err) {
        console.error('Error during initApp:', err)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initApp()

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        fetchVisibility()
        fetchSettings()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          fetchProfile(session.user.id)
        }
      }
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      activeSubscription?.unsubscribe()
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [])

  const register = async (emailOrObj, password, nombre, tel, whatsappOptin = false) => {
    let emailVal = emailOrObj
    let passVal = password
    let nomVal = nombre
    let telVal = tel
    let whatsappOptinVal = whatsappOptin

    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      emailVal = emailOrObj.email
      passVal = emailOrObj.password
      nomVal = emailOrObj.nombre
      telVal = emailOrObj.tel
      whatsappOptinVal = emailOrObj.whatsappOptin || false
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailVal,
      password: passVal,
      options: {
        data: {
          nombre: nomVal,
          tel: telVal,
          whatsapp_optin: whatsappOptinVal,
          whatsapp_optin_date: whatsappOptinVal ? new Date().toISOString() : null,
          rol: 'visita'
        }
      }
    })
    if (error) throw error
    return data
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
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
    rol: profile?.rol || (user ? 'visita' : 'invitado'),
    isPastorAdmin: profile?.rol === 'pastor_admin',
    isLider: profile?.rol === 'lider' || profile?.rol === 'pastor_admin',
    isMiembro: profile?.rol === 'miembro' || profile?.rol === 'lider' || profile?.rol === 'pastor_admin',
    isVisita: profile?.rol === 'visita' || !profile?.rol,
    moduleVisibility,
    refreshVisibility: fetchVisibility,
    churchSettings,
    fetchSettings,
    resetPassword: () => { },
    refreshProfile: () => user && fetchProfile(user.id)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
