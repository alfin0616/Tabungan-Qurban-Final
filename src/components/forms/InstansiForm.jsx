import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard } from 'lucide-react'
import { instansiSchema } from '../../validations/instansiValidation'
import Input from '../ui/Input'
import Select from '../ui/Select'

export default function InstansiForm({ initialData, onSubmit, onCancel, isSubmitting }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(instansiSchema),
    defaultValues: initialData
      ? {
          nama_instansi: initialData.nama_instansi || '',
          alamat: initialData.alamat || '',
          telepon: initialData.telepon || '',
          email: initialData.email || '',
          nama_bank: initialData.nama_bank || '',
          nomor_rekening: initialData.nomor_rekening || initialData.rekening || '',
          atas_nama_rekening: initialData.atas_nama_rekening || '',
          tahun_qurban_aktif: initialData.tahun_qurban_aktif || new Date().getFullYear(),
          status: initialData.status ?? true,
          is_default: initialData.is_default ?? false,
        }
      : {
          nama_instansi: '',
          alamat: '',
          telepon: '',
          email: '',
          nama_bank: '',
          nomor_rekening: '',
          atas_nama_rekening: '',
          tahun_qurban_aktif: new Date().getFullYear(),
          status: true,
          is_default: false,
        },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nama Instansi / Masjid"
        {...register('nama_instansi')}
        error={errors.nama_instansi?.message}
        placeholder="Misal: Masjid Al-Ikhlas"
      />

      <Input
        label="Alamat Lengkap"
        {...register('alamat')}
        error={errors.alamat?.message}
        placeholder="Alamat instansi"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="No Telepon"
          {...register('telepon')}
          error={errors.telepon?.message}
          placeholder="0812xxxx"
        />

        <Input
          label="Email (Opsional)"
          {...register('email')}
          error={errors.email?.message}
          placeholder="email@masjid.com"
        />
      </div>

      {/* Catatan Fleksibilitas Target: Ditentukan per Kelompok */}
      <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 space-y-1 text-xs">
        <p className="font-bold text-indigo-900 dark:text-indigo-300">
          Target Tabungan Qurban Bersifat Opsional di Tingkat Instansi
        </p>
        <p className="text-ink-muted dark:text-ink-muted-dark leading-relaxed">
          Target dana dan tabungan ditentukan secara spesifik dan fleksibel pada masing-masing <strong>Kelompok Qurban</strong> (Sapi 1/7 atau Kambing 1/1), bukan target kaku per instansi.
        </p>
      </div>

      {/* Seksi Rekening Bank Instansi */}
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
          <CreditCard className="h-4 w-4" />
          <span>Informasi Rekening Qurban Instansi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nama Bank"
            {...register('nama_bank')}
            error={errors.nama_bank?.message}
            placeholder="Misal: BSI / Bank Muamalat"
          />

          <Input
            label="Nomor Rekening"
            {...register('nomor_rekening')}
            error={errors.nomor_rekening?.message}
            placeholder="Misal: 7123456789"
          />
        </div>

        <Input
          label="Atas Nama Rekening"
          {...register('atas_nama_rekening')}
          error={errors.atas_nama_rekening?.message}
          placeholder="Misal: Panitia Qurban Masjid Al-Ikhlas"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label="Tahun Qurban Aktif"
          {...register('tahun_qurban_aktif')}
          error={errors.tahun_qurban_aktif?.message}
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

      <div className="pt-4 flex justify-end gap-3 border-t border-emerald-100 dark:border-emerald-800/30">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-xl transition-colors"
          disabled={isSubmitting}
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-tl from-emerald-800 to-emerald-600 hover:from-emerald-900 hover:to-emerald-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Simpan Instansi
        </button>
      </div>
    </form>
  )
}
