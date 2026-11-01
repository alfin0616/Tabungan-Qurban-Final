import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, CalendarClock, Calculator } from 'lucide-react'
import { anggotaSchema } from '../../validations/anggotaValidation'
import { uploadAnggotaFoto } from '../../repositories/anggotaRepository'
import { useKelompokSelect } from '../../hooks/useKelompok'
import { useAuth } from '../../context/AuthContext'
import {
  formatCurrency,
  calculateSkemaTabungan,
  LAMA_TABUNGAN_PRESETS,
} from '../../utils/formatCurrency'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

export default function AnggotaForm({ defaultValues, anggotaId, onSubmit, onCancel, submitLabel = 'Simpan' }) {
  const { instansiSaya, profile } = useAuth()
  const activeInstansiId = instansiSaya?.id || profile?.instansi_id || null
  const { data: kelompokList, isLoading: loadingKelompok } = useKelompokSelect(activeInstansiId)

  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(defaultValues?.foto ?? null)
  const initialLama = Number(defaultValues?.lama_tabungan || 12)
  const isPresetInit = LAMA_TABUNGAN_PRESETS.some((p) => p.value === initialLama)
  const [customMode, setCustomMode] = useState(!isPresetInit)

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
      kelompok_id: defaultValues?.kelompok_id || '',
      nama: '',
      alamat: '',
      no_hp: '',
      jenis_kelamin: 'L',
      tanggal_bergabung: new Date().toISOString().slice(0, 10),
      periode_setoran: defaultValues?.periode_setoran || 'bulanan',
      lama_tabungan: initialLama,
      status: true,
      foto: null,
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (!defaultValues?.kelompok_id && kelompokList?.length === 1) {
      setValue('kelompok_id', kelompokList[0].id)
    }
  }, [defaultValues, kelompokList, setValue])

  const selectedKelompokId = watch('kelompok_id')
  const periodeSetoran = watch('periode_setoran')
  const lamaTabungan = watch('lama_tabungan')

  const targetPerAnggota = useMemo(() => {
    const klp = (kelompokList || []).find((k) => k.id === selectedKelompokId)
    if (!klp) return 3000000
    const total = Number(klp.target_dana || 21000000)
    const kuota = Number(klp.maksimal_anggota || (klp.jenis_qurban === 'kambing' ? 1 : 7))
    return kuota > 1 && total >= 7000000 ? Math.ceil(total / kuota) : total
  }, [kelompokList, selectedKelompokId])

  const simulasi = useMemo(
    () =>
      calculateSkemaTabungan({
        target: targetPerAnggota,
        saldo: 0,
        periode: periodeSetoran,
        lamaBulan: lamaTabungan,
      }),
    [targetPerAnggota, periodeSetoran, lamaTabungan],
  )

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

      <Controller
        control={control}
        name="kelompok_id"
        render={({ field }) => (
          <Select
            label="Kelompok Qurban"
            required
            error={errors.kelompok_id?.message}
            options={[
              {
                value: '',
                label: loadingKelompok ? '-- Memuat kelompok... --' : '-- Pilih Kelompok Qurban --',
              },
              ...(kelompokList || []).map((k) => ({
                value: k.id,
                label: `${k.nama_kelompok} (${k.kode_kelompok || ''})`,
              })),
            ]}
            {...field}
          />
        )}
      />

      {/* Skema Setoran (Bulanan / Mingguan) & Lama Tabungan Fleksibel */}
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-950/25 p-4 space-y-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Skema Setoran &amp; Lama Tabungan (Fleksibel Tanpa Batas Waktu)</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Controller
            control={control}
            name="periode_setoran"
            render={({ field }) => (
              <Select
                label="Pilihan Siklus Setoran"
                value={field.value}
                onChange={field.onChange}
                error={errors.periode_setoran?.message}
                options={[
                  { value: 'bulanan', label: 'Setoran Bulanan' },
                  { value: 'mingguan', label: 'Setoran Mingguan' },
                ]}
              />
            )}
          />

          <Select
            label="Pilihan Lama Tabungan"
            value={customMode ? 'custom' : String(lamaTabungan)}
            onChange={(e) => {
              const val = e.target.value
              if (val === 'custom') {
                setCustomMode(true)
              } else {
                setCustomMode(false)
                setValue('lama_tabungan', Number(val), { shouldValidate: true })
              }
            }}
            options={[
              ...LAMA_TABUNGAN_PRESETS.map((p) => ({ value: String(p.value), label: p.label })),
              { value: 'custom', label: 'Kustom (Input Bebas Sesuai Kemampuan)' },
            ]}
          />
        </div>

        {customMode && (
          <Input
            label="Masukkan Lama Tabungan (Bulan)"
            type="number"
            min={1}
            max={120}
            placeholder="Contoh: 30 (untuk 30 bulan)"
            error={errors.lama_tabungan?.message}
            {...register('lama_tabungan')}
          />
        )}

        {/* Kotak Simulasi Cicilan Otomatis */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-white dark:bg-bg-dark p-3 text-xs">
          <div className="flex items-center gap-2 text-ink-muted dark:text-ink-muted-dark">
            <Calculator className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Estimasi setoran ({simulasi.lamaBulan} bulan / {simulasi.totalPeriode}x {simulasi.labelPeriode}):
            </span>
          </div>
          <div className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
            {formatCurrency(simulasi.nominalPerPeriode)} / {simulasi.labelPeriode}
          </div>
        </div>
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
