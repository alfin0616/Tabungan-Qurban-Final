import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, Sparkles } from 'lucide-react'
import { setoranSchema } from '../../validations/transaksiValidation'
import { useAnggotaSelect } from '../../hooks/useAnggota'
import { uploadBuktiTransaksi } from '../../repositories/transaksiRepository'
import { formatCurrency, calculateSkemaTabungan } from '../../utils/formatCurrency'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import BuktiFotoUpload from './BuktiFotoUpload'

export default function SetoranForm({ onSubmit, defaultAnggotaId, loading }) {
  const { data: anggotaList, isLoading: loadingAnggota } = useAnggotaSelect()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(setoranSchema),
    defaultValues: {
      tanggal: new Date().toISOString().slice(0, 10),
      anggota_id: defaultAnggotaId || '',
      nominal: '',
      metode_pembayaran: 'tunai',
      keterangan: '',
      bukti: null,
    },
  })

  const selectedAnggotaId = watch('anggota_id')

  const selectedSkema = useMemo(() => {
    const found = (anggotaList ?? []).find((a) => a.id === selectedAnggotaId)
    if (!found) return null
    const rawTb = Array.isArray(found.tabungan) ? found.tabungan[0] : found.tabungan
    const target = Number(rawTb?.target || 3000000)
    const saldo = Number(rawTb?.saldo || 0)
    return {
      anggota: found,
      ...calculateSkemaTabungan({
        target,
        saldo,
        periode: found.periode_setoran || 'bulanan',
        lamaBulan: found.lama_tabungan || 12,
      }),
    }
  }, [anggotaList, selectedAnggotaId])

  if (loadingAnggota) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Tanggal"
        type="date"
        required
        error={errors.tanggal?.message}
        {...register('tanggal')}
      />

      <Controller
        control={control}
        name="anggota_id"
        render={({ field }) => (
          <Select
            label="Anggota"
            required
            placeholder="Pilih anggota"
            error={errors.anggota_id?.message}
            options={(anggotaList ?? []).map((a) => ({
              value: a.id,
              label: `${a.nama} — ${a.kode_anggota} (${(a.periode_setoran || 'bulanan') === 'mingguan' ? 'Mingguan' : 'Bulanan'} • ${a.lama_tabungan || 12} Bln)`,
            }))}
            {...field}
          />
        )}
      />

      {selectedSkema && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
              <CalendarClock className="h-4 w-4 text-emerald-600" />
              Skema {selectedSkema.anggota.nama}:{' '}
              <span className="uppercase">{selectedSkema.periode}</span> ({selectedSkema.lamaBulan} Bulan)
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              Sisa Target: {formatCurrency(selectedSkema.sisaTarget)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-ink-muted dark:text-ink-muted-dark flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Isi Cepat Nominal:
            </span>
            <button
              type="button"
              onClick={() => {
                setValue('nominal', selectedSkema.nominalPerPeriode, { shouldValidate: true })
                setValue(
                  'keterangan',
                  `Setoran ${selectedSkema.periode} rutin (1x ${selectedSkema.labelPeriode})`,
                )
              }}
              className="rounded-lg border border-emerald-600/30 bg-white dark:bg-bg-dark px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
            >
              1x {selectedSkema.labelPeriode} ({formatCurrency(selectedSkema.nominalPerPeriode)})
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('nominal', selectedSkema.nominalPerPeriode * 2, { shouldValidate: true })
                setValue(
                  'keterangan',
                  `Rapel setoran 2x ${selectedSkema.labelPeriode} (Penanganan telat bayar)`,
                )
              }}
              className="rounded-lg border border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors"
            >
              Rapel 2x ({formatCurrency(selectedSkema.nominalPerPeriode * 2)})
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('nominal', selectedSkema.nominalPerPeriode * 3, { shouldValidate: true })
                setValue(
                  'keterangan',
                  `Rapel setoran 3x ${selectedSkema.labelPeriode} (Telat 2 ${selectedSkema.labelPeriode} + 1 ${selectedSkema.labelPeriode} berjalan)`,
                )
              }}
              className="rounded-lg border border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors"
            >
              Rapel 3x / Telat 2 Bln ({formatCurrency(selectedSkema.nominalPerPeriode * 3)})
            </button>
            {selectedSkema.periode === 'bulanan' ? (
              <button
                type="button"
                onClick={() => {
                  setValue('nominal', selectedSkema.nominalMingguan, { shouldValidate: true })
                  setValue('keterangan', 'Setoran cicilan mingguan')
                }}
                className="rounded-lg border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-2.5 py-1 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark hover:border-emerald-500"
              >
                Versi Mingguan ({formatCurrency(selectedSkema.nominalMingguan)})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setValue('nominal', selectedSkema.nominalBulanan, { shouldValidate: true })
                  setValue('keterangan', 'Setoran penuh 1 bulan (4 minggu)')
                }}
                className="rounded-lg border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-2.5 py-1 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark hover:border-emerald-500"
              >
                Versi 1 Bulan ({formatCurrency(selectedSkema.nominalBulanan)})
              </button>
            )}
          </div>
        </div>
      )}

      <Input
        label="Nominal (Rp)"
        type="number"
        min={0}
        required
        error={errors.nominal?.message}
        {...register('nominal')}
      />

      <Controller
        control={control}
        name="metode_pembayaran"
        render={({ field }) => (
          <Select
            label="Metode Pembayaran"
            required
            error={errors.metode_pembayaran?.message}
            options={[
              { value: 'tunai', label: 'Tunai' },
              { value: 'transfer', label: 'Transfer Bank' },
              { value: 'qris', label: 'QRIS' },
            ]}
            {...field}
          />
        )}
      />

      <Input
        label="Keterangan"
        placeholder="Opsional"
        error={errors.keterangan?.message}
        {...register('keterangan')}
      />

      <BuktiFotoUpload
        label="Bukti Transfer/QRIS (opsional)"
        value={watch('bukti')}
        onChange={(url) => setValue('bukti', url)}
        uploadFn={uploadBuktiTransaksi}
      />

      <Button type="submit" className="w-full" loading={isSubmitting || loading}>
        Simpan Setoran
      </Button>
    </form>
  )
}
