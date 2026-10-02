import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(3, 'Nama minimal 3 karakter'),
  avatar_url: z.string().optional().nullable(),
})
