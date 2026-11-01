import jsPDF from 'jspdf'
import { formatCurrency } from './formatCurrency'
import { formatDate } from './formatDate'

/**
 * Konversi angka nominal menjadi teks Terbilang Bahasa Indonesia
 */
function terbilangKata(n) {
  const angka = Math.floor(Math.abs(Number(n) || 0))
  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ]

  if (angka < 12) return satuan[angka]
  if (angka < 20) return `${terbilangKata(angka - 10)} Belas`
  if (angka < 100) {
    return `${terbilangKata(Math.floor(angka / 10))} Puluh ${terbilangKata(angka % 10)}`.trim()
  }
  if (angka < 200) return `Seratus ${terbilangKata(angka - 100)}`.trim()
  if (angka < 1000) {
    return `${terbilangKata(Math.floor(angka / 100))} Ratus ${terbilangKata(angka % 100)}`.trim()
  }
  if (angka < 2000) return `Seribu ${terbilangKata(angka - 1000)}`.trim()
  if (angka < 1000000) {
    return `${terbilangKata(Math.floor(angka / 1000))} Ribu ${terbilangKata(angka % 1000)}`.trim()
  }
  if (angka < 1000000000) {
    return `${terbilangKata(Math.floor(angka / 1000000))} Juta ${terbilangKata(angka % 1000000)}`.trim()
  }
  if (angka < 1000000000000) {
    return `${terbilangKata(Math.floor(angka / 1000000000))} Miliar ${terbilangKata(angka % 1000000000)}`.trim()
  }
  return formatCurrency(angka)
}

export function terbilangRupiah(nominal) {
  const num = Math.floor(Math.abs(Number(nominal) || 0))
  if (num === 0) return 'Nol Rupiah'
  return `${terbilangKata(num).replace(/\s+/g, ' ').trim()} Rupiah`
}

/**
 * Cetak bukti transaksi (setoran/penarikan) sebagai PDF Kwitansi Resmi A5 berdesain profesional.
 */
export function cetakBuktiTransaksi({
  id,
  jenis = 'setoran',
  anggotaNama = 'Jamaah Qurban',
  kodeAnggota = '-',
  tanggal = new Date(),
  nominal = 0,
  metodePembayaran = 'tunai',
  keterangan = '-',
  namaInstansi = 'SIQURBAN',
  alamatInstansi = '',
  namaKelompok = '',
}) {
  const doc = new jsPDF({ format: 'a5', orientation: 'portrait', unit: 'mm' })
  const isSetoran = jenis === 'setoran'
  const pageWidth = doc.internal.pageSize.getWidth() // 148 mm
  const pageHeight = doc.internal.pageSize.getHeight() // 210 mm

  const instansiTitle = (namaInstansi || 'SIQURBAN').toUpperCase()
  const datePart = (() => {
    try {
      const d = new Date(tanggal)
      if (Number.isNaN(d.getTime())) return '20261101'
      return d.toISOString().slice(0, 10).replace(/-/g, '')
    } catch {
      return '20261101'
    }
  })()
  const refSuffix = id
    ? String(id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()
    : String(kodeAnggota || 'TRX').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()
  const nomorReferensi = `KW/${isSetoran ? 'STR' : 'PNR'}/${datePart}/${refSuffix || '001'}`

  // ── 1. Bingkai Luar Dokumen ─────────────────────────────────────────────────
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.35)
  doc.roundedRect(6, 6, pageWidth - 12, pageHeight - 12, 3, 3, 'S')

  // ── 2. Header Kop Surat Profesional (Deep Emerald) ──────────────────────────
  doc.setFillColor(6, 78, 59) // Deep Emerald 900
  doc.roundedRect(6, 6, pageWidth - 12, 31, 3, 3, 'F')
  // Tutup sudut bawah header agar rata
  doc.rect(6, 30, pageWidth - 12, 7, 'F')

  // Garis Aksen Emas / Emerald Muda di Bawah Header
  doc.setFillColor(16, 185, 129)
  doc.rect(6, 36.2, pageWidth - 12, 1.5, 'F')

  // Teks Kiri Header: Instansi & Sistem
  doc.setTextColor(167, 243, 208) // Emerald 200
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('SISTEM INFORMASI TABUNGAN QURBAN (SIQURBAN)', 12, 13.5)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(instansiTitle.slice(0, 32), 12, 20.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(209, 250, 229)
  doc.text(
    alamatInstansi
      ? String(alamatInstansi).slice(0, 48)
      : 'Kwitansi Resmi Bukti Transaksi Keuangan Tabungan Qurban',
    12,
    26,
  )
  doc.text(`No. Referensi: ${nomorReferensi}`, 12, 31.5)

  // Kotak Badge Kanan Header: Jenis Dokumen
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(pageWidth - 49, 11.5, 37, 15, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text('DOKUMEN RESMI', pageWidth - 30.5, 16.5, { align: 'center' })

  doc.setFontSize(9)
  if (isSetoran) {
    doc.setTextColor(5, 150, 105)
    doc.text('BUKTI SETORAN', pageWidth - 30.5, 22.5, { align: 'center' })
  } else {
    doc.setTextColor(220, 38, 38)
    doc.text('BUKTI PENARIKAN', pageWidth - 30.5, 22.5, { align: 'center' })
  }

  // ── 3. Strip Status & Tanggal Transaksi ─────────────────────────────────────
  let y = 44
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.25)
  doc.roundedRect(12, y - 4.5, pageWidth - 24, 10, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`Tanggal Transaksi: ${formatDate(tanggal)}`, 16, y + 1.8)

  // Pill Status Terverifikasi
  if (isSetoran) {
    doc.setFillColor(209, 250, 229)
    doc.roundedRect(pageWidth - 52, y - 2.8, 37, 6.5, 1.5, 1.5, 'F')
    doc.setTextColor(6, 95, 70)
    doc.setFontSize(7)
    doc.text('STATUS: TERVERIFIKASI', pageWidth - 33.5, y + 1.5, { align: 'center' })
  } else {
    doc.setFillColor(254, 226, 226)
    doc.roundedRect(pageWidth - 52, y - 2.8, 37, 6.5, 1.5, 1.5, 'F')
    doc.setTextColor(153, 27, 27)
    doc.setFontSize(7)
    doc.text('STATUS: DISETUJUI', pageWidth - 33.5, y + 1.5, { align: 'center' })
  }

  // ── 4. Tabel Rincian Data Jamaah & Transaksi ────────────────────────────────
  y = 58
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(6, 78, 59)
  doc.text('RINCIAN INFORMASI JAMAAH & TRANSAKSI', 12, y)

  y += 3
  const detailRows = [
    ['Nama Lengkap Jamaah', anggotaNama || '-'],
    ['Kode / ID Anggota', kodeAnggota || '-'],
    ['Masjid / Instansi', namaInstansi || 'SIQURBAN'],
    ...(namaKelompok ? [['Kelompok Qurban', namaKelompok]] : []),
    ['Jenis Transaksi', isSetoran ? 'Setoran Tabungan Qurban' : 'Penarikan Dana Tabungan'],
    ['Metode Pembayaran', (metodePembayaran || 'TUNAI').toUpperCase()],
    ['Keterangan / Catatan', keterangan || (isSetoran ? 'Setoran rutin tabungan qurban' : '-')],
  ]

  const rowHeight = 8.2
  const tableStartY = y
  const tableWidth = pageWidth - 24

  detailRows.forEach(([label, value], idx) => {
    const currentY = tableStartY + idx * rowHeight
    // Zebra background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252)
    } else {
      doc.setFillColor(255, 255, 255)
    }
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.2)
    doc.rect(12, currentY, tableWidth, rowHeight, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text(label, 16, currentY + 5.5)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    const valStr = String(value ?? '-')
    doc.text(valStr.length > 42 ? `${valStr.slice(0, 42)}...` : valStr, 62, currentY + 5.5)
  })

  y = tableStartY + detailRows.length * rowHeight + 7

  // ── 5. Kotak Highlight Nominal & Terbilang (Hero Box) ───────────────────────
  if (isSetoran) {
    doc.setFillColor(236, 253, 245) // Emerald 50
    doc.setDrawColor(16, 185, 129) // Emerald 500
  } else {
    doc.setFillColor(254, 242, 242) // Rose 50
    doc.setDrawColor(239, 68, 68) // Rose 500
  }
  doc.setLineWidth(0.45)
  doc.roundedRect(12, y, tableWidth, 26, 2.5, 2.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(
    isSetoran ? 'TOTAL NOMINAL SETORAN DITERIMA' : 'TOTAL NOMINAL PENARIKAN DANA',
    16,
    y + 6.5,
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  if (isSetoran) {
    doc.setTextColor(5, 150, 105)
  } else {
    doc.setTextColor(220, 38, 38)
  }
  doc.text(formatCurrency(nominal), pageWidth - 16, y + 11, { align: 'right' })

  // Garis pemisah tipis untuk Terbilang
  doc.setDrawColor(167, 243, 208)
  doc.setLineWidth(0.2)
  doc.line(16, y + 15.5, pageWidth - 16, y + 15.5)

  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  const teksTerbilang = `Terbilang: # ${terbilangRupiah(nominal)} #`
  doc.text(teksTerbilang.slice(0, 68), 16, y + 21.5)

  y += 35

  // ── 6. Blok Tanda Tangan & Stempel Verifikasi ───────────────────────────────
  const leftColCenter = 36
  const rightColCenter = pageWidth - 38

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(isSetoran ? 'Penyetor / Jamaah,' : 'Penerima / Jamaah,', leftColCenter, y, {
    align: 'center',
  })
  doc.text(`${formatDate(new Date())}`, rightColCenter, y - 4, { align: 'center' })
  doc.text('Petugas / Bendahara Qurban,', rightColCenter, y, { align: 'center' })

  // Stempel Digital Resmi di Area Tanda Tangan Petugas
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(0.35)
  doc.roundedRect(rightColCenter - 21, y + 4, 42, 10, 1.5, 1.5, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(5, 150, 105)
  doc.text('TERCATAT & SAH DI SISTEM', rightColCenter, y + 8.2, { align: 'center' })
  doc.text('SIQURBAN DIGITAL RECEIPT', rightColCenter, y + 11.8, { align: 'center' })

  const signLineY = y + 21
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.25)
  doc.line(leftColCenter - 20, signLineY, leftColCenter + 20, signLineY)
  doc.line(rightColCenter - 22, signLineY, rightColCenter + 22, signLineY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(15, 23, 42)
  doc.text(`( ${(anggotaNama || 'Jamaah').slice(0, 22)} )`, leftColCenter, signLineY + 4.5, {
    align: 'center',
  })
  doc.text(`( Pengurus ${instansiTitle.slice(0, 15)} )`, rightColCenter, signLineY + 4.5, {
    align: 'center',
  })

  // ── 7. Footer Resmi di Bagian Bawah Halaman ─────────────────────────────────
  const footerY = pageHeight - 14
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.25)
  doc.line(12, footerY - 3.5, pageWidth - 12, footerY - 3.5)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.8)
  doc.setTextColor(100, 116, 139)
  doc.text(
    'Kwitansi ini diterbitkan secara elektronik oleh Sistem Manajemen Tabungan Qurban (SIQURBAN) dan sah sebagai bukti pembayaran.',
    pageWidth / 2,
    footerY,
    { align: 'center' },
  )
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Dicetak pada: ${formatDate(new Date(), 'd MMM yyyy HH:mm')} WIB • Ref: ${nomorReferensi}`,
    pageWidth / 2,
    footerY + 3.8,
    { align: 'center' },
  )

  const cleanName = String(anggotaNama || 'jamaah')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  doc.save(`bukti-${jenis}-${cleanName || 'transaksi'}.pdf`)
}
