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

  const loadProfile = useCallback(async (overrideUser = null) => {
    let activeUser = overrideUser ?? session?.user
    if (!activeUser) {
      const { data: sessionData } = await supabase.auth.getSession()
      activeUser = sessionData?.session?.user ?? null
    }

    if (!activeUser) {
      setProfile(null)
      setAnggotaSaya(null)
      setProfileLoading(false)
      return null
    }
    setProfileLoading(true)

    const { data: profileData } = await supabase
      .from('admin_profiles')
      .select('*, instansi:instansi_id (*)')
      .eq('id', activeUser.id)
      .maybeSingle()

    // Super Admin memonitor seluruh instansi secara nasional dan tidak masuk ke panel instansi tertentu
    if (profileData?.role === 'superadmin' && profileData?.instansi_id) {
      supabase
        .from('admin_profiles')
        .update({ instansi_id: null })
        .eq('id', activeUser.id)
        .then(() => {})
      profileData.instansi_id = null
      profileData.instansi = null
    }

    if (profileData?.role === 'jamaah') {
      const { data: anggotaData } = await supabase
        .from('anggota')
        .select('*, instansi:instansi_id (*), kelompok:kelompok_id (*)')
        .eq('user_id', activeUser.id)
        .maybeSingle()

      const targetInstansiId = profileData?.instansi_id || anggotaData?.instansi_id
      const targetKelompokId = profileData?.kelompok_id || anggotaData?.kelompok_id

      if (targetInstansiId) {
        try {
          const { getInstansiById } = await import('../repositories/instansiRepository')
          const enrichedInst = await getInstansiById(targetInstansiId)
          if (enrichedInst) {
            if (anggotaData) anggotaData.instansi = enrichedInst
            if (profileData) profileData.instansi = enrichedInst
          }
        } catch {
          // ignore
        }
      }

      if (targetKelompokId && (!anggotaData?.kelompok || anggotaData?.kelompok_id !== targetKelompokId)) {
        try {
          const { data: klpData } = await supabase
            .from('kelompok')
            .select('*')
            .eq('id', targetKelompokId)
            .maybeSingle()
          if (klpData) {
            if (anggotaData) {
              anggotaData.kelompok_id = targetKelompokId
              anggotaData.kelompok = klpData
            }
            if (profileData) {
              profileData.kelompok = klpData
            }
          }
        } catch {
          // ignore
        }
      } else if (anggotaData?.kelompok && profileData) {
        profileData.kelompok = anggotaData.kelompok
      }

      setAnggotaSaya(anggotaData ?? null)
    } else {
      if (profileData?.instansi_id && profileData?.role !== 'superadmin') {
        try {
          const { getInstansiById } = await import('../repositories/instansiRepository')
          const enrichedInst = await getInstansiById(profileData.instansi_id)
          if (enrichedInst) {
            profileData.instansi = enrichedInst
          }
        } catch {
          // ignore
        }
      }
      setAnggotaSaya(null)
    }

    setProfile(profileData ? { ...profileData } : null)

    setProfileLoading(false)
    return profileData ?? null
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
      } catch {
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

    if (data?.session) {
      setSession(data.session)
      await loadProfile(data.session.user)
    }

    import('../repositories/auditRepository').then(({ auditRepository }) => {
      auditRepository.log('LOGIN', `User logged in with identifier: ${email}`)
    })

    return data
  }, [loadProfile])

  const setActiveJamaahGroup = useCallback(async (instansiId, kelompokId) => {
    if (!instansiId || !kelompokId) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const activeUser = sessionData?.session?.user ?? session?.user
      if (activeUser) {
        await supabase
          .from('admin_profiles')
          .update({ instansi_id: instansiId, kelompok_id: kelompokId })
          .eq('id', activeUser.id)
      }
      const { error } = await supabase.rpc('set_active_jamaah_group', {
        p_instansi_id: instansiId,
        p_kelompok_id: kelompokId,
      })
      if (error) console.warn('Gagal set active group:', error.message)
      await loadProfile(activeUser)
    } catch (err) {
      console.warn('Error setActiveJamaahGroup:', err)
    }
  }, [session, loadProfile])

  const setActiveAdminInstansi = useCallback(async (instansiId, kodeRegistrasi = '') => {
    const { data: sessionData } = await supabase.auth.getSession()
    const activeUser = sessionData?.session?.user ?? session?.user
    if (!activeUser) return null

    if (kodeRegistrasi && kodeRegistrasi.trim()) {
      const { claimInstansiAccount } = await import('../repositories/instansiRepository')
      await claimInstansiAccount(kodeRegistrasi.trim(), instansiId || null)
    } else if (instansiId) {
      const { data: existingProfile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('id', activeUser.id)
        .maybeSingle()

      if (existingProfile?.role === 'superadmin') {
        return await loadProfile(activeUser)
      }

      const { error: updateErr } = await supabase
        .from('admin_profiles')
        .update({
          instansi_id: instansiId,
          role: 'admin',
        })
        .eq('id', activeUser.id)

      if (updateErr) throw updateErr
    }

    return await loadProfile(activeUser)
  }, [session, loadProfile])

  const registerAdminInstansi = useCallback(async ({ fullName, phone = '', email, password, instansiId = null, kodeRegistrasi = '' }) => {
    const cleanCode = (kodeRegistrasi || '').trim()
    if (!cleanCode) {
      throw new Error('Wajib mencantumkan Kode Instansi untuk mendaftar sebagai Admin Instansi.')
    }

    const { verifyKodeInstansi, claimInstansiAccount } = await import('../repositories/instansiRepository')
    const verifiedInstansiId = await verifyKodeInstansi(cleanCode, instansiId)
    if (!verifiedInstansiId) {
      throw new Error(
        'Kode Instansi tidak valid atau tidak cocok dengan Instansi yang dipilih! Hubungi Super Admin.',
      )
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : ''
    const loginEmail = email && email.includes('@') ? email.trim() : `${cleanPhone}@wa.siqurban.id`

    let authData = null
    const { data, error } = await supabase.auth.signUp({
      email: loginEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: cleanPhone || null,
          role: 'admin',
          instansi_id: verifiedInstansiId,
        },
      },
    })

    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        })
        if (signInErr) throw signInErr
        authData = signInData
      } else {
        throw error
      }
    } else {
      authData = data
    }

    if (authData?.session) {
      setSession(authData.session)
    }

    await claimInstansiAccount(cleanCode, verifiedInstansiId)
    await loadProfile(authData?.user ?? authData?.session?.user)

    import('../repositories/auditRepository').then(({ auditRepository }) => {
      auditRepository.log('REGISTER_ADMIN_INSTANSI', `Admin instansi registered/claimed with code ${cleanCode}: ${loginEmail}`)
    })

    return authData
  }, [loadProfile])

  const registerJamaah = useCallback(async ({
    fullName,
    phone,
    email,
    password,
    instansiId,
    kelompokId,
    periodeSetoran = 'bulanan',
    lamaTabungan = 12,
  }) => {
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
          periode_setoran: periodeSetoran,
          lama_tabungan: Number(lamaTabungan) || 12,
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
        const { data: myAnggota } = await supabase
          .from('anggota')
          .select('id')
          .eq('user_id', data.session.user.id)
          .maybeSingle()

        if (myAnggota?.id) {
          const { saveLocalSkema } = await import('../repositories/tabunganRepository')
          saveLocalSkema(myAnggota.id, {
            periode_setoran: periodeSetoran,
            lama_tabungan: Number(lamaTabungan) || 12,
          })
          await supabase
            .from('anggota')
            .update({
              periode_setoran: periodeSetoran,
              lama_tabungan: Number(lamaTabungan) || 12,
            })
            .eq('id', myAnggota.id)
            .then(() => {})
          await supabase
            .from('tabungan')
            .update({
              periode_setoran: periodeSetoran,
              lama_tabungan: Number(lamaTabungan) || 12,
            })
            .eq('anggota_id', myAnggota.id)
            .then(() => {})
        }

        await loadProfile(data.session.user)
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
  const isAdmin = role === 'admin' || role === 'superadmin'
  const isSuperAdmin = role === 'superadmin'
  const isAdminInstansi = role === 'admin'
  const isJamaah = role === 'jamaah'

  const needsClaim = isJamaah && !profileLoading && !anggotaSaya

  // Super Admin tidak masuk ke panel instansi tertentu (selalu null)
  const instansiSaya = isSuperAdmin ? null : (profile?.instansi ?? anggotaSaya?.instansi ?? null)

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
    register: registerAdminInstansi,
    registerAdminInstansi,
    registerJamaah,
    setActiveJamaahGroup,
    setActiveAdminInstansi,
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
