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
  lamaBulan = 12,
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
    lamaBulan: Number(lamaBulan) || 12,
  })

  const persentase =
    skema.target > 0 ? Math.min(100, Math.round((skema.saldo / skema.target) * 100)) : 0

  const kodeLabel = kodeAnggota ? ` (${kodeAnggota})` : ''
  const kelompokLine = namaKelompok ? `\nKelompok: *${namaKelompok}*` : ''

  // Blok informasi rekening instansi jika tersedia
  const namaBank = rekeningInstansi?.nama_bank || ''
  const nomorRekening = rekeningInstansi?.nomor_rekening || rekeningInstansi?.rekening || ''
  const atasNama = rekeningInstansi?.atas_nama_rekening || ''

  const rekeningBlock = nomorRekening
    ? `\n\n💳 *Rekening Pembayaran Tabungan Qurban:*\n• Bank: *${namaBank || 'Bank Tujuan'}*\n• No. Rekening: *${nomorRekening}*\n• Atas Nama: *${atasNama || namaInstansi}*`
    : ''

  if (jenisPesan === 'telat') {
    const jumlahTelat = Math.max(1, Number(bulanTelat) || 1)
    const nominalTertunda = skema.nominalPerPeriode * jumlahTelat
    const tenorDiperpanjang = skema.lamaBulan + jumlahTelat

    return (
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
      `Yth. Bapak/Ibu *${nama}*${kodeLabel}\n` +
      `Jamaah Tabungan Qurban *${namaInstansi}*${kelompokLine}\n\n` +
      `Mengingatkan dengan hormat bahwa setoran Tabungan Qurban Bapak/Ibu tercatat belum masuk selama *${jumlahTelat} ${skema.labelPeriode}* (estimasi tertunda: *${formatCurrency(nominalTertunda)}*).\n\n` +
      `📊 *Rincian Tabungan Saat Ini:*\n` +
      `• Skema Aktif: *Setoran ${skema.periode === 'mingguan' ? 'Mingguan' : 'Bulanan'} (${skema.lamaBulan} Bulan)*\n` +
      `• Cicilan Rutin: *${formatCurrency(skema.nominalPerPeriode)} / ${skema.labelPeriode}*\n` +
      `• Saldo Terkumpul: *${formatCurrency(skema.saldo)}* (${persentase}%)\n` +
      `• Sisa Target: *${formatCurrency(skema.sisaTarget)}*\n\n` +
      `✅ *Opsi Penanganan Fleksibel (Tanpa Denda & Tanpa Hangus):*\n` +
      `1. *Rapel Setoran*: Menyetor *${formatCurrency(nominalTertunda)}* untuk mengejar ${jumlahTelat} ${skema.labelPeriode} yang tertunda.\n` +
      `2. *Perpanjang Lama Tabungan*: Menambah durasi tabungan menjadi *${tenorDiperpanjang} Bulan* (atau hingga 24–30 bulan) agar cicilan tetap ringan.\n` +
      `3. *Ubah ke Setoran Mingguan*: Mencicil ringan *${formatCurrency(skema.nominalMingguan)} / minggu*.` +
      `${rekeningBlock}\n\n` +
      `Silakan balas pesan ini untuk konfirmasi setoran atau penyesuaian lama tabungan. Jazakumullahu Khairan Katsiran.`
    )
  }

  if (jenisPesan === 'progres') {
    return (
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
      `Yth. Bapak/Ibu *${nama}*${kodeLabel}\n` +
      `Jamaah Tabungan Qurban *${namaInstansi}*${kelompokLine}\n\n` +
      `Berikut kami sampaikan informasi terbaru progres Tabungan Qurban Bapak/Ibu:\n` +
      `• Saldo Terkumpul: *${formatCurrency(skema.saldo)}* (${persentase}%)\n` +
      `• Target Qurban: *${formatCurrency(skema.target)}*\n` +
      `• Sisa Target: *${formatCurrency(skema.sisaTarget)}*\n` +
      `• Rencana Setoran: *${formatCurrency(skema.nominalPerPeriode)} / ${skema.labelPeriode}* (Tenor ${skema.lamaBulan} Bulan)` +
      `${rekeningBlock}\n\n` +
      `Semoga Allah SWT memudahkan langkah Bapak/Ibu dalam menunaikan ibadah qurban. Aamiin.`
    )
  }

  // Default: 'rutin' (Pengingat Pembayaran Periode Berjalan)
  return (
    `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
    `Yth. Bapak/Ibu *${nama}*${kodeLabel}\n` +
    `Jamaah Tabungan Qurban *${namaInstansi}*${kelompokLine}\n\n` +
    `Mengingatkan dengan hormat jadwal pembayaran setoran rutin Tabungan Qurban periode ini:\n` +
    `• Skema Setoran: *${skema.periode === 'mingguan' ? 'Mingguan' : 'Bulanan'} (${skema.lamaBulan} Bulan)*\n` +
    `• Nominal Setoran Rutin: *${formatCurrency(skema.nominalPerPeriode)} / ${skema.labelPeriode}*\n` +
    `• Saldo Terkumpul: *${formatCurrency(skema.saldo)}* (${persentase}%)\n` +
    `• Target Tabungan: *${formatCurrency(skema.target)}* (Sisa: *${formatCurrency(skema.sisaTarget)}*)` +
    `${rekeningBlock}\n\n` +
    `Catatan: Tabungan bersifat fleksibel & tanpa batas waktu hangus. Apabila Bapak/Ibu ingin menyesuaikan lama tabungan (misal 24 atau 30 bulan), silakan informasikan kepada pengurus.\n\n` +
    `Terima kasih. Jazakumullahu Khairan Katsiran.`
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

