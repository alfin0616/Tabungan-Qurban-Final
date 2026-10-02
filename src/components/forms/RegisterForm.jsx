import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Lock, Building2, Users, ShieldCheck, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerJamaahSchema } from '../../validations/authValidation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../api/supabaseClient'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function RegisterForm() {
  const { registerJamaah } = useAuth()
  const navigate = useNavigate()

  const [instansiList, setInstansiList] = useState([])
  const [kelompokList, setKelompokList] = useState([])
  const [loadingInstansi, setLoadingInstansi] = useState(true)
  const [loadingKelompok, setLoadingKelompok] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerJamaahSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      instansiId: '',
      kelompokId: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const selectedInstansiId = watch('instansiId')

  useEffect(() => {
    fetchInstansiList()
  }, [])

  useEffect(() => {
    if (selectedInstansiId) {
      fetchKelompokList(selectedInstansiId)
    } else {
      setKelompokList([])
      setValue('kelompokId', '')
    }
  }, [selectedInstansiId, setValue])

  async function fetchInstansiList() {
    setLoadingInstansi(true)
    try {
      const { data, error } = await supabase.rpc('get_public_instansi_list')
      if (!error && data) {
        setInstansiList(data)
      } else {
        // Fallback jika belum migrasi rpc
        const { data: rawData } = await supabase
          .from('instansi')
          .select('id, nama_instansi, alamat')
          .eq('status', true)
          .order('nama_instansi')
        setInstansiList(rawData || [])
      }
    } catch (err) {
      console.warn('Gagal muat daftar masjid:', err)
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
      console.warn('Gagal muat daftar kelompok:', err)
    } finally {
      setLoadingKelompok(false)
    }
  }

  async function onSubmit(values) {
    try {
      await registerJamaah({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        password: values.password,
        instansiId: values.instansiId,
        kelompokId: values.kelompokId,
      })
      toast.success('Pendaftaran Jamaah Berhasil! Anda terhubung ke Masjid & Kelompok Qurban.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Gagal mendaftarkan akun. Nomor telepon atau email mungkin sudah terdaftar.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Wajib Pilih Masjid & Kelompok:</span> Pemilihan masjid dan kelompok Qurban di awal memastikan Anda melihat data pemasukan dan pengeluaran yang tepat.
        </div>
      </div>

      <Input
        label="Nama Lengkap"
        type="text"
        icon={User}
        placeholder="Contoh: Ahmad Zaki"
        required
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <Input
        label="Nomor Telepon / WhatsApp (Wajib)"
        type="tel"
        icon={Phone}
        placeholder="Contoh: 081234567890"
        required
        error={errors.phone?.message}
        {...register('phone')}
      />

      {/* DROPDOWN MASJID / INSTANSI */}
      <div>
        <label className="block text-sm font-semibold text-ink dark:text-ink-dark mb-1.5 flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-emerald-600" />
          Pilih Masjid / Instansi Qurban <span className="text-red-500">*</span>
        </label>
        <select
          {...register('instansiId')}
          disabled={loadingInstansi}
          className="block w-full rounded-xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark px-3.5 py-2.5 text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
        >
          <option value="">
            {loadingInstansi ? '-- Memuat daftar masjid... --' : '-- Pilih Masjid / Instansi Anda --'}
          </option>
          {instansiList.map((ins) => (
            <option key={ins.id} value={ins.id}>
              {ins.nama_instansi} {ins.alamat ? `— (${ins.alamat})` : ''}
            </option>
          ))}
        </select>
        {errors.instansiId && (
          <p className="mt-1 text-xs font-medium text-red-500">{errors.instansiId.message}</p>
        )}
      </div>

      {/* DROPDOWN KELOMPOK */}
      <div>
        <label className="block text-sm font-semibold text-ink dark:text-ink-dark mb-1.5 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-emerald-600" />
          Pilih Kelompok Qurban <span className="text-red-500">*</span>
        </label>
        <select
          {...register('kelompokId')}
          disabled={!selectedInstansiId || loadingKelompok}
          className="block w-full rounded-xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark px-3.5 py-2.5 text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
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
              {klp.nama_kelompok} — ({klp.jenis_qurban === 'sapi' ? 'Sapi 1/7' : 'Kambing 1/1'}, Target: Rp {Number(klp.target_dana || 3500000).toLocaleString('id-ID')})
            </option>
          ))}
        </select>
        {errors.kelompokId && (
          <p className="mt-1 text-xs font-medium text-red-500">{errors.kelompokId.message}</p>
        )}
      </div>

      <Input
        label="Email (Opsional)"
        type="email"
        icon={Mail}
        placeholder="ahmad@gmail.com (Opsional)"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Kata Sandi (Password)"
        type="password"
        icon={Lock}
        placeholder="Minimal 6 karakter"
        required
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Konfirmasi Kata Sandi"
        type="password"
        icon={Lock}
        placeholder="Ulangi kata sandi Anda"
        required
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" className="w-full mt-3" loading={isSubmitting}>
        Daftar & Hubungkan ke Kelompok
      </Button>

      <div className="pt-4 border-t border-border dark:border-border-dark text-center">
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
          Sudah memiliki akun?{' '}
          <Link
            to="/login"
            className="font-bold text-emerald-600 hover:text-emerald-500 hover:underline dark:text-emerald-400"
          >
            Masuk Sekarang
          </Link>
        </p>
      </div>
    </form>
  )
}
