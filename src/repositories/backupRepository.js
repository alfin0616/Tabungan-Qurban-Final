import { supabase } from '../api/supabaseClient'
import { formatDate } from '../utils/formatDate'

/**
 * Backup Service — Mengambil seluruh data dari tabel-tabel utama
 * dan mengekspornya sebagai file Excel (multi-sheet), CSV, atau JSON.
 */

const BACKUP_TABLES = [
  { name: 'anggota', label: 'Anggota' },
  { name: 'tabungan', label: 'Tabungan' },
  { name: 'transaksi', label: 'Transaksi' },
  { name: 'pengeluaran', label: 'Pengeluaran' },
  { name: 'kelompok', label: 'Kelompok' },
  { name: 'pengaturan', label: 'Pengaturan' },
]

/**
 * Mengambil seluruh data dari satu tabel (tanpa batas paginasi).
 */
async function fetchAllRows(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(`Gagal mengambil data ${tableName}: ${error.message}`)
  return data || []
}

/**
 * Mengambil seluruh data dari semua tabel yang di-backup.
 * @returns {Promise<Record<string, any[]>>}
 */
export async function fetchBackupData() {
  const result = {}
  for (const table of BACKUP_TABLES) {
    result[table.name] = await fetchAllRows(table.name)
  }
  return result
}

/**
 * Export backup ke file Excel multi-sheet (.xlsx)
 */
export async function backupToExcel() {
  const ExcelJS = (await import('exceljs')).default
  const { saveAs } = await import('file-saver')
  const allData = await fetchBackupData()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SIQURBAN Backup'
  workbook.created = new Date()

  for (const table of BACKUP_TABLES) {
    const rows = allData[table.name]
    if (!rows.length) continue

    const sheet = workbook.addWorksheet(table.label)
    const columns = Object.keys(rows[0])

    // Header
    const headerRow = sheet.addRow(columns)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E4D3C' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // Data rows
    rows.forEach((row) => {
      sheet.addRow(columns.map((col) => {
        const val = row[col]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return JSON.stringify(val)
        return val
      }))
    })

    sheet.columns.forEach((col) => { col.width = 22 })
  }

  // Metadata sheet
  const metaSheet = workbook.addWorksheet('_backup_info')
  metaSheet.addRow(['key', 'value'])
  metaSheet.addRow(['app', 'SIQURBAN'])
  metaSheet.addRow(['version', '5.6'])
  metaSheet.addRow(['backup_date', new Date().toISOString()])
  metaSheet.addRow(['tables', BACKUP_TABLES.map((t) => t.name).join(',')])

  const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HHmm')
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `siqurban-backup-${timestamp}.xlsx`)
}

/**
 * Export backup ke file JSON (.json)
 */
export async function backupToJson() {
  const allData = await fetchBackupData()
  const payload = {
    app: 'SIQURBAN',
    version: '5.6',
    backup_date: new Date().toISOString(),
    data: allData,
  }

  const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HHmm')
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  saveAs(blob, `siqurban-backup-${timestamp}.json`)
}

/**
 * Export backup ke file CSV per tabel (satu ZIP tidak praktis tanpa library tambahan,
 * jadi kita export satu tabel saja ke CSV).
 * @param {string} tableName - Nama tabel yang akan di-export
 */
export async function backupTableToCsv(tableName) {
  const rows = await fetchAllRows(tableName)
  if (!rows.length) throw new Error(`Tabel ${tableName} kosong`)

  const columns = Object.keys(rows[0])
  // Gunakan pemisah titik koma (;) agar kompatibel langsung dengan Microsoft Excel di locale Indonesia/Windows
  const csvHeader = columns.join(';')
  const csvRows = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col]
        if (val === null || val === undefined) return ''
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
        return str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      })
      .join(';'),
  )

  // Tambahkan BOM (\uFEFF) dan line ending \r\n agar Excel Windows membaca karakter UTF-8 & kolom dengan rapi
  const csv = '\uFEFF' + [csvHeader, ...csvRows].join('\r\n')
  const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HHmm')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `siqurban-${tableName}-${timestamp}.csv`)
}
