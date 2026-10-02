import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPasswordSchema, newPasswordSchema } from '../../validations/authValidation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../api/supabaseClient'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ResetPasswordPage() {
  const { resetPassword, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecoveryMode(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const requestForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  })

  const newPasswordForm = useForm({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onRequestReset(values) {
    try {
      await resetPassword(values.email)
      setSent(true)
      toast.success('Tautan reset password telah dikirim ke email Anda')
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim email reset password')
    }
  }

  async function onSetNewPassword(values) {
    try {
      await updatePassword(values.password)
      toast.success('Password berhasil diperbarui, silakan masuk kembali')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui password')
    }
  }

  if (isRecoveryMode) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Buat password baru</h1>
        <p className="mt-1 mb-6 text-sm text-ink-muted dark:text-ink-muted-dark">
          Masukkan password baru untuk akun Anda.
        </p>
        <form onSubmit={newPasswordForm.handleSubmit(onSetNewPassword)} className="space-y-4">
          <Input
            label="Password Baru"
            type="password"
            icon={Lock}
            required
            error={newPasswordForm.formState.errors.password?.message}
            {...newPasswordForm.register('password')}
          />
          <Input
            label="Konfirmasi Password"
            type="password"
            icon={Lock}
            required
            error={newPasswordForm.formState.errors.confirmPassword?.message}
            {...newPasswordForm.register('confirmPassword')}
          />
          <Button type="submit" className="w-full" loading={newPasswordForm.formState.isSubmitting}>
            Simpan Password Baru
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-emerald-600">
        <ArrowLeft className="h-4 w-4" /> Kembali ke halaman masuk
      </Link>

      <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Lupa password?</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted dark:text-ink-muted-dark">
        Masukkan email Anda, kami akan kirimkan tautan untuk mengatur ulang password.
      </p>

      {sent ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          Email telah dikirim. Periksa kotak masuk Anda dan ikuti tautan yang tersedia.
        </div>
      ) : (
        <form onSubmit={requestForm.handleSubmit(onRequestReset)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="admin@masjid.id"
            required
            error={requestForm.formState.errors.email?.message}
            {...requestForm.register('email')}
          />
          <Button type="submit" className="w-full" loading={requestForm.formState.isSubmitting}>
            Kirim Tautan Reset
          </Button>
        </form>
      )}
    </div>
  )
}
