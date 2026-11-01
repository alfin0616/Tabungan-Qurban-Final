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
    mutationFn: ({ id, target, anggota_id, periode_setoran, lama_tabungan }) =>
      updateTargetTabungan(id, target, { anggota_id, periode_setoran, lama_tabungan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabungan'] })
      queryClient.invalidateQueries({ queryKey: ['anggota'] })
    },
  })
}

export function useUpdateStatusTabungan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => updateStatusTabungan(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tabungan'] }),
  })
}
