import { supabase } from '../api/supabaseClient'

const TABLE = 'instansi'

export async function getInstansiList({ search = '', page = 1, pageSize = 10 } = {}) {
  let query = supabase.from(TABLE).select('*, kode_registrasi', { count: 'exact' }).order('created_at', { ascending: false })

  if (search) {
    query = query.or(`nama_instansi.ilike.%${search}%,kode_instansi.ilike.%${search}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { data, count: count ?? 0, page, pageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) }
}

export async function getAllInstansiForSelect() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, nama_instansi, kode_instansi, tahun_qurban_aktif')
    .eq('status', true)
    .order('nama_instansi', { ascending: true })
  if (error) throw error
  return data
}

export async function createInstansi(payload) {
  // Generate random 8-char uppercase string for registration code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomCode = 'QURBAN-'
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  const finalPayload = {
    ...payload,
    kode_registrasi: randomCode
  }

  const { data, error } = await supabase.from(TABLE).insert(finalPayload).select().single()
  if (error) throw error
  return data
}

export async function updateInstansi(id, payload) {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteInstansi(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function claimInstansiAccount(kodeRegistrasi) {
  const { data, error } = await supabase.rpc('claim_instansi_account', {
    p_kode_registrasi: kodeRegistrasi
  })
  if (error) throw error
  return data
}
