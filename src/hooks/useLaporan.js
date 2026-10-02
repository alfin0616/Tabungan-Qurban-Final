import { useQuery } from '@tanstack/react-query'
import { getLaporanData, getInstansiList, getKelompokByInstansi } from '../repositories/laporanRepository'

/**
 * Hook laporan dengan filter lengkap.
 */
export function useLaporan(filters = {}) {
  const {
    periode = 'bulanan',
    reference,
    tanggalMulai,
    tanggalAkhir,
    instansiId,
    kelompokId,
    jenisTransaksi,
    metodePembayaran,
    statusAnggota,
    search,
  } = filters

  return useQuery({
    queryKey: [
      'laporan',
      periode,
      reference?.toDateString?.(),
      tanggalMulai,
      tanggalAkhir,
      instansiId,
      kelompokId,
      jenisTransaksi,
      metodePembayaran,
      statusAnggota,
      search,
    ],
    queryFn: () =>
      getLaporanData({
        periode,
        reference,
        tanggalMulai,
        tanggalAkhir,
        instansiId,
        kelompokId,
        jenisTransaksi,
        metodePembayaran,
        statusAnggota,
        search,
      }),
  })
}

/**
 * Hook daftar instansi (untuk dropdown filter SuperAdmin).
 */
export function useInstansiList() {
  return useQuery({
    queryKey: ['instansi-list'],
    queryFn: getInstansiList,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook daftar kelompok berdasarkan instansi (dependent query).
 */
export function useKelompokByInstansi(instansiId) {
  return useQuery({
    queryKey: ['kelompok-by-instansi', instansiId],
    queryFn: () => getKelompokByInstansi(instansiId),
    enabled: !!instansiId,
    staleTime: 5 * 60 * 1000,
  })
}
