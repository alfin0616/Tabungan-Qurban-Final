import { z } from 'zod'

export const settingsSchema = z.object({
  nama_instansi: z.string().min(3, 'Nama masjid/instansi wajib diisi'),
  alamat: z.string().min(5, 'Alamat wajib diisi'),
  logo: z.string().optional().nullable(),
  telepon: z.string().min(5, 'Kontak wajib diisi'),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  nama_bank: z.string().min(2, 'Nama bank wajib diisi'),
  nomor_rekening: z.string().min(3, 'Nomor rekening wajib diisi'),
  atas_nama_rekening: z.string().min(2, 'Atas nama rekening wajib diisi'),
})
