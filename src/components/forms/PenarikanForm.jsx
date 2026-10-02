import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { penarikanSchema } from '../../validations/transaksiValidation'
import { useAnggotaSelect } from '../../hooks/useAnggota'
import { uploadBuktiTransaksi } from '../../repositories/transaksiRepository'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import BuktiFotoUpload from './BuktiFotoUpload'

export default function PenarikanForm({ onSubmit, defaultAnggotaId, loading }) {
  const { data: anggotaList, isLoading: loadingAnggota } = useAnggotaSelect()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(penarikanSchema),
    defaultValues: {
      tanggal: new Date().toISOString().slice(0, 10),
      anggota_id: defaultAnggotaId || '',
      nominal: '',
      keterangan: '',
      bukti: null,
    },
  })

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
              label: `${a.nama} — ${a.kode_anggota}`,
            }))}
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
        placeholder="Contoh: Penarikan untuk pembelian hewan qurban"
        required
        error={errors.keterangan?.message}
        {...register('keterangan')}
      />

      <BuktiFotoUpload
        label="Bukti Serah Terima (opsional)"
        value={watch('bukti')}
        onChange={(url) => setValue('bukti', url)}
        uploadFn={uploadBuktiTransaksi}
      />

      <Button type="submit" variant="danger" className="w-full" loading={isSubmitting || loading}>
        Simpan Penarikan
      </Button>
    </form>
  )
}
