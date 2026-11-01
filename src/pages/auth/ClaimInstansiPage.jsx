import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, KeyRound, User, Mail, Phone, Lock, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../api/supabaseClient'

const claimSchema = z.object({
  instansi_id: z.string().min(1, 'Wajib memilih Masjid / Instansi'),
  kode_registrasi: z
    .string()
    .min(3, 'Wajib mencantumkan Kode Instansi resmi (contoh: INS-0001)'),
  full_name: z.string().min(3, 'Nama Lengkap minimal 3 karakter'),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export default function ClaimInstansiPage() {
  const { registerAdminInstansi } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [instansiList, setInstansiList] = useState([])
  const [loadingInstansi, setLoadingInstansi] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      instansi_id: '',
      kode_registrasi: '',
      full_name: '',
      phone: '',
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    async function loadInstansi() {
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
        console.warn('Gagal memuat instansi:', err)
      } finally {
        setLoadingInstansi(false)
      }
    }
    loadInstansi()
  }, [])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await registerAdminInstansi({
        fullName: data.full_name,
        phone: data.phone || '',
        email: data.email,
        password: data.password,
        instansiId: data.instansi_id,
        kodeRegistrasi: data.kode_registrasi.trim(),
      })

      toast.success('Pendaftaran Admin Instansi berhasil diverifikasi!')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Kode Instansi tidak valid atau gagal mendaftar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Daftar Admin Instansi</h1>
      <p className="mt-1 mb-4 text-sm text-ink-muted dark:text-ink-muted-dark">
        Khusus pengurus masjid/instansi resmi. Pendaftaran wajib mencantumkan <strong>Kode Instansi</strong> yang diberikan oleh Super Admin.
      </p>

      <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
        <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Verifikasi Keamanan:</span> Tanpa Kode Instansi yang cocok dengan Masjid/Instansi tujuan, pendaftaran Admin tidak akan diproses.
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-ink dark:text-ink-dark mb-1.5 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Pilih Masjid / Instansi Qurban <span className="text-red-500">*</span>
          </label>
          <select
            {...register('instansi_id')}
            disabled={loadingInstansi}
            className="block w-full rounded-xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark px-3.5 py-2.5 text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          >
            <option value="">
              {loadingInstansi ? '-- Memuat daftar instansi... --' : '-- Pilih Masjid / Instansi --'}
            </option>
            {instansiList.map((ins) => (
              <option key={ins.id} value={ins.id}>
                {ins.nama_instansi} {ins.alamat ? `— (${ins.alamat})` : ''}
              </option>
            ))}
          </select>
          {errors.instansi_id && (
            <p className="mt-1 text-xs font-medium text-red-500">{errors.instansi_id.message}</p>
          )}
        </div>

        <Input
          label="Kode Instansi Resmi (Wajib)"
          icon={KeyRound}
          required
          placeholder="Contoh: INS-0001 atau QURBAN-XXXXXX"
          {...register('kode_registrasi')}
          error={errors.kode_registrasi?.message}
        />

        <Input
          label="Nama Lengkap Pengurus"
          icon={User}
          required
          placeholder="Masukkan nama lengkap Anda"
          {...register('full_name')}
          error={errors.full_name?.message}
        />

        <Input
          label="No. Telepon / WhatsApp (Opsional)"
          icon={Phone}
          placeholder="Contoh: 081234567890"
          {...register('phone')}
          error={errors.phone?.message}
        />

        <Input
          label="Email (untuk login)"
          type="email"
          icon={Mail}
          required
          placeholder="admin@masjid.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          required
          placeholder="Min. 6 karakter"
          {...register('password')}
          error={errors.password?.message}
        />

        <Button type="submit" loading={isLoading} className="w-full mt-6">
          Verifikasi Kode & Daftar Admin Instansi
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
        Sudah punya akun Admin Instansi?{' '}
        <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
          Masuk di sini
        </Link>
      </div>
    </div>
  )
}
