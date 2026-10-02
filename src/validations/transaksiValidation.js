import { z } from 'zod'

export const setoranSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  anggota_id: z.string().min(1, 'Pilih anggota'),
  nominal: z.coerce.number().min(1000, 'Nominal minimal Rp 1.000'),
  metode_pembayaran: z.enum(['tunai', 'transfer', 'qris'], {
    errorMap: () => ({ message: 'Pilih metode pembayaran' }),
  }),
  keterangan: z.string().optional(),
  bukti: z.string().optional().nullable(),
})

export const penarikanSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  anggota_id: z.string().min(1, 'Pilih anggota'),
  nominal: z.coerce.number().min(1000, 'Nominal minimal Rp 1.000'),
  keterangan: z.string().min(3, 'Keterangan wajib diisi'),
  bukti: z.string().optional().nullable(),
})
