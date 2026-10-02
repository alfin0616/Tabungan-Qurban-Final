import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPengeluaranList,
  createPengeluaran,
  updatePengeluaran,
  deletePengeluaran,
  getPengeluaranBulanIni,
} from '../repositories/pengeluaranRepository'
import { auditRepository } from '../repositories/auditRepository'

export function usePengeluaranList(filters) {
  return useQuery({
    queryKey: ['pengeluaran', filters],
    queryFn: () => getPengeluaranList(filters),
  })
}

export function usePengeluaranBulanIni() {
  return useQuery({
    queryKey: ['pengeluaran', 'bulan-ini'],
    queryFn: getPengeluaranBulanIni,
  })
}

export function useCreatePengeluaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPengeluaran,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pengeluaran'] })
      auditRepository.log('TAMBAH_PENGELUARAN', `Mencatat pengeluaran operasional sebesar ${variables.nominal || 0}`)
    },
  })
}

export function useUpdatePengeluaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updatePengeluaran(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pengeluaran'] })
      auditRepository.log('EDIT_PENGELUARAN', `Mengubah data pengeluaran ID: ${variables.id}`)
    },
  })
}

export function useDeletePengeluaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePengeluaran,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['pengeluaran'] })
      auditRepository.log('DELETE_PENGELUARAN', `Menghapus data pengeluaran ID: ${id}`)
    },
  })
}
