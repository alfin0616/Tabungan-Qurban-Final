import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../repositories/settingsRepository'
import { auditRepository } from '../repositories/auditRepository'

export function useSettings() {
  const query = useQuery({ queryKey: ['settings'], queryFn: getSettings })

  useEffect(() => {
    // Pastikan palet warna Emerald utama selalu selaras dengan warna Sidebar (#065f46 / #047857 / #059669)
    // dan tidak ditimpa oleh warna hijau kekuningan lama dari database
    document.documentElement.style.removeProperty('--color-emerald-500')
    document.documentElement.style.removeProperty('--color-emerald-600')
    document.documentElement.style.removeProperty('--color-emerald-700')

    if (query.data) {
      const settings = query.data

      if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color)
      }
      if (settings.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', settings.secondary_color)
      }

      // Apply Favicon dynamically
      if (settings.favicon_url) {
        let link = document.querySelector("link[rel*='icon']")
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.head.appendChild(link)
        }
        link.href = settings.favicon_url
      }
    }
  }, [query.data])

  return query
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['settings'], (old) => ({ ...old, ...updatedData }))
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      auditRepository.log('SYSTEM_CHANGE', 'Memperbarui konfigurasi sistem & pengaturan aplikasi')
    },
  })
}
