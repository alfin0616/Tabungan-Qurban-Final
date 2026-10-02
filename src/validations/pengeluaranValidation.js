import { z } from 'zod'

export const pengeluaranSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  kategori: z.enum(
    ['listrik', 'air', 'kebersihan', 'atk', 'konsumsi', 'pemeliharaan', 'honor', 'lainnya'],
    { errorMap: () => ({ message: 'Pilih kategori pengeluaran' }) },
  ),
  nominal: z.coerce.number().min(1000, 'Nominal minimal Rp 1.000'),
  keterangan: z.string().min(3, 'Keterangan wajib diisi'),
  bukti: z.string().optional().nullable(),
})
