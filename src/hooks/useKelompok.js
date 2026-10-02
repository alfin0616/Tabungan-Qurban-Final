import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as kelompokRepo from '../repositories/kelompokRepository'

const KEYS = {
  all: ['kelompok'],
  list: (params) => [...KEYS.all, 'list', params],
  select: (instansiId) => [...KEYS.all, 'select', instansiId],
}

export function useKelompokList(params) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => kelompokRepo.getKelompokList(params),
    keepPreviousData: true,
  })
}

export function useKelompokSelect(instansiId) {
  return useQuery({
    queryKey: KEYS.select(instansiId),
    queryFn: () => kelompokRepo.getAllKelompokForSelect(instansiId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateKelompok() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: kelompokRepo.createKelompok,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export function useUpdateKelompok() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => kelompokRepo.updateKelompok(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export function useDeleteKelompok() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: kelompokRepo.deleteKelompok,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}
