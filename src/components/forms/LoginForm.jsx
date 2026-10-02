import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Phone, Lock, Building2, Users, Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { loginSchema } from '../../validations/authValidation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../api/supabaseClient'
import { cn } from '../../lib/cn'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function LoginForm() {
  const { login, setActiveJamaahGroup, getRememberedEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Mode login: 'jamaah' (wajib pilih masjid & kelompok) atau 'admin' (pengurus)
  const [loginType, setLoginType] = useState('jamaah')
  const [instansiList, setInstansiList] = useState([])
  const [kelompokList, setKelompokList] = useState([])
  const [loadingInstansi, setLoadingInstansi] = useState(false)
  const [loadingKelompok, setLoadingKelompok] = useState(false)
  const [selectedInstansiId, setSelectedInstansiId] = useState('')
  const [selectedKelompokId, setSelectedKelompokId] = useState('')
  const [groupError, setGroupError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  useEffect(() => {
    const remembered = getRememberedEmail()
    if (remembered) {
      setValue('email', remembered)
      setValue('rememberMe', true)
    }
    fetchInstansiList()
  }, [getRememberedEmail, setValue])

  useEffect(() => {
    if (selectedInstansiId) {
      fetchKelompokList(selectedInstansiId)
    } else {
      setKelompokList([])
      setSelectedKelompokId('')
    }
  }, [selectedInstansiId])

  async function fetchInstansiList() {
    setLoadingInstansi(true)
    try {
      const { data, error } = await supabase.rpc('get_public_instansi_list')
      if (!error && data) {
        setInstansiList(data)
      } else {
        const { data: rawData } = await supabase
          .from('instansi')
          .select('id, nama_instansi, alamat')
          .eq('status', true)
          .order('nama_instansi')
        setInstansiList(rawData || [])
      }
    } catch (err) {
      console.warn('Gagal muat daftar masjid di login:', err)
    } finally {
      setLoadingInstansi(false)
    }
  }

  async function fetchKelompokList(instansiId) {
    setLoadingKelompok(true)
    try {
      const { data, error } = await supabase.rpc('get_public_kelompok_list', {
        p_instansi_id: instansiId,
      })
      if (!error && data) {
        setKelompokList(data)
      } else {
        const { data: rawData } = await supabase
          .from('kelompok')
          .select('id, nama_kelompok, jenis_qurban, target_dana')
          .eq('instansi_id', instansiId)
          .eq('status', true)
          .order('nama_kelompok')
        setKelompokList(rawData || [])
      }
    } catch (err) {
      console.warn('Gagal muat daftar kelompok di login:', err)
    } finally {
      setLoadingKelompok(false)
    }
  }

  async function onSubmit(values) {
    // Validasi wajib untuk Jamaah
    if (loginType === 'jamaah') {
      if (!selectedInstansiId) {
        setGroupError('Wajib memilih Masjid / Instansi Qurban Anda.')
        return
      }
      if (!selectedKelompokId) {
        setGroupError('Wajib memilih Kelompok Qurban Anda.')
        return
      }
    }
    setGroupError('')

    try {
      await login(values)

      // Jika login sebagai Jamaah, langsung atur kelompok aktif di sesi ini
      if (loginType === 'jamaah') {
        await setActiveJamaahGroup(selectedInstansiId, selectedKelompokId)
      }

      toast.success('Selamat datang kembali!')
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Email/Nomor Telepon atau password salah')
    }
  }

  return (
    <div className="space-y-5">
      {/* TOGGLE MODE LOGIN: JAMAAH vs PENGURUS */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 p-1.5 border border-emerald-600/20">
        <button
          type="button"
          onClick={() => {
            setLoginType('jamaah')
            setGroupError('')
          }}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all duration-200',
            loginType === 'jamaah'
              ? 'bg-emerald-600 text-white shadow-soft'
              : 'text-emerald-800 dark:text-emerald-300 hover:bg-white/50 dark:hover:bg-emerald-900/40',
          )}
        >
          <User className="h-4 w-4" />
          Masuk Jamaah Qurban
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginType('admin')
            setGroupError('')
          }}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all duration-200',
            loginType === 'admin'
              ? 'bg-emerald-600 text-white shadow-soft'
              : 'text-emerald-800 dark:text-emerald-300 hover:bg-white/50 dark:hover:bg-emerald-900/40',
          )}
        >
          <Shield className="h-4 w-4" />
          Masuk Pengurus / Admin
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* FIELD PILIH MASJID & KELOMPOK KHUSUS MODE JAMAAH */}
        {loginType === 'jamaah' && (
          <div className="space-y-3.5 rounded-2xl border border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-4">
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-600" />
              Pilih Masjid & Kelompok Aktif Anda:
            </div>

            {/* DROPDOWN MASJID */}
            <div>
              <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                Masjid / Instansi Qurban <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedInstansiId}
                onChange={(e) => {
                  setSelectedInstansiId(e.target.value)
                  setGroupError('')
                }}
                disabled={loadingInstansi}
                className="block w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3 py-2 text-xs font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              >
                <option value="">
                  {loadingInstansi ? '-- Memuat daftar masjid... --' : '-- Pilih Masjid / Instansi --'}
                </option>
                {instansiList.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.nama_instansi} {ins.alamat ? `— (${ins.alamat})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* DROPDOWN KELOMPOK */}
            <div>
              <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                Kelompok Qurban <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedKelompokId}
                onChange={(e) => {
                  setSelectedKelompokId(e.target.value)
                  setGroupError('')
                }}
                disabled={!selectedInstansiId || loadingKelompok}
                className="block w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3 py-2 text-xs font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              >
                <option value="">
                  {!selectedInstansiId
                    ? '-- Pilih Masjid terlebih dahulu --'
                    : loadingKelompok
                      ? '-- Memuat kelompok... --'
                      : '-- Pilih Kelompok Qurban --'}
                </option>
                {kelompokList.map((klp) => (
                  <option key={klp.id} value={klp.id}>
                    {klp.nama_kelompok} — ({klp.jenis_qurban === 'sapi' ? 'Sapi 1/7' : 'Kambing 1/1'})
                  </option>
                ))}
              </select>
            </div>

            {groupError && (
              <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200">
                ⚠️ {groupError}
              </p>
            )}
          </div>
        )}

        <Input
          label="Email / Nomor Telepon (WA)"
          type="text"
          icon={Phone}
          placeholder="081234567890 atau email@masjid.id"
          required
          autoComplete="username"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-muted dark:text-ink-muted-dark">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border dark:border-border-dark text-emerald-600 focus:ring-emerald-500"
              {...register('rememberMe')}
            />
            Ingat saya
          </label>
          <Link to="/reset-password" className="font-medium text-emerald-600 hover:underline">
            Lupa password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          {loginType === 'jamaah' ? 'Masuk ke Kelompok Saya' : 'Masuk sebagai Pengurus / Admin'}
        </Button>

        <div className="pt-4 border-t border-border dark:border-border-dark text-center">
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
            Belum memiliki akun Jamaah?{' '}
            <Link
              to="/register"
              className="font-bold text-emerald-600 hover:text-emerald-500 hover:underline dark:text-emerald-400"
            >
              Daftar Akun Baru
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
