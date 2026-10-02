import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getGrafikSetoran, getTotalKasMasjid } from '../repositories/dashboardRepository'

export function useDashboardSummary() {
  return useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary })
}

export function useGrafikSetoran() {
  return useQuery({
    queryKey: ['dashboard', 'grafik'],
    queryFn: getGrafikSetoran,
  })
}

export function useTotalKasMasjid() {
  return useQuery({ queryKey: ['dashboard', 'total-kas'], queryFn: getTotalKasMasjid })
}
