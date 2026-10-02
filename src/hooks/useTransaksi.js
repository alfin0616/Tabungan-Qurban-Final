import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSetoran,
  createPenarikan,
  deleteTransaksi,
  getRiwayatTransaksi,
  getAnggotaBelumSetorBulanIni,
} from '../repositories/transaksiRepository'

import { auditRepository } from '../repositories/auditRepository'

export function useRiwayatTransaksi(filters) {
  return useQuery({
    queryKey: ['transaksi', 'riwayat', filters],
    queryFn: () => getRiwayatTransaksi(filters),
  })
}

export function useAnggotaBelumSetor() {
  return useQuery({
    queryKey: ['transaksi', 'belum-setor'],
    queryFn: getAnggotaBelumSetorBulanIni,
  })
}

export function useCreateSetoran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSetoran,
    onSuccess: (_, variables) => {
      auditRepository.log('SETORAN', `Mencatat setoran sebesar ${variables.nominal} untuk anggota ID: ${variables.anggota_id}`)
      queryClient.invalidateQueries({ queryKey: ['transaksi'] })
      queryClient.invalidateQueries({ queryKey: ['tabungan'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCreatePenarikan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPenarikan,
    onSuccess: (_, variables) => {
      auditRepository.log('PENARIKAN', `Mencatat penarikan sebesar ${variables.nominal} untuk anggota ID: ${variables.anggota_id}`)
      queryClient.invalidateQueries({ queryKey: ['transaksi'] })
      queryClient.invalidateQueries({ queryKey: ['tabungan'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTransaksi() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTransaksi,
    onSuccess: (_, id) => {
      auditRepository.log('HAPUS_TRANSAKSI', `Menghapus transaksi dengan ID: ${id}`)
      queryClient.invalidateQueries({ queryKey: ['transaksi'] })
      queryClient.invalidateQueries({ queryKey: ['tabungan'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
