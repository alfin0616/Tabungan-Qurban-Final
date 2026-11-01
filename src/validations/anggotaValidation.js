import { z } from 'zod'

export const anggotaSchema = z.object({
  kelompok_id: z.string().min(1, 'Wajib memilih Kelompok Qurban'),
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  no_hp: z
    .string()
    .min(9, 'Nomor HP tidak valid')
    .regex(/^[0-9+\s-]+$/, 'Nomor HP hanya boleh angka'),
  jenis_kelamin: z.enum(['L', 'P'], { errorMap: () => ({ message: 'Pilih jenis kelamin' }) }),
  tanggal_bergabung: z.string().min(1, 'Tanggal bergabung wajib diisi'),
  periode_setoran: z.enum(['bulanan', 'mingguan']).default('bulanan'),
  lama_tabungan: z.coerce
    .number()
    .min(1, 'Minimal 1 bulan')
    .max(120, 'Maksimal 120 bulan')
    .default(12),
  status: z.boolean().default(true),
  foto: z.string().optional().nullable(),
})
