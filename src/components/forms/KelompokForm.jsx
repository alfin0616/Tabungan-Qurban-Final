import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Users, Sparkles, CheckSquare, Square } from 'lucide-react'
import { kelompokSchema } from '../../validations/kelompokValidation'
import { useInstansiSelect } from '../../hooks/useInstansi'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../utils/formatCurrency'
import Input from '../ui/Input'
import Select from '../ui/Select'

export default function KelompokForm({ initialData, onSubmit, onCancel, isSubmitting }) {
  const { isSuperAdmin, instansiSaya, profile } = useAuth()
  const { data: instansiList, isLoading: loadingInstansi } = useInstansiSelect()
  const adminInstansiId = instansiSaya?.id || profile?.instansi_id || ''

  const [syncMembersTarget, setSyncMembersTarget] = useState(true)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(kelompokSchema),
    defaultValues: initialData || {
      instansi_id: adminInstansiId,
      nama_kelompok: '',
      jenis_qurban: 'sapi',
      target_dana: 21000000,
      maksimal_anggota: 7,
      tahun: new Date().getFullYear(),
      status: true,
    },
  })

  const jenisQurban = watch('jenis_qurban')
  const targetDana = Number(watch('target_dana') || 0)
  const maksimalAnggota = Number(watch('maksimal_anggota') || (jenisQurban === 'kambing' ? 1 : 7))
  const targetPerAnggota = maksimalAnggota > 0 ? Math.round(targetDana / maksimalAnggota) : targetDana

  useEffect(() => {
    if (!initialData && !isSuperAdmin && adminInstansiId) {
      setValue('instansi_id', adminInstansiId)
    }
  }, [initialData, isSuperAdmin, adminInstansiId, setValue])

  function handleSetTargetPerAnggota(val) {
    const num = Number(val) || 0
    setValue('target_dana', num * (maksimalAnggota || 1), { shouldValidate: true })
  }

  function handleFormSubmit(values) {
    onSubmit({
      ...values,
      syncMembersTarget: initialData ? syncMembersTarget : true,
    })
  }

  const presets =
    jenisQurban === 'kambing'
      ? [
          { label: 'Rp 2,5 Jt', perOrg: 2500000, total: 2500000 },
          { label: 'Rp 3 Jt', perOrg: 3000000, total: 3000000 },
          { label: 'Rp 3,5 Jt', perOrg: 3500000, total: 3500000 },
          { label: 'Rp 4 Jt', perOrg: 4000000, total: 4000000 },
        ]
      : [
          { label: 'Rp 21 Jt (Rp 3 Jt / org)', perOrg: 3000000, total: 21000000 },
          { label: 'Rp 24,5 Jt (Rp 3,5 Jt / org)', perOrg: 3500000, total: 24500000 },
          { label: 'Rp 28 Jt (Rp 4 Jt / org)', perOrg: 4000000, total: 28000000 },
          { label: 'Rp 35 Jt (Rp 5 Jt / org)', perOrg: 5000000, total: 35000000 },
        ]

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {isSuperAdmin ? (
        <Controller
          name="instansi_id"
          control={control}
          render={({ field }) => (
            <Select
              label="Masjid / Instansi"
              value={field.value}
              onChange={field.onChange}
              error={errors.instansi_id?.message}
              options={[
                { value: '', label: loadingInstansi ? 'Memuat Instansi...' : '-- Pilih Instansi --' },
                ...(instansiList || []).map((i) => ({ value: i.id, label: i.nama_instansi })),
              ]}
            />
          )}
        />
      ) : (
        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1">
            Masjid / Instansi
          </label>
          <input
            type="text"
            disabled
            value={instansiSaya?.nama_instansi || 'Instansi Anda'}
            className="w-full rounded-xl border border-border dark:border-border-dark bg-bg/80 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm font-semibold text-ink-muted dark:text-ink-muted-dark cursor-not-allowed"
          />
        </div>
      )}

      <Input
        label="Nama Kelompok"
        {...register('nama_kelompok')}
        error={errors.nama_kelompok?.message}
        placeholder="Misal: Kelompok 1 (Sapi)"
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="jenis_qurban"
          control={control}
          render={({ field }) => (
            <Select
              label="Jenis Qurban"
              value={field.value}
              onChange={(e) => {
                const val = e.target.value
                field.onChange(val)
                const newMax = val === 'kambing' ? 1 : 7
                setValue('maksimal_anggota', newMax)
                setValue('target_dana', val === 'kambing' ? 3000000 : 21000000)
              }}
              error={errors.jenis_qurban?.message}
              options={[
                { value: 'sapi', label: 'Sapi (7 Orang)' },
                { value: 'kambing', label: 'Kambing (1 Orang)' },
              ]}
            />
          )}
        />

        <Input
          type="number"
          label="Maksimal Anggota"
          {...register('maksimal_anggota')}
          error={errors.maksimal_anggota?.message}
        />
      </div>

      {/* Target Kelompok & Target per 1 Anggota */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Target Dana Kelompok &amp; 1 Anggota</span>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(targetPerAnggota)} / Anggota
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            label="Total Target Kelompok (Rp)"
            {...register('target_dana')}
            error={errors.target_dana?.message}
          />
          <div>
            <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">
              Target 1 Anggota (Rp)
            </label>
            <input
              type="number"
              value={targetPerAnggota || ''}
              onChange={(e) => handleSetTargetPerAnggota(e.target.value)}
              placeholder="Misal: 4000000"
              className="h-11 w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3.5 text-sm font-bold text-emerald-700 dark:text-emerald-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-1 space-y-1.5">
          <span className="text-[11px] font-semibold text-ink-muted dark:text-ink-muted-dark flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            Pilihan Cepat Target:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setValue('target_dana', p.total, { shouldValidate: true })}
                className="rounded-lg border border-emerald-600/30 bg-white dark:bg-bg-dark px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label="Tahun Pelaksanaan"
          {...register('tahun')}
          error={errors.tahun?.message}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              label="Status"
              value={field.value ? 'aktif' : 'nonaktif'}
              onChange={(e) => field.onChange(e.target.value === 'aktif')}
              options={[
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Nonaktif' },
              ]}
            />
          )}
        />
      </div>

      {initialData && (
        <div
          onClick={() => setSyncMembersTarget(!syncMembersTarget)}
          className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 flex items-center gap-2.5 text-xs text-ink dark:text-ink-dark cursor-pointer select-none"
        >
          {syncMembersTarget ? (
            <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <Square className="h-4 w-4 text-ink-muted shrink-0" />
          )}
          <span>
            Perbarui juga target tabungan seluruh anggota di kelompok ini menjadi{' '}
            <strong>{formatCurrency(targetPerAnggota)} / anggota</strong>
          </span>
        </div>
      )}

      <div className="pt-4 flex justify-end gap-3 border-t border-border dark:border-border-dark">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-xl transition-colors cursor-pointer"
          disabled={isSubmitting}
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-tl from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Simpan Kelompok
        </button>
      </div>
    </form>
  )
}
