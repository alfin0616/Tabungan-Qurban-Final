import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../api/supabaseClient'

const AuthContext = createContext(undefined)

const REMEMBER_KEY = 'tq_remember_email'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [anggotaSaya, setAnggotaSaya] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const loadProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null)
      setAnggotaSaya(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)

    const { data: profileData } = await supabase
      .from('admin_profiles')
      .select('*, instansi:instansi_id (*)')
      .eq('id', session.user.id)
      .maybeSingle()
    setProfile(profileData ?? null)

    if (profileData?.role === 'jamaah') {
      const { data: anggotaData } = await supabase
        .from('anggota')
        .select('*, instansi:instansi_id (*), kelompok:kelompok_id (*)')
        .eq('user_id', session.user.id)
        .maybeSingle()
      setAnggotaSaya(anggotaData ?? null)
    } else {
      setAnggotaSaya(null)
    }

    setProfileLoading(false)
  }, [session])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const login = useCallback(async ({ email, password, rememberMe }) => {
    let loginEmail = email.trim()
    if (!loginEmail.includes('@')) {
      try {
        const { data: resolvedEmail } = await supabase.rpc('resolve_login_email', {
          p_identifier: loginEmail,
        })
        if (resolvedEmail) {
          loginEmail = resolvedEmail
        } else {
          loginEmail = `${loginEmail}@wa.siqurban.id`
        }
      } catch (err) {
        loginEmail = `${loginEmail}@wa.siqurban.id`
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    })
    if (error) throw error

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, email.trim())
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }

    // Log the successful login action (fire and forget)
    import('../repositories/auditRepository').then(({ auditRepository }) => {
      auditRepository.log('LOGIN', `User logged in with identifier: ${email}`)
    })

    return data
  }, [])

  const setActiveJamaahGroup = useCallback(async (instansiId, kelompokId) => {
    if (!instansiId || !kelompokId) return
    try {
      const { error } = await supabase.rpc('set_active_jamaah_group', {
        p_instansi_id: instansiId,
        p_kelompok_id: kelompokId,
      })
      if (error) console.warn('Gagal set active group:', error.message)
      await loadProfile()
    } catch (err) {
      console.warn('Error setActiveJamaahGroup:', err)
    }
  }, [loadProfile])

  const registerJamaah = useCallback(async ({ fullName, phone, email, password, instansiId, kelompokId }) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const loginEmail = email && email.includes('@') ? email.trim() : `${cleanPhone}@wa.siqurban.id`

    const { data, error } = await supabase.auth.signUp({
      email: loginEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: cleanPhone,
          role: 'jamaah',
          instansi_id: instansiId,
          kelompok_id: kelompokId,
        },
      },
    })
    if (error) throw error

    if (data?.session) {
      try {
        await supabase.rpc('set_active_jamaah_group', {
          p_instansi_id: instansiId,
          p_kelompok_id: kelompokId,
        })
        await loadProfile()
      } catch (e) {
        console.warn('Auto set_active_jamaah_group info:', e)
      }
    }

    import('../repositories/auditRepository').then(({ auditRepository }) => {
      auditRepository.log('REGISTER_JAMAAH', `New jamaah registered with phone: ${cleanPhone}`)
    })

    return data
  }, [loadProfile])

  const logout = useCallback(async () => {
    // Log the logout action before session clears
    import('../repositories/auditRepository').then(({ auditRepository }) => {
      auditRepository.log('LOGOUT', 'User logged out')
    })
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
    setProfile(null)
    setAnggotaSaya(null)
  }, [])

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }, [])

  const getRememberedEmail = useCallback(() => localStorage.getItem(REMEMBER_KEY) ?? '', [])

  const role = profile?.role ?? null
  // isAdmin dipertahankan (admin ATAU superadmin) supaya halaman yang sudah
  // ada dari sebelum Fase 3 tidak mendadak kehilangan akses. isSuperAdmin /
  // isAdminInstansi baru dipakai untuk halaman-halaman baru mulai Fase 4.
  const isAdmin = role === 'admin' || role === 'superadmin'
  const isSuperAdmin = role === 'superadmin'
  const isAdminInstansi = role === 'admin'
  const isJamaah = role === 'jamaah'

  // Jamaah yang login tapi akunnya belum dihubungkan ke satu baris
  // anggota manapun (lihat halaman /hubungkan-akun & RPC klaim_akun_anggota)
  const needsClaim = isJamaah && !profileLoading && !anggotaSaya

  const instansiSaya = profile?.instansi ?? anggotaSaya?.instansi ?? null

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    anggotaSaya,
    instansiSaya,
    role,
    isAdmin,
    isSuperAdmin,
    isAdminInstansi,
    isJamaah,
    needsClaim,
    loading: loading || profileLoading,
    isAuthenticated: !!session,
    login,
    registerJamaah,
    setActiveJamaahGroup,
    logout,
    resetPassword,
    updatePassword,
    getRememberedEmail,
    refreshProfile: loadProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return ctx
}
