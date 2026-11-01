import { supabase } from '../api/supabaseClient'

export async function getDashboardSummary() {
  const [
    { count: totalAnggota },
    { data: tabunganList },
    { data: transaksiBulanIni },
    { data: pengeluaranBulanIni },
    { data: totalKas },
  ] = await Promise.all([
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
    totalSaldo: Number(totalKas ?? 0),
    setoranBulanIni,
    jumlahTransaksi: (transaksiBulanIni ?? []).length,
    targetQurban,
    totalPengeluaranBulanIni,
  }
}

export async function getGrafikSetoran(periode = 'bulanan') {
  if (periode === 'mingguan') {
    return getGrafikSetoranMingguan(10)
  }

  // Periode bulanan berjalan (10 bulan: 5 bulan ke belakang s.d. 4 bulan ke depan) tanpa batas waktu kaku
  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 4, 1)

  const p_bulan_mulai = startMonth.toISOString().slice(0, 10)
  const p_bulan_akhir = endMonth.toISOString().slice(0, 10)

  const { data, error } = await supabase.rpc('grafik_setoran_periode', {
    p_bulan_mulai,
    p_bulan_akhir,
  })
  if (error) throw error
  return (data || []).map((row) => ({
    ...row,
    label: row.bulan,
    total: Number(row.total || 0),
  }))
}

export async function getGrafikSetoranMingguan(jumlahMinggu = 10) {
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('grafik_setoran_mingguan', {
      p_jumlah_minggu: jumlahMinggu,
    })
    if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData.map((r) => ({
        bulan: r.minggu,
        label: r.minggu,
        total: Number(r.total || 0),
      }))
    }
  } catch {
    // Fallback hitung dari tabel transaksi jika RPC belum dijalankan
  }

  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Minggu, 1 = Senin...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const currentMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday)

  const weeks = []
  for (let i = jumlahMinggu - 1; i >= 0; i--) {
    const start = new Date(currentMonday)
    start.setDate(currentMonday.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const label = start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    weeks.push({
      startStr: start.toISOString().slice(0, 10),
      endStr: end.toISOString().slice(0, 10),
      bulan: label,
      label,
      total: 0,
    })
  }

  const earliestDate = weeks[0]?.startStr
  const { data: txRows } = await supabase
    .from('transaksi')
    .select('nominal, jenis, tanggal')
    .eq('jenis', 'setoran')
    .gte('tanggal', earliestDate)

  ;(txRows || []).forEach((tx) => {
    const tgl = String(tx.tanggal || '').slice(0, 10)
    const bucket = weeks.find((w) => tgl >= w.startStr && tgl <= w.endStr)
    if (bucket) {
      bucket.total += Number(tx.nominal || 0)
    }
  })

  return weeks.map(({ bulan, label, total }) => ({ bulan, label, total }))
}

export async function getTotalKasMasjid() {
  const { data, error } = await supabase.rpc('total_kas_masjid')
  if (error) throw error
  return Number(data ?? 0)
}
