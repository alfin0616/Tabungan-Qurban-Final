import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
import { pengeluaranSchema } from '../../validations/pengeluaranValidation'
import { KATEGORI_OPTIONS, uploadBuktiPengeluaran } from '../../repositories/pengeluaranRepository'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

export default function PengeluaranForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Simpan' }) {
  const [uploading, setUploading] = useState(false)
  const [buktiPreview, setBuktiPreview] = useState(defaultValues?.bukti ?? null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(pengeluaranSchema),
    defaultValues: {
      tanggal: new Date().toISOString().slice(0, 10),
      kategori: 'lainnya',
      nominal: '',
      keterangan: '',
      bukti: null,
      ...defaultValues,
    },
  })

  async function handleBuktiChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBuktiPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadBuktiPengeluaran(file)
      setValue('bukti', url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Tanggal" type="date" required error={errors.tanggal?.message} {...register('tanggal')} />

      <Controller
        control={control}
        name="kategori"
        render={({ field }) => (
          <Select
            label="Kategori"
            required
            error={errors.kategori?.message}
            options={KATEGORI_OPTIONS}
            {...field}
          />
        )}
      />

      <Input
        label="Nominal (Rp)"
        type="number"
        min={0}
        required
        error={errors.nominal?.message}
        {...register('nominal')}
      />

      <Input
        label="Keterangan"
        placeholder="Contoh: Pembayaran listrik bulan Juli"
        required
        error={errors.keterangan?.message}
        {...register('keterangan')}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink dark:text-ink-dark">Bukti / Nota (opsional)</label>
        <div className="flex items-center gap-3">
          {buktiPreview && (
            <img src={buktiPreview} alt="Bukti" className="h-14 w-14 rounded-lg border border-border dark:border-border-dark object-cover" />
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-ink dark:text-ink-dark hover:border-emerald-500">
            <Upload className="h-4 w-4" />
            {uploading ? 'Mengunggah...' : 'Unggah Foto Nota'}
            <input type="file" accept="image/*" className="hidden" onChange={handleBuktiChange} />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" variant="danger" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
