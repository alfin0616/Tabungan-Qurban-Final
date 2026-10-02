import { supabase } from '../api/supabaseClient'

const TABLE = 'pengeluaran'

export const KATEGORI_OPTIONS = [
  { value: 'listrik', label: 'Listrik' },
  { value: 'air', label: 'Air' },
  { value: 'kebersihan', label: 'Kebersihan' },
  { value: 'atk', label: 'ATK & Perlengkapan' },
  { value: 'konsumsi', label: 'Konsumsi' },
  { value: 'pemeliharaan', label: 'Pemeliharaan' },
  { value: 'honor', label: 'Honor / Insentif' },
  { value: 'lainnya', label: 'Lainnya' },
]

export function labelKategori(value) {
  return KATEGORI_OPTIONS.find((k) => k.value === value)?.label ?? value
}

export async function getPengeluaranList({ tanggalMulai, tanggalAkhir, kategori = 'semua', search = '' } = {}) {
  let query = supabase.from(TABLE).select('*').order('tanggal', { ascending: false }).order('created_at', { ascending: false })

  if (tanggalMulai) query = query.gte('tanggal', tanggalMulai)
  if (tanggalAkhir) query = query.lte('tanggal', tanggalAkhir)
  if (kategori !== 'semua') query = query.eq('kategori', kategori)
  if (search) query = query.ilike('keterangan', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createPengeluaran(payload) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updatePengeluaran(id, payload) {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePengeluaran(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function uploadBuktiPengeluaran(file) {
  const ext = file.name.split('.').pop()
  const path = `pengeluaran/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('pengeluaran-bukti').upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('pengeluaran-bukti').getPublicUrl(path)
  return data.publicUrl
}

export async function getPengeluaranBulanIni() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const { data, error } = await supabase.from(TABLE).select('nominal').gte('tanggal', start).lte('tanggal', end)
  if (error) throw error
  return (data ?? []).reduce((sum, p) => sum + Number(p.nominal || 0), 0)
}

export async function exportPengeluaranToExcel(list) {
  const ExcelJS = (await import('exceljs')).default
  const { saveAs } = await import('file-saver')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Pengeluaran Operasional')

  const columns = ['Tanggal', 'Kategori', 'Nominal', 'Keterangan']
  const headerRow = sheet.addRow(columns)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } }
  })

  list.forEach((p) => {
    sheet.addRow([p.tanggal, labelKategori(p.kategori), p.nominal, p.keterangan || '-'])
  })

  sheet.columns.forEach((col) => (col.width = 22))

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, 'pengeluaran-operasional.xlsx')
}
