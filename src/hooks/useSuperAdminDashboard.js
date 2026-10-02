import { useQuery } from '@tanstack/react-query'
import {
  getStatistikNasional,
  getGrafikSetoranNasional,
  getTopInstansi,
  getTopKelompok,
  getTransaksiTerbaruNasional,
  getGrafikPerInstansi,
  getGrafikSetoranHarian,
  getGrafikSetoranTahunan,
  getJamaahTeraktif,
} from '../repositories/superAdminRepository'

/** Statistik agregat nasional (total instansi, kelompok, jamaah, saldo, target, transaksi) */
export function useStatistikNasional() {
  return useQuery({
    queryKey: ['superadmin', 'statistik-nasional'],
    queryFn: getStatistikNasional,
  })
}

/** Grafik setoran nasional per bulan (Juli 2026 – April 2027) */
export function useGrafikSetoranNasional() {
  return useQuery({
    queryKey: ['superadmin', 'grafik-nasional'],
    queryFn: getGrafikSetoranNasional,
  })
}

/** Top N instansi berdasarkan progress % */
export function useTopInstansi(limit = 10) {
  return useQuery({
    queryKey: ['superadmin', 'top-instansi', limit],
    queryFn: () => getTopInstansi(limit),
  })
}

/** Top N kelompok berdasarkan progress % */
export function useTopKelompok(limit = 10) {
  return useQuery({
    queryKey: ['superadmin', 'top-kelompok', limit],
    queryFn: () => getTopKelompok(limit),
  })
}

/** 10 transaksi terbaru lintas semua instansi */
export function useTransaksiTerbaruNasional(limit = 10) {
  return useQuery({
    queryKey: ['superadmin', 'transaksi-terbaru', limit],
    queryFn: () => getTransaksiTerbaruNasional(limit),
  })
}

/** Perbandingan saldo & target per instansi */
export function useGrafikPerInstansi() {
  return useQuery({
    queryKey: ['superadmin', 'grafik-per-instansi'],
    queryFn: getGrafikPerInstansi,
  })
}

/** Grafik setoran harian (30 hari terakhir) */
export function useGrafikSetoranHarian() {
  return useQuery({
    queryKey: ['superadmin', 'grafik-harian'],
    queryFn: getGrafikSetoranHarian,
  })
}

/** Grafik setoran tahunan */
export function useGrafikSetoranTahunan() {
  return useQuery({
    queryKey: ['superadmin', 'grafik-tahunan'],
    queryFn: getGrafikSetoranTahunan,
  })
}

/** Jamaah teraktif */
export function useJamaahTeraktif(limit = 10) {
  return useQuery({
    queryKey: ['superadmin', 'jamaah-teraktif', limit],
    queryFn: () => getJamaahTeraktif(limit),
  })
}
