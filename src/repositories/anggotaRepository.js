import { supabase } from '../api/supabaseClient'
import { enrichRowWithSkema, saveLocalSkema } from './tabunganRepository'

const TABLE = 'anggota'
const KELOMPOK_MEMBERS_CACHE_KEY = 'siqurban_kelompok_members_cache_v1'

function loadMembersCacheMap() {
  try {
    const raw = localStorage.getItem(KELOMPOK_MEMBERS_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMembersCacheMap(map) {
  try {
    localStorage.setItem(KELOMPOK_MEMBERS_CACHE_KEY, JSON.stringify(map))
  } catch {
    // ignore storage quota errors
  }
}

export function syncKelompokMembersCache(rows = []) {
  if (!Array.isArray(rows) || !rows.length) return
  const map = loadMembersCacheMap()
  rows.forEach((row) => {
    if (!row || !row.id) return
    const klpId = row.kelompok_id || row.kelompok?.id
    if (!klpId) return
    const existingList = Array.isArray(map[klpId]) ? map[klpId] : []
    const idx = existingList.findIndex((item) => item.id === row.id)
    const entry = {
      id: row.id,
      kode_anggota: row.kode_anggota || '',
      nama: row.nama || 'Anggota',
      no_hp: row.no_hp || '-',
      alamat: row.alamat || '-',
      jenis_kelamin: row.jenis_kelamin || 'L',
      tanggal_bergabung: row.tanggal_bergabung || row.created_at || new Date().toISOString().slice(0, 10),
      status: row.status !== undefined ? row.status : true,
      foto: row.foto || null,
      instansi_id: row.instansi_id || row.instansi?.id || null,
      kelompok_id: klpId,
      user_id: row.user_id || null,
      instansi: row.instansi || existingList[idx]?.instansi || null,
      kelompok: row.kelompok || existingList[idx]?.kelompok || null,
      tabungan: row.tabungan || existingList[idx]?.tabungan || [{ saldo: 0, target: 0 }],
    }
    if (idx >= 0) {
      existingList[idx] = { ...existingList[idx], ...entry }
    } else {
      existingList.push(entry)
    }
    map[klpId] = existingList
  })
  saveMembersCacheMap(map)
}

function removeMemberFromCache(id) {
  const map = loadMembersCacheMap()
  let changed = false
  Object.keys(map).forEach((klpId) => {
    if (Array.isArray(map[klpId])) {
      const filtered = map[klpId].filter((m) => m.id !== id)
      if (filtered.length !== map[klpId].length) {
        map[klpId] = filtered
        changed = true
      }
    }
  })
  if (changed) saveMembersCacheMap(map)
}

export async function getAnggotaList({
  search = '',
  status = 'semua',
  instansi_id = '',
  kelompok_id = '',
  page = 1,
  pageSize = 10,
} = {}) {
  let query = supabase
    .from(TABLE)
    .select(
      '*, instansi:instansi_id(id, nama_instansi, kode_instansi), kelompok:kelompok_id(id, nama_kelompok, kode_kelompok, jenis_qurban, target_dana, maksimal_anggota), tabungan(saldo, target)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`nama.ilike.%${search}%,kode_anggota.ilike.%${search}%,no_hp.ilike.%${search}%`)
  }
  if (status !== 'semua') {
    query = query.eq('status', status === 'aktif')
  }
  if (instansi_id) {
    query = query.eq('instansi_id', instansi_id)
  }
  if (kelompok_id) {
    query = query.eq('kelompok_id', kelompok_id)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  let finalData = Array.isArray(data) ? [...data] : []
  let finalCount = count ?? finalData.length

  if (finalData.length) {
    syncKelompokMembersCache(finalData)
  }

  // Jika memfilter berdasarkan kelompok_id (mis. Jamaah melihat anggota kelompoknya),
  // coba ambil dari RPC get_anggota_kelompok (SECURITY DEFINER) + fallback cache kelompok
  if (kelompok_id) {
    try {
      const { data: rpcRows, error: rpcErr } = await supabase.rpc('get_anggota_kelompok', {
        p_kelompok_id: kelompok_id,
      })
      if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
        syncKelompokMembersCache(rpcRows)
        const byId = new Map(finalData.map((r) => [r.id, r]))
        rpcRows.forEach((r) => {
          if (!byId.has(r.id)) {
            byId.set(r.id, r)
          } else {
            byId.set(r.id, { ...r, ...byId.get(r.id) })
          }
        })
        finalData = Array.from(byId.values())
      }
    } catch {
      // RPC belum dijalankan, lanjut ke fallback cache
    }

    const cacheMap = loadMembersCacheMap()
    const cachedGroupRows = Array.isArray(cacheMap[kelompok_id]) ? cacheMap[kelompok_id] : []
    if (cachedGroupRows.length > 0) {
      const byId = new Map(finalData.map((r) => [r.id, r]))
      cachedGroupRows.forEach((r) => {
        if (!byId.has(r.id)) {
          byId.set(r.id, r)
        }
      })
      finalData = Array.from(byId.values())
    }

    // Terapkan filter search & status pada hasil gabungan
    if (search) {
      const q = search.toLowerCase()
      finalData = finalData.filter(
        (r) =>
          (r.nama || '').toLowerCase().includes(q) ||
          (r.kode_anggota || '').toLowerCase().includes(q) ||
          (r.no_hp || '').toLowerCase().includes(q),
      )
    }
    if (status !== 'semua') {
      const wantActive = status === 'aktif'
      finalData = finalData.filter((r) => Boolean(r.status) === wantActive)
    }

    finalCount = Math.max(finalCount, finalData.length)
  }

  return {
    data: finalData.map(enrichRowWithSkema),
    count: finalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(finalCount / pageSize)),
  }
}

export async function getAnggotaById(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
  if (!error && data) return enrichRowWithSkema(data)

  // Fallback dari cache kelompok jika diakses oleh sesama anggota kelompok
  const map = loadMembersCacheMap()
  for (const klpId of Object.keys(map)) {
    const found = (map[klpId] || []).find((m) => m.id === id)
    if (found) return enrichRowWithSkema(found)
  }

  if (error) throw error
  return null
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
  return enrichRowWithSkema(data)
}

export async function getAllAnggotaForSelect() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, nama, kode_anggota, kelompok_id, tabungan(saldo, target)')
    .eq('status', true)
    .order('nama', { ascending: true })
  if (error) throw error
  return (data || []).map(enrichRowWithSkema)
}

export async function createAnggota(payload) {
  let targetDana = 0
  let instansiId = payload.instansi_id || null
  const { periode_setoran = 'bulanan', lama_tabungan = 12, ...basePayload } = payload || {}

  if (basePayload.kelompok_id) {
    const { data: klp } = await supabase
      .from('kelompok')
      .select('instansi_id, target_dana, maksimal_anggota, jenis_qurban')
      .eq('id', basePayload.kelompok_id)
      .maybeSingle()

    if (klp) {
      instansiId = instansiId || klp.instansi_id
      const totalKelompok = Number(klp.target_dana || 0)
      const kuota = Number(klp.maksimal_anggota || (klp.jenis_qurban === 'kambing' ? 1 : 7))
      targetDana = kuota > 1 && totalKelompok >= 7000000 ? Math.ceil(totalKelompok / kuota) : totalKelompok
    }
  }

  const finalPayload = {
    ...basePayload,
    ...(instansiId ? { instansi_id: instansiId } : {}),
  }

  const { data, error } = await supabase.from(TABLE).insert(finalPayload).select().single()
  if (error) throw error

  saveLocalSkema(data.id, { periode_setoran, lama_tabungan })

  // Coba simpan periode_setoran & lama_tabungan ke database jika kolom sudah ada
  await supabase
    .from(TABLE)
    .update({ periode_setoran, lama_tabungan: Number(lama_tabungan) || 12 })
    .eq('id', data.id)
    .then(() => {})

  // Setiap anggota baru otomatis mendapat rekening tabungan sesuai kelompoknya
  const { data: tabRow } = await supabase
    .from('tabungan')
    .insert({
      anggota_id: data.id,
      instansi_id: data.instansi_id || instansiId,
      kelompok_id: data.kelompok_id || basePayload.kelompok_id,
      saldo: 0,
      target: targetDana,
    })
    .select()
    .maybeSingle()

  if (tabRow?.id) {
    await supabase
      .from('tabungan')
      .update({ periode_setoran, lama_tabungan: Number(lama_tabungan) || 12 })
      .eq('id', tabRow.id)
      .then(() => {})
  }

  const enriched = enrichRowWithSkema({
    ...data,
    periode_setoran,
    lama_tabungan: Number(lama_tabungan) || 12,
  })

  syncKelompokMembersCache([
    {
      ...enriched,
      tabungan: [{ saldo: 0, target: targetDana, periode_setoran, lama_tabungan: Number(lama_tabungan) || 12 }],
    },
  ])

  return enriched
}

export async function updateAnggota(id, payload) {
  const { periode_setoran, lama_tabungan, ...basePayload } = payload || {}
  if (periode_setoran || lama_tabungan) {
    saveLocalSkema(id, { periode_setoran, lama_tabungan })
  }

  const { data, error } = await supabase.from(TABLE).update(basePayload).eq('id', id).select().single()
  if (error) throw error

  if (periode_setoran || lama_tabungan) {
    const skemaUpdate = {
      ...(periode_setoran ? { periode_setoran } : {}),
      ...(lama_tabungan ? { lama_tabungan: Number(lama_tabungan) } : {}),
    }
    await supabase.from(TABLE).update(skemaUpdate).eq('id', id).then(() => {})
    await supabase.from('tabungan').update(skemaUpdate).eq('anggota_id', id).then(() => {})
  }

  const enriched = enrichRowWithSkema({
    ...data,
    ...(periode_setoran ? { periode_setoran } : {}),
    ...(lama_tabungan ? { lama_tabungan: Number(lama_tabungan) } : {}),
  })
  if (enriched) syncKelompokMembersCache([enriched])
  return enriched
}

export async function deleteAnggota(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
  removeMemberFromCache(id)
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

  const columns = ['Kode Anggota', 'Nama', 'Instansi', 'Kelompok', 'No HP', 'Jenis Kelamin', 'Tanggal Bergabung', 'Status']
  const headerRow = sheet.addRow(columns)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
  })

  anggotaList.forEach((a) => {
    sheet.addRow([
      a.kode_anggota,
      a.nama,
      a.instansi?.nama_instansi || '-',
      a.kelompok?.nama_kelompok || '-',
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
