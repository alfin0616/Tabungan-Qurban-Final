import { supabase } from '../api/supabaseClient'

// Periode tetap untuk grafik setoran dashboard: musim tabungan qurban
// berjalan Juli 2026 s.d. April 2027.
export const GRAFIK_PERIODE_MULAI = '2026-07-01'
export const GRAFIK_PERIODE_AKHIR = '2027-04-01'

export async function getDashboardSummary() {
  const [{ count: totalAnggota }, { data: tabunganList }, { data: transaksiBulanIni }, { data: pengeluaranBulanIni }, { data: totalKas }] =
    await Promise.all([
      supabase.from('anggota').select('*', { count: 'exact', head: true }),
      supabase.from('tabungan').select('saldo, target'),
      supabase
        .from('transaksi')
        .select('nominal, jenis, tanggal')
        .gte('tanggal', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
      supabase
        .from('pengeluaran')
        .select('nominal')
        .gte('tanggal', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
      supabase.rpc('total_kas_masjid'),
    ])

  const targetQurban = (tabunganList ?? []).reduce((sum, t) => sum + Number(t.target || 0), 0)

  const setoranBulanIni = (transaksiBulanIni ?? [])
    .filter((t) => t.jenis === 'setoran')
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0)

  const totalPengeluaranBulanIni = (pengeluaranBulanIni ?? []).reduce((sum, p) => sum + Number(p.nominal || 0), 0)

  return {
    totalAnggota: totalAnggota ?? 0,
    // Total saldo = total tabungan seluruh anggota DIKURANGI total
    // pengeluaran operasional yang pernah dicatat (lihat RPC total_kas_masjid)
    totalSaldo: Number(totalKas ?? 0),
    setoranBulanIni,
    jumlahTransaksi: (transaksiBulanIni ?? []).length,
    targetQurban,
    totalPengeluaranBulanIni,
  }
}

export async function getGrafikSetoran() {
  const { data, error } = await supabase.rpc('grafik_setoran_periode', {
    p_bulan_mulai: GRAFIK_PERIODE_MULAI,
    p_bulan_akhir: GRAFIK_PERIODE_AKHIR,
  })
  if (error) throw error
  return data
}

export async function getTotalKasMasjid() {
  const { data, error } = await supabase.rpc('total_kas_masjid')
  if (error) throw error
  return Number(data ?? 0)
}
