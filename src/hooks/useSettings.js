import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../repositories/settingsRepository'
import { auditRepository } from '../repositories/auditRepository'

export function useSettings() {
  const query = useQuery({ queryKey: ['settings'], queryFn: getSettings })

  useEffect(() => {
    if (query.data) {
      const settings = query.data

      // 1. Apply primary & secondary colors dynamically to CSS root variables
      if (settings.primary_color) {
        document.documentElement.style.setProperty('--color-emerald-600', settings.primary_color)
        document.documentElement.style.setProperty('--color-emerald-700', settings.primary_color)
        document.documentElement.style.setProperty('--primary-color', settings.primary_color)
      }
      if (settings.secondary_color) {
        document.documentElement.style.setProperty('--color-emerald-500', settings.secondary_color)
        document.documentElement.style.setProperty('--secondary-color', settings.secondary_color)
      }

      // 2. Apply Favicon dynamically
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
      // Invalidate and update cache immediately for seamless real-time re-render
      queryClient.setQueryData(['settings'], (old) => ({ ...old, ...updatedData }))
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      auditRepository.log('SYSTEM_CHANGE', 'Memperbarui konfigurasi sistem & pengaturan aplikasi')
    },
  })
}
