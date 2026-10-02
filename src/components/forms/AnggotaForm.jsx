import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import { anggotaSchema } from '../../validations/anggotaValidation'
import { uploadAnggotaFoto } from '../../repositories/anggotaRepository'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

export default function AnggotaForm({ defaultValues, anggotaId, onSubmit, onCancel, submitLabel = 'Simpan' }) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(defaultValues?.foto ?? null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(anggotaSchema),
    defaultValues: {
      nama: '',
      alamat: '',
      no_hp: '',
      jenis_kelamin: 'L',
      tanggal_bergabung: new Date().toISOString().slice(0, 10),
      status: true,
      foto: null,
      ...defaultValues,
    },
  })

  async function handleFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadAnggotaFoto(file, anggotaId || 'baru')
      setValue('foto', url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar src={previewUrl} name={watch('nama')} size={64} />
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-ink dark:text-ink-dark hover:border-emerald-500">
          <Camera className="h-4 w-4" />
          {uploading ? 'Mengunggah...' : 'Ubah Foto'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
        </label>
      </div>

      <Input label="Nama Lengkap" required error={errors.nama?.message} {...register('nama')} />
      <Input label="Alamat" required error={errors.alamat?.message} {...register('alamat')} />

      <div className="grid grid-cols-2 gap-4">
        <Input label="No. HP" required error={errors.no_hp?.message} {...register('no_hp')} />
        <Controller
          control={control}
          name="jenis_kelamin"
          render={({ field }) => (
            <Select
              label="Jenis Kelamin"
              required
              error={errors.jenis_kelamin?.message}
              options={[
                { value: 'L', label: 'Laki-laki' },
                { value: 'P', label: 'Perempuan' },
              ]}
              {...field}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tanggal Bergabung"
          type="date"
          required
          error={errors.tanggal_bergabung?.message}
          {...register('tanggal_bergabung')}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              label="Status"
              options={[
                { value: 'true', label: 'Aktif' },
                { value: 'false', label: 'Tidak Aktif' },
              ]}
              value={String(field.value)}
              onChange={(e) => field.onChange(e.target.value === 'true')}
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
