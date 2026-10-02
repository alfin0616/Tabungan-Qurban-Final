import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTabunganList,
  getTabunganByAnggota,
  updateTargetTabungan,
  updateStatusTabungan,
} from '../repositories/tabunganRepository'

export function useTabunganList() {
  return useQuery({ queryKey: ['tabungan'], queryFn: getTabunganList })
}

export function useTabunganByAnggota(anggotaId) {
  return useQuery({
    queryKey: ['tabungan', 'anggota', anggotaId],
    queryFn: () => getTabunganByAnggota(anggotaId),
    enabled: !!anggotaId,
  })
}

export function useUpdateTargetTabungan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, target }) => updateTargetTabungan(id, target),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tabungan'] }),
  })
}

export function useUpdateStatusTabungan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => updateStatusTabungan(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tabungan'] }),
  })
}
