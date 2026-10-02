
import { formatCurrency } from './formatCurrency'
import { formatDate } from './formatDate'

/**
 * Export a transaksi/laporan dataset to a PDF file.
 * @param {{title: string, subtitle?: string, columns: string[], rows: any[][], summary?: {label:string, value:string}[]}} options
 */
export async function exportLaporanPdf({ title, subtitle, columns, rows, summary = [] }) {
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.setTextColor(14, 77, 60)
  doc.text(title, 14, 18)

  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(102, 118, 110)
    doc.text(subtitle, 14, 25)
  }

  autoTable(doc, {
    startY: 32,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [14, 77, 60], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [28, 37, 33] },
    alternateRowStyles: { fillColor: [250, 249, 245] },
  })

  if (summary.length) {
    let y = doc.lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.setTextColor(28, 37, 33)
    summary.forEach((item) => {
      doc.text(`${item.label}: ${item.value}`, 14, y)
      y += 6
    })
  }

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Dicetak pada ${formatDate(new Date(), 'd MMM yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10)

  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export { formatCurrency }
