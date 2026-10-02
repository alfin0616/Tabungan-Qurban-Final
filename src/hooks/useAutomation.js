import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { automationRepository } from '../repositories/automationRepository'

export function useMaintenanceStatus() {
  return useQuery({
    queryKey: ['maintenance-status'],
    queryFn: automationRepository.getMaintenanceStatus,
    staleTime: 1000 * 30, // 30 detik
  })
}

export function useRunScheduledTasks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: automationRepository.runScheduledTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-logs'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}

export function useCleanupOldLogs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (retentionDays) => automationRepository.cleanupOldLogs(retentionDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-logs'] })
    },
  })
}

export function useTriggerMonthlyReminders() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: automationRepository.triggerMonthlyReminders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useToggleMaintenanceMode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ enabled, message }) => automationRepository.toggleMaintenanceMode(enabled, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-status'] })
    },
  })
}
