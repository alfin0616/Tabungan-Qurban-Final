import { formatCurrency } from './formatCurrency'
import { formatDate } from './formatDate'

/**
 * Export dataset laporan / riwayat transaksi menjadi dokumen PDF Laporan Keuangan Resmi berdesain profesional.
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   namaInstansi?: string,
 *   alamatInstansi?: string,
 *   columns: string[],
 *   rows: any[][],
 *   summary?: {label:string, value:string}[]
 * }} options
 */
export async function exportLaporanPdf({
  title = 'Laporan Keuangan Tabungan Qurban',
  subtitle = '',
  namaInstansi = 'SIQURBAN',
  alamatInstansi = '',
  columns = [],
  rows = [],
  summary = [],
}) {
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'mm' })

  const pageWidth = doc.internal.pageSize.getWidth() // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight() // 297 mm
  const marginX = 14

  // ── 1. Header Kop Surat Resmi (Deep Emerald) ────────────────────────────────
  doc.setFillColor(6, 78, 59) // Deep Emerald 900
  doc.rect(0, 0, pageWidth, 34, 'F')

  // Garis Aksen Hijau Emerald di Bawah Kop
  doc.setFillColor(16, 185, 129)
  doc.rect(0, 34, pageWidth, 1.8, 'F')

  // Teks Kiri Kop Surat
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(167, 243, 208)
  doc.text('SISTEM INFORMASI MANAJEMEN TABUNGAN QURBAN (SIQURBAN)', marginX, 11)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text(String(title).toUpperCase().slice(0, 52), marginX, 19)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(209, 250, 229)
  doc.text(
    subtitle || `Dicetak pada ${formatDate(new Date(), 'd MMMM yyyy')}`,
    marginX,
    25.5,
  )
  if (alamatInstansi) {
    doc.setFontSize(8)
    doc.text(String(alamatInstansi).slice(0, 75), marginX, 30.5)
  }

  // Kotak Badge Kanan Kop Surat
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(pageWidth - marginX - 46, 8.5, 46, 17, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text('DOKUMEN RESMI', pageWidth - marginX - 23, 14, { align: 'center' })
  doc.setFontSize(8.5)
  doc.setTextColor(6, 78, 59)
  doc.text('LAPORAN KEUANGAN', pageWidth - marginX - 23, 19.5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(100, 116, 139)
  doc.text(formatDate(new Date(), 'dd/MM/yyyy HH:mm'), pageWidth - marginX - 23, 23.5, {
    align: 'center',
  })

  let currentY = 43

  // ── 2. Kartu Ringkasan Eksekutif (Summary KPI Boxes) di Atas Tabel ──────────
  if (summary && summary.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(6, 78, 59)
    doc.text('RINGKASAN EKSEKUTIF PERIODE', marginX, currentY)
    currentY += 3

    const maxCards = Math.min(summary.length, 5)
    const gap = 3
    const totalWidth = pageWidth - marginX * 2
    const cardW = (totalWidth - gap * (maxCards - 1)) / maxCards
    const cardH = 17

    summary.slice(0, maxCards).forEach((item, idx) => {
      const x = marginX + idx * (cardW + gap)
      const isHighlight =
        item.label.toLowerCase().includes('saldo') ||
        item.label.toLowerCase().includes('setoran')

      if (isHighlight) {
        doc.setFillColor(236, 253, 245) // Emerald 50
        doc.setDrawColor(16, 185, 129)
      } else {
        doc.setFillColor(248, 250, 252) // Slate 50
        doc.setDrawColor(203, 213, 225)
      }
      doc.setLineWidth(0.3)
      doc.roundedRect(x, currentY, cardW, cardH, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(100, 116, 139)
      const shortLabel = String(item.label)
        .replace('Total Pengeluaran Operasional', 'Pengeluaran Ops.')
        .replace('Saldo Bersih Periode', 'Saldo Bersih')
        .toUpperCase()
      doc.text(shortLabel.slice(0, 22), x + 3, currentY + 5.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      if (item.label.toLowerCase().includes('penarikan')) {
        doc.setTextColor(220, 38, 38)
      } else if (item.label.toLowerCase().includes('pengeluaran')) {
        doc.setTextColor(217, 119, 6)
      } else if (isHighlight) {
        doc.setTextColor(5, 150, 105)
      } else {
        doc.setTextColor(15, 23, 42)
      }
      doc.text(String(item.value).slice(0, 20), x + 3, currentY + 12.5)
    })

    currentY += cardH + 8
  }

  // ── 3. Persiapan Kolom & Baris Tabel Profesional ────────────────────────────
  const hasNoColumn =
    columns.length > 0 &&
    (columns[0].toLowerCase() === 'no' || columns[0].toLowerCase() === 'no.')
  const finalColumns = hasNoColumn ? columns : ['No.', ...columns]

  const metodeIdx = finalColumns.findIndex((c) => c.toLowerCase().includes('metode'))
  const nominalIdx = finalColumns.findIndex((c) => c.toLowerCase().includes('nominal'))

  const finalRows = rows.map((r, idx) => {
    const baseRow = hasNoColumn ? [...r] : [String(idx + 1), ...r]
    if (metodeIdx >= 0 && baseRow[metodeIdx]) {
      baseRow[metodeIdx] = String(baseRow[metodeIdx]).toUpperCase()
    }
    return baseRow
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(6, 78, 59)
  doc.text(`RINCIAN DATA TRANSAKSI (${rows.length} DATA)`, marginX, currentY - 2)

  const columnStyles = {
    0: { halign: 'center', cellWidth: 11 },
  }
  if (nominalIdx >= 0) {
    columnStyles[nominalIdx] = { halign: 'right', fontStyle: 'bold' }
  }
  if (metodeIdx >= 0) {
    columnStyles[metodeIdx] = { halign: 'center' }
  }

  autoTable(doc, {
    startY: currentY,
    head: [finalColumns],
    body: finalRows,
    theme: 'grid',
    margin: { left: marginX, right: marginX },
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3.2,
      lineColor: [6, 78, 59],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 8.2,
      textColor: [30, 41, 59],
      cellPadding: 2.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
  })

  // ── 4. Kotak Rekapitulasi Akhir & Blok Tanda Tangan Pengesahan ──────────────
  let afterTableY = (doc.lastAutoTable?.finalY || currentY + 20) + 10
  if (afterTableY + 52 > pageHeight - 18) {
    doc.addPage()
    afterTableY = 22
  }

  // Tabel Rekapitulasi Kiri (jika ada summary)
  if (summary && summary.length > 0) {
    const boxWidth = 96
    const rowH = 6.8
    const boxHeight = summary.length * rowH + 10

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.3)
    doc.roundedRect(marginX, afterTableY, boxWidth, boxHeight, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(6, 78, 59)
    doc.text('REKAPITULASI AKHIR LAPORAN', marginX + 4, afterTableY + 6)

    doc.setDrawColor(226, 232, 240)
    doc.line(marginX + 4, afterTableY + 8, marginX + boxWidth - 4, afterTableY + 8)

    summary.forEach((item, idx) => {
      const rowY = afterTableY + 13.5 + idx * rowH
      const isSaldoBersih = item.label.toLowerCase().includes('saldo bersih')
      doc.setFont('helvetica', isSaldoBersih ? 'bold' : 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text(String(item.label), marginX + 4, rowY)

      doc.setFont('helvetica', 'bold')
      if (isSaldoBersih) {
        doc.setTextColor(5, 150, 105)
      } else {
        doc.setTextColor(15, 23, 42)
      }
      doc.text(String(item.value), marginX + boxWidth - 4, rowY, { align: 'right' })
    })
  }

  // Blok Pengesahan & Tanda Tangan di Kanan
  const signCenterX = pageWidth - marginX - 38
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text(`Dicetak pada, ${formatDate(new Date())}`, signCenterX, afterTableY + 5, {
    align: 'center',
  })
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Pengurus / Bendahara Qurban,', signCenterX, afterTableY + 10, {
    align: 'center',
  })

  // Stempel Verifikasi Laporan
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(0.35)
  doc.roundedRect(signCenterX - 24, afterTableY + 14, 48, 11, 1.5, 1.5, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(5, 150, 105)
  doc.text('DOKUMEN TERVERIFIKASI', signCenterX, afterTableY + 18.5, { align: 'center' })
  doc.text('SISTEM SIQURBAN RESMI', signCenterX, afterTableY + 22.5, { align: 'center' })

  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.3)
  doc.line(signCenterX - 26, afterTableY + 33, signCenterX + 26, afterTableY + 33)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`( Pengurus ${String(namaInstansi || 'SIQURBAN').slice(0, 22)} )`, signCenterX, afterTableY + 38, {
    align: 'center',
  })

  // ── 5. Footer & Nomor Halaman di Setiap Halaman ─────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const footerY = pageHeight - 10
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.25)
    doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Laporan Resmi SIQURBAN • Dicetak pada ${formatDate(new Date(), 'd MMM yyyy HH:mm')} WIB`,
      marginX,
      footerY,
    )
    doc.setFont('helvetica', 'bold')
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, footerY, {
      align: 'right',
    })
  }

  const cleanFileName = String(title || 'laporan-keuangan')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  doc.save(`${cleanFileName || 'laporan-siqurban'}.pdf`)
}

export { formatCurrency }
