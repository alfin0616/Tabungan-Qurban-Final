import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { performGlobalSearch } from '../repositories/searchRepository'

export function useSmartSearch(initialQuery = '', category = 'all', page = 1, limit = 10) {
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(initialQuery)
    }, 250)

    return () => clearTimeout(handler)
  }, [initialQuery])

  return useQuery({
    queryKey: ['smart-search', debouncedQuery, category, page, limit],
    queryFn: () => performGlobalSearch({ query: debouncedQuery, category, page, limit }),
    enabled: Boolean(debouncedQuery && debouncedQuery.trim().length >= 1),
    staleTime: 1000 * 30, // 30 detik
  })
}
