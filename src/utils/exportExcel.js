

/**
 * Export a dataset to an .xlsx file.
 * @param {{title: string, columns: string[], rows: any[][], sheetName?: string}} options
 */
export async function exportLaporanExcel({ title, columns, rows, sheetName = 'Laporan' }) {
  const ExcelJS = (await import('exceljs')).default
  const { saveAs } = await import('file-saver')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SIQURBAN'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName)

  sheet.mergeCells('A1', `${String.fromCharCode(64 + columns.length)}1`)
  sheet.getCell('A1').value = title
  sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF0E4D3C' } }

  sheet.addRow([])
  const headerRow = sheet.addRow(columns)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E4D3C' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  rows.forEach((row) => sheet.addRow(row))

  sheet.columns.forEach((col) => {
    col.width = 20
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `${title.replace(/\s+/g, '-').toLowerCase()}.xlsx`)
}
