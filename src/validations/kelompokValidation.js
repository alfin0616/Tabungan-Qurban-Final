import { z } from 'zod'

export const kelompokSchema = z.object({
  instansi_id: z.string().min(1, 'Masjid/Instansi wajib dipilih'),
  nama_kelompok: z.string().min(3, 'Nama kelompok minimal 3 karakter'),
  jenis_qurban: z.enum(['sapi', 'kambing'], { errorMap: () => ({ message: 'Pilih jenis qurban' }) }),
  target_dana: z.coerce.number().min(1000, 'Target dana minimal Rp 1.000'),
  maksimal_anggota: z.coerce.number().min(1, 'Maksimal anggota minimal 1'),
  tahun: z.coerce.number().min(2020, 'Tahun tidak valid'),
  status: z.boolean().default(true),
})
