import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as instansiRepo from '../repositories/instansiRepository'

const KEYS = {
  all: ['instansi'],
  list: (params) => [...KEYS.all, 'list', params],
  select: () => [...KEYS.all, 'select'],
}

export function useInstansiList(params) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => instansiRepo.getInstansiList(params),
    keepPreviousData: true,
  })
}

export function useInstansiSelect() {
  return useQuery({
    queryKey: KEYS.select(),
    queryFn: () => instansiRepo.getAllInstansiForSelect(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateInstansi() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: instansiRepo.createInstansi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export function useUpdateInstansi() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => instansiRepo.updateInstansi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export function useDeleteInstansi() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: instansiRepo.deleteInstansi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}
