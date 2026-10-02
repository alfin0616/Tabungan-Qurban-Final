import { supabase } from '../api/supabaseClient'

const TABLE = 'kelompok'

export async function getKelompokList({ search = '', instansi_id = null, page = 1, pageSize = 10 } = {}) {
  let query = supabase
    .from(TABLE)
    .select('*, instansi:instansi_id(nama_instansi)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`nama_kelompok.ilike.%${search}%,kode_kelompok.ilike.%${search}%`)
  }
  if (instansi_id) {
    query = query.eq('instansi_id', instansi_id)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { data, count: count ?? 0, page, pageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) }
}

export async function getAllKelompokForSelect(instansi_id) {
  let query = supabase
    .from(TABLE)
    .select('id, nama_kelompok, kode_kelompok, target_dana, maksimal_anggota')
    .eq('status', true)
    .order('nama_kelompok', { ascending: true })
    
  if (instansi_id) {
    query = query.eq('instansi_id', instansi_id)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createKelompok(payload) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateKelompok(id, payload) {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteKelompok(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
