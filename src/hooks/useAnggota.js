import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAnggotaList,
  getAnggotaById,
  getAllAnggotaForSelect,
  createAnggota,
  updateAnggota,
  deleteAnggota,
  importAnggotaFromExcel,
  claimAkunAnggota,
} from '../repositories/anggotaRepository'
import { auditRepository } from '../repositories/auditRepository'

export function useAnggotaList(filters) {
  return useQuery({
    queryKey: ['anggota', filters],
    queryFn: () => getAnggotaList(filters),
    placeholderData: (prev) => prev,
  })
}

export function useAnggotaDetail(id) {
  return useQuery({
    queryKey: ['anggota', 'detail', id],
    queryFn: () => getAnggotaById(id),
    enabled: !!id,
  })
}

export function useAnggotaSelect() {
  return useQuery({
    queryKey: ['anggota', 'select'],
    queryFn: getAllAnggotaForSelect,
    staleTime: 1000 * 60,
  })
}

export function useCreateAnggota() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAnggota,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['anggota'] })
      auditRepository.log('TAMBAH_ANGGOTA', `Menambahkan anggota baru: ${variables.nama || ''}`)
    },
  })
}

export function useUpdateAnggota() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateAnggota(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['anggota'] })
      auditRepository.log('EDIT_ANGGOTA', `Mengubah data anggota ID: ${variables.id}`)
    },
  })
}

export function useDeleteAnggota() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAnggota,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['anggota'] })
      auditRepository.log('DELETE_ANGGOTA', `Menghapus anggota ID: ${id}`)
    },
  })
}

export function useImportAnggota() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: importAnggotaFromExcel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anggota'] })
      queryClient.invalidateQueries({ queryKey: ['tabungan'] })
      auditRepository.log('IMPORT_ANGGOTA', 'Mengimpor data anggota dari file Excel')
    },
  })
}

export function useClaimAkunAnggota() {
  return useMutation({
    mutationFn: claimAkunAnggota,
    onSuccess: () => {
      auditRepository.log('CLAIM_AKUN', 'User mengklaim dan menghubungkan akun jamaah')
    },
  })
}
