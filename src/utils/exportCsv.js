/**
 * Export dataset ke file CSV.
 * @param {{title: string, columns: string[], rows: any[][]}} options
 */
export function exportLaporanCsv({ title, columns, rows }) {
  const escapeCsv = (val) => {
    const str = String(val ?? '')
    // Jika mengandung koma, kutip, atau newline → bungkus dengan kutip ganda
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines = [
    columns.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ]

  // BOM untuk UTF-8 agar Excel mengenali encoding dengan benar
  const bom = '\uFEFF'
  const csvContent = bom + lines.join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
