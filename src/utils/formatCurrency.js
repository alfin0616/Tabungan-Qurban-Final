export function formatCurrency(value = 0) {
  const number = Number(value) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number)
}

export function parseCurrencyInput(value = '') {
  return Number(String(value).replace(/[^0-9]/g, '')) || 0
}

/**
 * Formatter sumbu Y pada grafik Recharts agar tidak muncul ".000001jt"
 * saat nilai data masih 0 atau bernilai ratusan ribu.
 */
export function formatChartAxisCurrency(value = 0) {
  const num = Number(value) || 0
  if (num <= 0) return 'Rp 0'
  if (num >= 1_000_000_000) {
    const val = (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')
    return `${val} M`
  }
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return `${val} jt`
  }
  if (num >= 1_000) {
    return `${Math.round(num / 1_000)} rb`
  }
  return `Rp ${Math.round(num)}`
}

export const DAFTAR_BULAN = [
  { value: 1, label: 'Januari', short: 'Jan' },
  { value: 2, label: 'Februari', short: 'Feb' },
  { value: 3, label: 'Maret', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'Mei', short: 'Mei' },
  { value: 6, label: 'Juni', short: 'Jun' },
  { value: 7, label: 'Juli', short: 'Jul' },
  { value: 8, label: 'Agustus', short: 'Agu' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'Oktober', short: 'Okt' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'Desember', short: 'Des' },
]

export const DEFAULT_BULAN_TARGET_QURBAN = 4 // April (sebelum pelaksanaan Idul Adha)

/**
 * Menghitung lama tabungan (bulan) dari bulan mulai sampai bulan target qurban.
 * Contoh: Mulai Juli (bulan 7) sampai April (bulan 4) -> 10 Bulan!
 */
export function hitungLamaTabunganDariBulan(bulanMulai, bulanSelesai = DEFAULT_BULAN_TARGET_QURBAN) {
  const start = Number(bulanMulai)
  const end = Number(bulanSelesai)
  if (!start || !end) return 10
  if (end >= start) {
    return end - start + 1
  }
  return (12 - start + 1) + end
}

/**
 * Menghasilkan daftar nama-nama bulan yang dilalui dari bulanMulai selama lamaBulan
 */
export function getDaftarBulanRentang(bulanMulai = 7, lamaBulan = 10) {
  const start = Number(bulanMulai) || 7
  const count = Math.min(24, Math.max(1, Number(lamaBulan) || 10))
  const result = []
  for (let i = 0; i < count; i++) {
    const mIdx = (start - 1 + i) % 12
    result.push(DAFTAR_BULAN[mIdx].short)
  }
  return result
}

export const LAMA_TABUNGAN_PRESETS = [
  { value: 6, label: '6 Bulan' },
  { value: 10, label: '10 Bulan (Mulai Juli • Standar Qurban)' },
  { value: 12, label: '12 Bulan (1 Tahun Penuh)' },
  { value: 18, label: '18 Bulan (1,5 Tahun)' },
  { value: 24, label: '24 Bulan (2 Tahun)' },
  { value: 30, label: '30 Bulan (2,5 Tahun)' },
  { value: 36, label: '36 Bulan (3 Tahun)' },
  { value: 48, label: '48 Bulan (4 Tahun)' },
]

/**
 * Menghitung estimasi setoran per periode (bulanan / mingguan) berdasarkan
 * target tabungan per anggota, saldo terkumpul, dan lama tabungan (bulan).
 */
export function calculateSkemaTabungan({
  target = 3000000,
  saldo = 0,
  periode = 'bulanan',
  lamaBulan = 12,
} = {}) {
  const cleanTarget = Math.max(0, Number(target) || 3000000)
  const cleanSaldo = Math.max(0, Number(saldo) || 0)
  const sisaTarget = Math.max(0, cleanTarget - cleanSaldo)
  const durasiBulan = Math.max(1, Number(lamaBulan) || 12)
  const totalMinggu = durasiBulan * 4

  const dasarHitung = sisaTarget > 0 ? sisaTarget : cleanTarget
  const nominalBulanan = Math.ceil(dasarHitung / durasiBulan)
  const nominalMingguan = Math.ceil(dasarHitung / totalMinggu)
  const isMingguan = periode === 'mingguan'

  return {
    target: cleanTarget,
    saldo: cleanSaldo,
    sisaTarget,
    periode: isMingguan ? 'mingguan' : 'bulanan',
    lamaBulan: durasiBulan,
    totalPeriode: isMingguan ? totalMinggu : durasiBulan,
    nominalPerPeriode: isMingguan ? nominalMingguan : nominalBulanan,
    nominalBulanan,
    nominalMingguan,
    labelPeriode: isMingguan ? 'minggu' : 'bulan',
  }
}
