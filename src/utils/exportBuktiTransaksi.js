import jsPDF from 'jspdf'
import { formatCurrency } from './formatCurrency'
import { formatDate } from './formatDate'

/**
 * Cetak bukti transaksi (setoran/penarikan) sebagai PDF berukuran struk A5.
 */
export function cetakBuktiTransaksi({ jenis, anggotaNama, kodeAnggota, tanggal, nominal, metodePembayaran, keterangan, namaInstansi = 'SIQURBAN' }) {
  const doc = new jsPDF({ format: 'a5' })
  const isSetoran = jenis === 'setoran'

  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, 148, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text(namaInstansi, 10, 12)
  doc.setFontSize(10)
  doc.text(`Bukti ${isSetoran ? 'Setoran' : 'Penarikan'} Tabungan Qurban`, 10, 20)

  doc.setTextColor(15, 23, 42)
  let y = 42
  const rows = [
    ['Tanggal', formatDate(tanggal)],
    ['Nama Anggota', anggotaNama],
    ['Kode Anggota', kodeAnggota],
    ['Jenis Transaksi', isSetoran ? 'Setoran' : 'Penarikan'],
    ...(metodePembayaran ? [['Metode Pembayaran', metodePembayaran.toUpperCase()]] : []),
    ['Keterangan', keterangan || '-'],
  ]

  doc.setFontSize(10)
  rows.forEach(([label, value]) => {
    doc.setTextColor(100, 116, 139)
    doc.text(label, 10, y)
    doc.setTextColor(15, 23, 42)
    doc.text(String(value), 55, y)
    y += 8
  })

  y += 4
  doc.setDrawColor(226, 232, 240)
  doc.line(10, y, 138, y)
  y += 10

  doc.setFontSize(11)
  doc.setTextColor(100, 116, 139)
  doc.text('Nominal', 10, y)
  doc.setFontSize(16)
  doc.setTextColor(isSetoran ? 16 : 239, isSetoran ? 185 : 68, isSetoran ? 129 : 68)
  doc.text(formatCurrency(nominal), 55, y)

  y += 20
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Dicetak pada ${formatDate(new Date(), 'd MMM yyyy HH:mm')}`, 10, y)

  doc.save(`bukti-${jenis}-${anggotaNama.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
