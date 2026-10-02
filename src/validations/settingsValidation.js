import { z } from 'zod'

export const settingsSchema = z.object({
  nama_instansi: z.string().min(3, 'Nama masjid wajib diisi'),
  alamat: z.string().min(5, 'Alamat wajib diisi'),
  logo: z.string().optional().nullable(),
  target_qurban: z.coerce.number().min(0, 'Target tidak boleh negatif'),
  rekening: z.string().min(3, 'Nomor rekening wajib diisi'),
  telepon: z.string().min(5, 'Kontak wajib diisi'),
})
