import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { profileSchema } from '../../validations/profileValidation'
import { changePasswordSchema } from '../../validations/authValidation'
import { useAuth } from '../../context/AuthContext'
import { updateProfile, uploadAvatar } from '../../repositories/profileRepository'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { Card, CardHeader, CardTitle } from '../ui/Card'

export default function ProfileForm() {
  const { user, profile, updatePassword } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url ?? null)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '', avatar_url: profile?.avatar_url ?? null },
  })

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  async function handleFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadAvatar(file, user.id)
      profileForm.setValue('avatar_url', url)
    } finally {
      setUploading(false)
    }
  }

  async function onSaveProfile(values) {
    try {
      await updateProfile(user.id, values)
      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui profil')
    }
  }

  async function onChangePassword(values) {
    try {
      await updatePassword(values.newPassword)
      toast.success('Password berhasil diperbarui')
      passwordForm.reset()
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui password')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
        </CardHeader>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar src={previewUrl} name={profileForm.watch('full_name') || user?.email} size={72} />
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-ink dark:text-ink-dark hover:border-emerald-500">
              <Camera className="h-4 w-4" />
              {uploading ? 'Mengunggah...' : 'Ubah Foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
            </label>
          </div>

          <Input label="Email" value={user?.email ?? ''} disabled className="opacity-70" />
          <Input
            label="Nama Lengkap"
            required
            error={profileForm.formState.errors.full_name?.message}
            {...profileForm.register('full_name')}
          />

          <div className="flex justify-end">
            <Button type="submit" loading={profileForm.formState.isSubmitting}>
              Simpan Profil
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
        </CardHeader>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
          <Input
            label="Password Baru"
            type="password"
            required
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register('newPassword')}
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            required
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword')}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="outline" loading={passwordForm.formState.isSubmitting}>
              Perbarui Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
