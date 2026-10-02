import { supabase } from '../api/supabaseClient'

const TABLE = 'anggota'

export async function getAnggotaList({ search = '', status = 'semua', page = 1, pageSize = 10 } = {}) {
  let query = supabase.from(TABLE).select('*', { count: 'exact' }).order('created_at', { ascending: false })

  if (search) {
    query = query.or(`nama.ilike.%${search}%,kode_anggota.ilike.%${search}%,no_hp.ilike.%${search}%`)
  }
  if (status !== 'semua') {
    query = query.eq('status', status === 'aktif')
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { data, count: count ?? 0, page, pageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) }
}

export async function getAnggotaById(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single()
  if (error) throw error
  return data
}

/**
 * Menghubungkan akun login yang sedang aktif ke satu baris anggota,
 * lewat verifikasi Kode Anggota + No HP. Dipakai jamaah saat login
 * pertama kali (lihat RPC klaim_akun_anggota).
 */
export async function claimAkunAnggota({ kodeAnggota, noHp }) {
  const { data, error } = await supabase.rpc('klaim_akun_anggota', {
    p_kode_anggota: kodeAnggota,
    p_no_hp: noHp,
  })
  if (error) throw error
  return data
}

export async function getAnggotaSaya(userId) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function getAllAnggotaForSelect() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, nama, kode_anggota')
    .eq('status', true)
    .order('nama', { ascending: true })
  if (error) throw error
  return data
}

export async function createAnggota(payload) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single()
  if (error) throw error

  // Setiap anggota baru otomatis mendapat rekening tabungan
  await supabase.from('tabungan').insert({
    anggota_id: data.id,
    saldo: 0,
    target: 0,
  })

  return data
}

export async function updateAnggota(id, payload) {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAnggota(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function uploadAnggotaFoto(file, anggotaId) {
  const ext = file.name.split('.').pop()
  const path = `anggota/${anggotaId}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('foto-anggota').upload(path, file, {
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from('foto-anggota').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Import anggota secara massal dari file Excel.
 * Kolom (baris pertama = header): Nama, Alamat, No HP, Jenis Kelamin (L/P), Tanggal Bergabung (YYYY-MM-DD)
 */
export async function importAnggotaFromExcel(file) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.worksheets[0]
  const rows = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // lewati header
    const [, nama, alamat, no_hp, jenis_kelamin, tanggal_bergabung] = row.values
    if (!nama) return
    rows.push({
      nama: String(nama).trim(),
      alamat: String(alamat ?? '').trim(),
      no_hp: String(no_hp ?? '').trim(),
      jenis_kelamin: String(jenis_kelamin ?? 'L').trim().toUpperCase() === 'P' ? 'P' : 'L',
      tanggal_bergabung: tanggal_bergabung
        ? new Date(tanggal_bergabung).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      status: true,
    })
  })

  if (!rows.length) throw new Error('Tidak ada data valid ditemukan pada file')

  const { data, error } = await supabase.from(TABLE).insert(rows).select()
  if (error) throw error

  await supabase.from('tabungan').insert(data.map((a) => ({ anggota_id: a.id, saldo: 0, target: 0 })))

  return data
}

export async function exportAnggotaToExcel(anggotaList) {
  const ExcelJS = (await import('exceljs')).default
  const { saveAs } = await import('file-saver')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Data Anggota')

  const columns = ['Kode Anggota', 'Nama', 'Alamat', 'No HP', 'Jenis Kelamin', 'Tanggal Bergabung', 'Status']
  const headerRow = sheet.addRow(columns)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
  })

  anggotaList.forEach((a) => {
    sheet.addRow([
      a.kode_anggota,
      a.nama,
      a.alamat,
      a.no_hp,
      a.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      a.tanggal_bergabung,
      a.status ? 'Aktif' : 'Tidak Aktif',
    ])
  })

  sheet.columns.forEach((col) => (col.width = 20))

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, 'data-anggota.xlsx')
}
