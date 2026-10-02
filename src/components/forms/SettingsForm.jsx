import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsSchema } from '../../validations/settingsValidation'
import { useSettings, useUpdateSettings } from '../../hooks/useSettings'
import { uploadLogo } from '../../repositories/settingsRepository'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import { Card, CardHeader, CardTitle } from '../ui/Card'

export default function SettingsForm() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      nama_instansi: '',
      alamat: '',
      logo: null,
      target_qurban: 0,
      rekening: '',
      telepon: '',
    },
  })

  useEffect(() => {
    if (settings) {
      reset(settings)
      setPreviewUrl(settings.logo)
    }
  }, [settings, reset])

  async function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadLogo(file)
      setValue('logo', url)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values) {
    try {
      await updateSettings.mutateAsync(values)
      toast.success('Pengaturan berhasil disimpan')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengaturan')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Masjid / Instansi</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark">
            {previewUrl ? (
              <img src={previewUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-6 w-6 text-ink-muted dark:text-ink-muted-dark" />
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-ink dark:text-ink-dark hover:border-emerald-500">
            {uploading ? 'Mengunggah...' : 'Ubah Logo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </label>
        </div>

        <Input
          label="Nama Masjid / Instansi"
          required
          error={errors.nama_instansi?.message}
          {...register('nama_instansi')}
        />
        <Input label="Alamat" required error={errors.alamat?.message} {...register('alamat')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Target Qurban Keseluruhan (Rp)"
            type="number"
            min={0}
            error={errors.target_qurban?.message}
            {...register('target_qurban')}
          />
          <Input
            label="Nomor Rekening"
            required
            error={errors.rekening?.message}
            {...register('rekening')}
          />
        </div>

        <Input label="Kontak / Telepon" required error={errors.telepon?.message} {...register('telepon')} />

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting || updateSettings.isPending}>
            Simpan Pengaturan
          </Button>
        </div>
      </form>
    </Card>
  )
}
