import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '../api/supabaseClient'
import { auditRepository } from '../repositories/auditRepository'

/**
 * Hook utama Activity Center — memuat daftar aktivitas yang difilter dan
 * berlangganan WebSocket Supabase Realtime secara live.
 */
export function useActivityLogs(filters = {}) {
  const queryClient = useQueryClient()
  const {
    page = 1,
    limit = 20,
    category = 'semua',
    search = '',
    startDate,
    endDate,
  } = filters

  // ---- Query Daftar Aktivitas ----
  const queryInfo = useQuery({
    queryKey: ['activity-logs', page, limit, category, search, startDate, endDate],
    queryFn: () =>
      auditRepository.getLogs({
        page,
        limit,
        category,
        search,
        startDate,
        endDate,
      }),
    staleTime: 15 * 1000,
  })

  // ---- Realtime WebSocket Subscription ----
  useEffect(() => {
    const channel = supabase
      .channel('activity-center-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          // Invalidate dan muat ulang cache secara live
          queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
          queryClient.invalidateQueries({ queryKey: ['activity-stats'] })

          // Tampilkan notifikasi toast realtime
          const newAction = payload.new?.action || 'Aktivitas Baru'
          toast(`⚡ Aktivitas Live: ${newAction}`, {
            icon: '⚡',
            position: 'bottom-right',
            duration: 4000,
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return queryInfo
}

/**
 * Hook ringkasan statistik Activity Center.
 */
export function useActivityStats() {
  return useQuery({
    queryKey: ['activity-stats'],
    queryFn: () => auditRepository.getStats(),
    staleTime: 30 * 1000,
  })
}
