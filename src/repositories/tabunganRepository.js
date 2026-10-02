import { supabase } from '../api/supabaseClient'

const TABLE = 'tabungan'

export async function getTabunganList() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, anggota:anggota_id (id, nama, kode_anggota, foto, status)')
    .order('saldo', { ascending: false })
  if (error) throw error
  return data
}

export async function getTabunganByAnggota(anggotaId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('anggota_id', anggotaId)
    .single()
  if (error) throw error
  return data
}

export async function updateTargetTabungan(id, target) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ target })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateStatusTabungan(id, status) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
