import { useQuery } from '@tanstack/react-query'
import { aiInsightRepository } from '../repositories/aiInsightRepository'

export function useAiInsight({ instansiId = null, kelompokId = null } = {}) {
  return useQuery({
    queryKey: ['ai-insight', instansiId, kelompokId],
    queryFn: () => aiInsightRepository.getAiInsights({ instansiId, kelompokId }),
    staleTime: 1000 * 60 * 5, // 5 menit
  })
}
