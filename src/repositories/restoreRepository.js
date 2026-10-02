import { supabase } from '../api/supabaseClient'

/**
 * Restore Service — Membaca file backup (Excel multi-sheet atau JSON)
 * dan melakukan upsert ke tabel-tabel Supabase.
 *
 * PENTING: Operasi restore bersifat UPSERT (insert on conflict update).
 * Data yang sudah ada dengan ID sama akan diperbarui, data baru akan ditambahkan.
 * Data existing yang TIDAK ada di file backup TIDAK akan dihapus.
 */

const RESTORE_ORDER = ['kelompok', 'anggota', 'tabungan', 'transaksi', 'pengeluaran', 'pengaturan']

/**
 * Restore dari file Excel backup (.xlsx)
 * @param {File} file - File Excel yang diupload
 * @returns {Promise<{restored: string[], skipped: string[], errors: string[]}>}
 */
export async function restoreFromExcel(file) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()
  await workbook.xlsx.load(buffer)

  const result = { restored: [], skipped: [], errors: [] }

  for (const tableName of RESTORE_ORDER) {
    const sheet = workbook.getWorksheet(
      tableName.charAt(0).toUpperCase() + tableName.slice(1),
    )
    if (!sheet || sheet.rowCount < 2) {
      result.skipped.push(tableName)
      continue
    }

    try {
      const rows = parseSheet(sheet)
      if (!rows.length) {
        result.skipped.push(tableName)
        continue
      }

      const { error } = await supabase.from(tableName).upsert(rows, { onConflict: 'id' })
      if (error) throw error

      result.restored.push(`${tableName} (${rows.length} baris)`)
    } catch (err) {
      result.errors.push(`${tableName}: ${err.message}`)
    }
  }

  return result
}

/**
 * Restore dari file JSON backup (.json)
 * @param {File} file - File JSON yang diupload
 * @returns {Promise<{restored: string[], skipped: string[], errors: string[]}>}
 */
export async function restoreFromJson(file) {
  const text = await file.text()
  let payload

  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('File JSON tidak valid.')
  }

  if (!payload.data || payload.app !== 'SIQURBAN') {
    throw new Error('File bukan backup SIQURBAN yang valid.')
  }

  const result = { restored: [], skipped: [], errors: [] }

  for (const tableName of RESTORE_ORDER) {
    const rows = payload.data[tableName]
    if (!rows || !rows.length) {
      result.skipped.push(tableName)
      continue
    }

    try {
      const { error } = await supabase.from(tableName).upsert(rows, { onConflict: 'id' })
      if (error) throw error

      result.restored.push(`${tableName} (${rows.length} baris)`)
    } catch (err) {
      result.errors.push(`${tableName}: ${err.message}`)
    }
  }

  return result
}

/**
 * Parse Excel worksheet menjadi array of objects
 */
function parseSheet(sheet) {
  const headers = []
  const rows = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim()
      })
      return
    }

    const obj = {}
    let hasValue = false
    row.eachCell((cell, colNumber) => {
      const key = headers[colNumber]
      if (!key) return
      let val = cell.value
      if (val !== null && val !== undefined && val !== '') hasValue = true
      // ExcelJS returns dates as Date objects, convert to ISO string
      if (val instanceof Date) val = val.toISOString()
      obj[key] = val === '' ? null : val
    })

    if (hasValue) rows.push(obj)
  })

  return rows
}
