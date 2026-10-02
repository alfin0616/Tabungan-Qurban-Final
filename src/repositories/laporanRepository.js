import { supabase } from '../api/supabaseClient'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns'

const RANGE_BUILDERS = {
  harian: (date) => [startOfDay(date), endOfDay(date)],
  mingguan: (date) => [startOfWeek(date, { weekStartsOn: 1 }), endOfWeek(date, { weekStartsOn: 1 })],
  bulanan: (date) => [startOfMonth(date), endOfMonth(date)],
  tahunan: (date) => [startOfYear(date), endOfYear(date)],
}

export function getRangeForPeriode(periode, reference = new Date()) {
  const builder = RANGE_BUILDERS[periode] || RANGE_BUILDERS.bulanan
  const [start, end] = builder(reference)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

/**
 * Ambil data laporan dengan filter lengkap.
 * @param {Object} params
 * @param {'harian'|'mingguan'|'bulanan'|'tahunan'} params.periode
 * @param {Date} params.reference
 * @param {string} [params.tanggalMulai] - Override start date (YYYY-MM-DD)
 * @param {string} [params.tanggalAkhir] - Override end date (YYYY-MM-DD)
 * @param {string} [params.instansiId] - Filter by instansi
 * @param {string} [params.kelompokId] - Filter by kelompok
 * @param {'semua'|'setoran'|'penarikan'} [params.jenisTransaksi]
 * @param {'semua'|'tunai'|'transfer'|'qris'} [params.metodePembayaran]
 * @param {'semua'|'aktif'|'nonaktif'} [params.statusAnggota]
 * @param {string} [params.search] - Cari nama anggota
 */
export async function getLaporanData({
  periode = 'bulanan',
  reference = new Date(),
  tanggalMulai,
  tanggalAkhir,
  instansiId,
  kelompokId,
  jenisTransaksi = 'semua',
  metodePembayaran = 'semua',
  statusAnggota = 'semua',
  search = '',
} = {}) {
  // Tentukan rentang tanggal: custom date range atau dari periode
  let start, end
  if (tanggalMulai && tanggalAkhir) {
    start = tanggalMulai
    end = tanggalAkhir
  } else {
    const range = getRangeForPeriode(periode, reference)
    start = range.start
    end = range.end
  }

  // ---- Query Transaksi ----
  let trxQuery = supabase
    .from('transaksi')
    .select('*, anggota:anggota_id (id, nama, kode_anggota, status)')
    .gte('tanggal', start)
    .lte('tanggal', end)
    .order('tanggal', { ascending: true })

  if (instansiId) trxQuery = trxQuery.eq('instansi_id', instansiId)
  if (kelompokId) trxQuery = trxQuery.eq('kelompok_id', kelompokId)
  if (jenisTransaksi !== 'semua') trxQuery = trxQuery.eq('jenis', jenisTransaksi)
  if (metodePembayaran !== 'semua') trxQuery = trxQuery.eq('metode_pembayaran', metodePembayaran)

  // ---- Query Pengeluaran ----
  let pglQuery = supabase
    .from('pengeluaran')
    .select('*')
    .gte('tanggal', start)
    .lte('tanggal', end)
    .order('tanggal', { ascending: true })

  if (instansiId) pglQuery = pglQuery.eq('instansi_id', instansiId)
  if (kelompokId) pglQuery = pglQuery.eq('kelompok_id', kelompokId)

  const [{ data: transaksi, error: errTransaksi }, { data: pengeluaran, error: errPengeluaran }] =
    await Promise.all([trxQuery, pglQuery])

  if (errTransaksi) throw errTransaksi
  if (errPengeluaran) throw errPengeluaran

  // ---- Filter sisi klien (status anggota & search) ----
  let filteredTransaksi = transaksi ?? []

  if (statusAnggota !== 'semua') {
    const isAktif = statusAnggota === 'aktif'
    filteredTransaksi = filteredTransaksi.filter((t) => t.anggota?.status === isAktif)
  }

  if (search) {
    const q = search.toLowerCase()
    filteredTransaksi = filteredTransaksi.filter(
      (t) =>
        t.anggota?.nama?.toLowerCase().includes(q) ||
        t.anggota?.kode_anggota?.toLowerCase().includes(q),
    )
  }

  // ---- Hitung summary ----
  const totalSetoran = filteredTransaksi
    .filter((t) => t.jenis === 'setoran')
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0)
  const totalPenarikan = filteredTransaksi
    .filter((t) => t.jenis === 'penarikan')
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0)
  const totalPengeluaran = (pengeluaran ?? []).reduce((sum, p) => sum + Number(p.nominal || 0), 0)

  return {
    range: { start, end },
    transaksi: filteredTransaksi,
    pengeluaran: pengeluaran ?? [],
    totalSetoran,
    totalPenarikan,
    totalPengeluaran,
    saldoBersih: totalSetoran - totalPenarikan - totalPengeluaran,
    totalTransaksi: filteredTransaksi.length,
  }
}

/**
 * Ambil daftar semua instansi (untuk filter dropdown SuperAdmin).
 */
export async function getInstansiList() {
  const { data, error } = await supabase
    .from('instansi')
    .select('id, nama_instansi, kode_instansi')
    .eq('status', true)
    .order('nama_instansi', { ascending: true })
  if (error) throw error
  return data ?? []
}

/**
 * Ambil daftar kelompok berdasarkan instansi (untuk filter dropdown dependent).
 */
export async function getKelompokByInstansi(instansiId) {
  let query = supabase
    .from('kelompok')
    .select('id, nama_kelompok, kode_kelompok, jenis_qurban')
    .eq('status', true)
    .order('nama_kelompok', { ascending: true })

  if (instansiId) {
    query = query.eq('instansi_id', instansiId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
