import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(3, 'Email atau Nomor Telepon wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  rememberMe: z.boolean().optional(),
})

export const registerJamaahSchema = z
  .object({
    fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
    phone: z
      .string()
      .min(9, 'Nomor HP/WA minimal 9 angka')
      .regex(/^[0-9+\s-]+$/, 'Nomor HP hanya boleh berisi angka'),
    instansiId: z.string().min(1, 'Wajib memilih Masjid / Instansi'),
    kelompokId: z.string().min(1, 'Wajib memilih Kelompok Qurban'),
    email: z
      .string()
      .optional()
      .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: 'Format email tidak valid',
      }),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword'],
  })

export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
})

export const newPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword'],
  })
