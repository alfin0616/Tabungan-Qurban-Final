import toast from 'react-hot-toast'
import { formatCurrency, calculateSkemaTabungan } from './formatCurrency'

const REMINDER_LOG_KEY = 'siqurban_wa_reminders_log_v1'

/**
 * Normalisasi nomor HP / WhatsApp Indonesia ke format internasional tanpa '+' (contoh: 628123456789)
 */
export function formatWhatsAppNumber(rawPhone) {
  if (!rawPhone) return ''
  const digits = String(rawPhone).replace(/[^0-9]/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`
  }
  if (digits.startsWith('8')) {
    return `62${digits}`
  }
  return digits
}

/**
 * Ambil catatan waktu terakhir pengingat WA dikirim untuk anggota tertentu
 */
export function getReminderLogs() {
  try {
    const raw = localStorage.getItem(REMINDER_LOG_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function markReminderSent(anggotaId) {
  if (!anggotaId) return
  try {
    const current = getReminderLogs()
    current[anggotaId] = new Date().toISOString()
    localStorage.setItem(REMINDER_LOG_KEY, JSON.stringify(current))
  } catch {
    // ignore storage errors
  }
}

/**
 * Menyusun teks pesan pengingat pembayaran WhatsApp yang sopan, rapi, dan informatif
 */
export function buildPaymentReminderMessage({
  nama = 'Jamaah Qurban',
  kodeAnggota = '',
  namaInstansi = 'Masjid / Instansi Qurban',
  namaKelompok = '',
  periode = 'bulanan',
  lamaBulan = 10,
  saldo = 0,
  target = 3000000,
  bulanTelat = 1,
  rekeningInstansi = null,
  jenisPesan = 'rutin', // 'rutin' | 'telat' | 'progres'
}) {
  const skema = calculateSkemaTabungan({
    target: Number(target) || 3000000,
    saldo: Number(saldo) || 0,
    periode: periode || 'bulanan',
    lamaBulan: Number(lamaBulan) || 10,
  })

  const persentase =
    skema.target > 0 ? Math.min(100, Math.round((skema.saldo / skema.target) * 100)) : 0

  const kodeLabel = kodeAnggota ? ` (${kodeAnggota})` : ''
  const kelompokLine = namaKelompok ? `\nKelompok: *${namaKelompok}*` : ''
  const labelSkema = skema.periode === 'mingguan' ? 'Mingguan' : 'Bulanan'

  // Blok informasi rekening instansi jika tersedia
  const namaBank = rekeningInstansi?.nama_bank || ''
  const nomorRekening = rekeningInstansi?.nomor_rekening || rekeningInstansi?.rekening || ''
  const atasNama = rekeningInstansi?.atas_nama_rekening || ''

  const rekeningBlock = nomorRekening
    ? `\n\n💳 *Rekening Pembayaran Tabungan Qurban:*\n• Bank: *${namaBank || 'Bank Tujuan'}*\n• No. Rekening: *${nomorRekening}*\n• Atas Nama: *${atasNama || namaInstansi}*`
    : ''

  if (jenisPesan === 'telat') {
    const jumlahTelat = Math.max(1, Number(bulanTelat) || 1)
    const rawTertunda = skema.nominalPerPeriode * jumlahTelat
    const nominalTertunda =
      skema.sisaTarget > 0 ? Math.min(rawTertunda, skema.sisaTarget) : rawTertunda
    const tenorDiperpanjang = skema.lamaBulan + jumlahTelat

    return (
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
      `Yth. Bapak/Ibu *${nama}*${kodeLabel}\n` +
      `Jamaah Tabungan Qurban *${namaInstansi}*${kelompokLine}\n\n` +
      `Mengingatkan dengan hormat bahwa setoran Tabungan Qurban Bapak/Ibu tercatat belum masuk selama *${jumlahTelat} ${skema.labelPeriode}*.\n\n` +
      `📋 *Rincian Tagihan & Tabungan:*\n` +
      `• Pilihan Skema: *Setoran ${labelSkema} (${skema.lamaBulan} Bulan / ${skema.totalPeriode}x ${skema.labelPeriode})*\n` +
      `• Nominal Setoran ${labelSkema}: *${formatCurrency(skema.nominalPerPeriode)} / ${skema.labelPeriode}*\n` +
      `• Total Tagihan (${jumlahTelat}x ${skema.labelPeriode}): *${formatCurrency(nominalTertunda)}*\n` +
      `• Total Target Tabungan: *${formatCurrency(skema.target)}*\n` +
      `• Saldo Terkumpul: *${formatCurrency(skema.saldo)}* (${persentase}%)\n` +
      `• Sisa Pelunasan: *${formatCurrency(skema.sisaTarget)}*\n\n` +
      `✅ *Opsi Pembayaran Fleksibel (Tanpa Denda & Tanpa Hangus):*\n` +
      `1. *Setor Rutin 1x*: *${formatCurrency(skema.nominalPerPeriode)} / ${skema.labelPeriode}*\n` +
      `2. *Rapel ${jumlahTelat}x ${skema.labelPeriode}*: *${formatCurrency(nominalTertunda)}*\n` +
      `3. *Perpanjang Tenor*: Tambah menjadi *${tenorDiperpanjang} Bulan* atau pilih skema *Mingguan (${formatCurrency(skema.nominalMingguan)} / minggu)*` +
      `${rekeningBlock}\n\n` +
      `Silakan balas pesan ini untuk konfirmasi pembayaran. Terima kasih, Jazakumullahu Khairan Katsiran.`
    )
  }

  if (jenisPesan === 'progres') {
    return (
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
      `Yth. Bapak/Ibu *${nama}*${kodeLabel}\n` +
      `Jamaah Tabungan Qurban *${namaInstansi}*${kelompokLine}\n\n` +
      `Berikut kami sampaikan informasi progres Tabungan Qurban Bapak/Ibu:\n\n` +
      `📊 *Ringkasan Tabungan Qurban:*\n` +
      `• Total Target Tabungan: *${formatCurrency(skema.target)}*\n` +
      `• Saldo Terkumpul: *${formatCurrency(skema.saldo)}* (${persentase}%)\n` +
      `• Sisa Pelunasan: *${formatCurrency(skema.sisaTarget)}*\n` +
      `• Skema Pilihan: *Setoran ${labelSkema} (${skema.lamaBulan} Bulan)*\n` +
      `• Nominal Setoran ${labelSkema}: *${formatCurrency(skema.nominalPerPeriode)} / ${skema.labelPeriode}*` +
      `${rekeningBlock}\n\n` +
      `Semoga Allah SWT memudahkan langkah Bapak/Ibu dalam menunaikan ibadah qurban. Aamiin.`
    )
  }

  // Default: 'rutin' (Pengingat Pembayaran Sesuai Skema Bulanan / Mingguan)
  return (
    `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
    `Yth. Bapak/Ibu *${nama}*${kodeLabel}\n` +
    `Jamaah Tabungan Qurban *${namaInstansi}*${kelompokLine}\n\n` +
    `Mengingatkan dengan hormat jadwal pembayaran setoran Tabungan Qurban Bapak/Ibu:\n\n` +
    `📋 *Rincian Tagihan Setoran ${labelSkema}:*\n` +
    `• Pilihan Skema: *Setoran ${labelSkema} (${skema.lamaBulan} Bulan / ${skema.totalPeriode}x ${skema.labelPeriode})*\n` +
    `• Nominal Tagihan ${labelSkema}: *${formatCurrency(skema.nominalPerPeriode)} / ${skema.labelPeriode}*\n` +
    `• Total Target Tabungan: *${formatCurrency(skema.target)}*\n` +
    `• Saldo Terkumpul: *${formatCurrency(skema.saldo)}* (${persentase}%)\n` +
    `• Sisa Pelunasan: *${formatCurrency(skema.sisaTarget)}*` +
    `${rekeningBlock}\n\n` +
    `Terima kasih atas perhatian dan kerja samanya. Jazakumullahu Khairan Katsiran.`
  )
}

/**
 * Membuka langsung aplikasi WhatsApp / WhatsApp Web ke nomor jamaah dengan pesan pengingat pembayaran
 */
export function sendDirectWhatsAppReminder({
  anggotaId,
  noHp,
  nama,
  kodeAnggota,
  namaInstansi,
  namaKelompok,
  periode,
  lamaBulan,
  saldo,
  target,
  bulanTelat = 1,
  rekeningInstansi = null,
  jenisPesan = 'rutin',
  customMessage = null,
}) {
  const waPhone = formatWhatsAppNumber(noHp)
  if (!waPhone || waPhone.length < 9) {
    toast.error(`Nomor WhatsApp untuk ${nama || 'jamaah ini'} belum diisi atau tidak valid.`)
    return false
  }

  const message =
    customMessage ||
    buildPaymentReminderMessage({
      nama,
      kodeAnggota,
      namaInstansi,
      namaKelompok,
      periode,
      lamaBulan,
      saldo,
      target,
      bulanTelat,
      rekeningInstansi,
      jenisPesan,
    })

  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
  markReminderSent(anggotaId)
  window.open(waUrl, '_blank', 'noopener,noreferrer')
  toast.success(`Membuka WhatsApp pengingat pembayaran untuk ${nama}`)
  return true
}

