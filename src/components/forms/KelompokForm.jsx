import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { kelompokSchema } from '../../validations/kelompokValidation'
import { useInstansiSelect } from '../../hooks/useInstansi'
import Input from '../ui/Input'
import Select from '../ui/Select'

export default function KelompokForm({ initialData, onSubmit, onCancel, isSubmitting }) {
  const { data: instansiList, isLoading: loadingInstansi } = useInstansiSelect()
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(kelompokSchema),
    defaultValues: initialData || {
      instansi_id: '',
      nama_kelompok: '',
      jenis_qurban: 'sapi',
      target_dana: 21000000,
      maksimal_anggota: 7,
      tahun: new Date().getFullYear(),
      status: true,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                field.onChange(e.target.value)
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

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label="Target Dana (Rp)"
          {...register('target_dana')}
          error={errors.target_dana?.message}
        />
        <Input
          type="number"
          label="Tahun Pelaksanaan"
          {...register('tahun')}
          error={errors.tahun?.message}
        />
      </div>

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

      <div className="pt-4 flex justify-end gap-3 border-t border-emerald-100 dark:border-emerald-800/30">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-xl transition-colors"
          disabled={isSubmitting}
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
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
