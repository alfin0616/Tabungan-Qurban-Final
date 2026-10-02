import { supabase } from '../api/supabaseClient'
import { auditRepository } from './auditRepository'

export const GRAFIK_NASIONAL_MULAI = '2026-07-01'
export const GRAFIK_NASIONAL_AKHIR = '2027-04-01'

/**
 * Agregasi statistik nasional lintas semua instansi.
 * Hanya bisa dipanggil oleh superadmin (dijaga di level RPC).
 */
export async function getStatistikNasional() {
  const { data, error } = await supabase.rpc('get_statistik_nasional')
  if (error) throw error
  return data
}

/**
 * Grafik setoran nasional (semua instansi) per bulan.
 * Default: Juli 2026 – April 2027.
 */
export async function getGrafikSetoranNasional(
  pBulanMulai = GRAFIK_NASIONAL_MULAI,
  pBulanAkhir = GRAFIK_NASIONAL_AKHIR,
) {
  const { data, error } = await supabase.rpc('get_grafik_setoran_nasional', {
    p_bulan_mulai: pBulanMulai,
    p_bulan_akhir: pBulanAkhir,
  })
  if (error) throw error
  return data ?? []
}

/**
 * Top N instansi berdasarkan progress % (saldo / target).
 */
export async function getTopInstansi(limit = 5) {
  const { data, error } = await supabase.rpc('get_top_instansi', { p_limit: limit })
  if (error) throw error
  return data ?? []
}

/**
 * Top N kelompok berdasarkan progress % (saldo / target).
 */
export async function getTopKelompok(limit = 5) {
  const { data, error } = await supabase.rpc('get_top_kelompok', { p_limit: limit })
  if (error) throw error
  return data ?? []
}

/**
 * 10 transaksi terbaru lintas semua instansi.
 */
export async function getTransaksiTerbaruNasional(limit = 10) {
  const { data, error } = await supabase.rpc('get_transaksi_terbaru_nasional', {
    p_limit: limit,
  })
  if (error) throw error
  return data ?? []
}

/**
 * Perbandingan saldo & target per instansi untuk bar chart.
 */
export async function getGrafikPerInstansi() {
  const { data, error } = await supabase.rpc('get_grafik_per_instansi')
  if (error) throw error
  return data ?? []
}

/**
 * Grafik setoran harian (30 hari terakhir).
 */
export async function getGrafikSetoranHarian() {
  const { data, error } = await supabase.rpc('get_grafik_setoran_harian')
  if (error) throw error
  return data ?? []
}

/**
 * Grafik setoran tahunan.
 */
export async function getGrafikSetoranTahunan() {
  const { data, error } = await supabase.rpc('get_grafik_setoran_tahunan')
  if (error) throw error
  return data ?? []
}

/**
 * Jamaah teraktif.
 */
export async function getJamaahTeraktif(limit = 10) {
  const { data, error } = await supabase.rpc('get_jamaah_teraktif', { p_limit: limit })
  if (error) throw error
  return data ?? []
}

/**
 * Mengubah role pengguna (admin / superadmin / jamaah)
 */
export async function updateUserRole(userId, newRole) {
  const { data, error } = await supabase
    .from('admin_profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  auditRepository.log('ROLE_CHANGE', `Mengubah role user ID ${userId} menjadi ${newRole}`)
  return data
}

