import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { LogOut, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useClaimAkunAnggota } from '../../hooks/useAnggota'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import logoSiqurban from '../../assets/logo-siqurban.png'

const claimSchema = z.object({
  kodeAnggota: z.string().min(1, 'Kode Anggota wajib diisi'),
  noHp: z.string().min(6, 'No. HP wajib diisi'),
})

export default function ClaimAkunPage() {
  const { logout, refreshProfile, user } = useAuth()
  const navigate = useNavigate()
  const claimMutation = useClaimAkunAnggota()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: { kodeAnggota: '', noHp: '' },
  })

  async function onSubmit(values) {
    try {
      await claimMutation.mutateAsync(values)
      toast.success('Akun berhasil dihubungkan ke data anggota Anda')
      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Gagal menghubungkan akun')
    }
  }

  async function handleLogout() {
    await logout()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg dark:bg-bg-dark px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img src={logoSiqurban} alt="SIQURBAN" className="h-14 w-14 rounded-full object-cover" />
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{user?.email}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hubungkan Akun Anda</CardTitle>
          </CardHeader>
          <p className="mb-4 text-sm text-ink-muted dark:text-ink-muted-dark">
            Akun Anda belum terhubung ke data anggota manapun. Masukkan{' '}
            <strong>Kode Anggota</strong> dan <strong>No. HP</strong> yang terdaftar di data
            Anda — tanyakan ke admin instansi kalau belum tahu Kode Anggota Anda.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Kode Anggota"
              placeholder="Contoh: ANG-0001"
              required
              error={errors.kodeAnggota?.message}
              {...register('kodeAnggota')}
            />
            <Input
              label="No. HP"
              placeholder="Sesuai yang terdaftar"
              required
              error={errors.noHp?.message}
              {...register('noHp')}
            />
            <Button type="submit" className="w-full" loading={isSubmitting || claimMutation.isPending}>
              <UserCheck className="h-4 w-4" /> Hubungkan Akun
            </Button>
          </form>
        </Card>

        <button
          onClick={handleLogout}
          className="mx-auto mt-4 flex items-center gap-1.5 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-danger"
        >
          <LogOut className="h-4 w-4" /> Keluar dan masuk dengan akun lain
        </button>
      </div>
    </div>
  )
}