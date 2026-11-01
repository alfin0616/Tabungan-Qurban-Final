import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image as ImageIcon, CreditCard, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsSchema } from '../../validations/settingsValidation'
import { useAuth } from '../../context/AuthContext'
import { useUpdateInstansi } from '../../hooks/useInstansi'
import { uploadLogo } from '../../repositories/settingsRepository'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import { Card, CardHeader, CardTitle } from '../ui/Card'

export default function SettingsForm() {
  const { instansiSaya, refreshProfile, loading } = useAuth()
  const updateInstansi = useUpdateInstansi()
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
      telepon: '',
      email: '',
      nama_bank: '',
      nomor_rekening: '',
      atas_nama_rekening: '',
    },
  })

  useEffect(() => {
    if (instansiSaya) {
      reset({
        nama_instansi: instansiSaya.nama_instansi || '',
        alamat: instansiSaya.alamat || '',
        logo: instansiSaya.logo || null,
        telepon: instansiSaya.telepon || '',
        email: instansiSaya.email || '',
        nama_bank: instansiSaya.nama_bank || '',
        nomor_rekening: instansiSaya.nomor_rekening || instansiSaya.rekening || '',
        atas_nama_rekening: instansiSaya.atas_nama_rekening || '',
      })
      setPreviewUrl(instansiSaya.logo || null)
    }
  }, [instansiSaya, reset])

  async function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadLogo(file)
      setValue('logo', url)
    } catch {
      toast.error('Gagal mengunggah logo')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values) {
    if (!instansiSaya?.id) {
      toast.error('Instansi tidak ditemukan pada profil Anda.')
      return
    }
    try {
      await updateInstansi.mutateAsync({
        id: instansiSaya.id,
        ...values,
      })
      await refreshProfile()
      toast.success('Pengaturan & Rekening Instansi berhasil disimpan')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengaturan instansi')
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tl from-emerald-800 to-emerald-600 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Pengaturan Profil & Rekening Instansi</CardTitle>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
              Nomor rekening yang diatur di sini akan otomatis ditampilkan pada panel Jamaah instansi Anda.
            </p>
          </div>
        </div>
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
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-ink dark:text-ink-dark hover:border-emerald-700">
            {uploading ? 'Mengunggah...' : 'Ubah Logo Instansi'}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </label>
        </div>

        <Input
          label="Nama Masjid / Instansi"
          required
          error={errors.nama_instansi?.message}
          {...register('nama_instansi')}
        />
        <Input label="Alamat Lengkap" required error={errors.alamat?.message} {...register('alamat')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Kontak / Telepon"
            required
            error={errors.telepon?.message}
            {...register('telepon')}
          />
          <Input
            label="Email Instansi (Opsional)"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* Seksi Rekening Qurban Instansi */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            <CreditCard className="h-4 w-4" />
            <span>Nomor Rekening Tabungan Qurban Instansi</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nama Bank"
              required
              placeholder="Misal: BSI (Bank Syariah Indonesia)"
              error={errors.nama_bank?.message}
              {...register('nama_bank')}
            />
            <Input
              label="Nomor Rekening"
              required
              placeholder="Misal: 7123456789"
              error={errors.nomor_rekening?.message}
              {...register('nomor_rekening')}
            />
          </div>

          <Input
            label="Atas Nama Pemilik Rekening"
            required
            placeholder="Misal: DKM Masjid Al-Ikhlas / Panitia Qurban"
            error={errors.atas_nama_rekening?.message}
            {...register('atas_nama_rekening')}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={isSubmitting || updateInstansi.isPending}>
            Simpan Pengaturan Instansi
          </Button>
        </div>
      </form>
    </Card>
  )
}
