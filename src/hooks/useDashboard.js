import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getGrafikSetoran, getTotalKasMasjid } from '../repositories/dashboardRepository'

export function useDashboardSummary() {
  return useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary })
}

export function useGrafikSetoran(periode = 'bulanan') {
  return useQuery({
    queryKey: ['dashboard', 'grafik', periode],
    queryFn: () => getGrafikSetoran(periode),
  })
}

export function useTotalKasMasjid() {
  return useQuery({ queryKey: ['dashboard', 'total-kas'], queryFn: getTotalKasMasjid })
}
