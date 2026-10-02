import { z } from 'zod'

export const instansiSchema = z.object({
  nama_instansi: z.string().min(3, 'Nama instansi/masjid minimal 3 karakter'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter').optional().nullable().or(z.literal('')),
  telepon: z.string().optional().nullable().or(z.literal('')),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  tahun_qurban_aktif: z.coerce.number().min(2020, 'Tahun tidak valid'),
  status: z.boolean().default(true),
  is_default: z.boolean().default(false),
})
