import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { claimInstansiAccount } from '../../repositories/instansiRepository'

const claimSchema = z.object({
  kode_registrasi: z.string().min(1, 'Kode Registrasi wajib diisi'),
  full_name: z.string().min(3, 'Nama Lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export default function ClaimInstansiPage() {
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(claimSchema),
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      // 1. Register akun baru via Supabase Auth (default jadi jamaah)
      await authRegister({
        email: data.email,
        password: data.password,
        fullName: data.full_name,
      })

      // 2. Eksekusi klaim instansi untuk mengubah role dan mengikat instansi_id
      await claimInstansiAccount(data.kode_registrasi.trim())

      toast.success('Pendaftaran admin masjid berhasil!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || 'Terjadi kesalahan saat mendaftar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Daftar Admin Masjid</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted dark:text-ink-muted-dark">
        Masukkan <strong>Kode Registrasi</strong> yang diberikan oleh Super Admin beserta email Anda untuk mulai mengelola masjid Anda.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Kode Registrasi"
          placeholder="Contoh: QURBAN-ALFALAH-99X"
          {...register('kode_registrasi')}
          error={errors.kode_registrasi?.message}
        />
        
        <Input
          label="Nama Lengkap"
          placeholder="Masukkan nama lengkap Anda"
          {...register('full_name')}
          error={errors.full_name?.message}
        />

        <Input
          label="Email (untuk login)"
          type="email"
          placeholder="admin@masjid.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Min. 6 karakter"
          {...register('password')}
          error={errors.password?.message}
        />

        <Button type="submit" loading={isLoading} className="w-full mt-6">
          Daftar Admin
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
          Masuk di sini
        </Link>
      </div>
    </div>
  )
}
