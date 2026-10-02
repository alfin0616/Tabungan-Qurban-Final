import { supabase } from '../api/supabaseClient'

const TABLE = 'pengaturan'
const SYSTEM_TABLE = 'system_settings'

export async function getSettings() {
  try {
    const { data, error } = await supabase.rpc('get_system_settings')
    if (!error && data) return data
  } catch (err) {
    console.warn('RPC get_system_settings fallback to table:', err.message)
  }

  const { data, error } = await supabase.from(SYSTEM_TABLE).select('*').eq('id', 1).maybeSingle()
  if (!error && data) return data

  const { data: legacyData } = await supabase.from(TABLE).select('*').limit(1).maybeSingle()
  return legacyData
}

export async function updateSettings(payload) {
  try {
    const { data, error } = await supabase.rpc('update_system_settings', {
      p_settings: payload,
    })
    if (!error) return data
  } catch (err) {
    console.warn('RPC update_system_settings fallback to direct upsert:', err.message)
  }

  const { data, error } = await supabase
    .from(SYSTEM_TABLE)
    .upsert({ ...payload, id: 1, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadLogo(file) {
  const ext = file.name.split('.').pop()
  const path = `logo/masjid-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('pengaturan').upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('pengaturan').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadFavicon(file) {
  const ext = file.name.split('.').pop()
  const path = `favicon/favicon-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('pengaturan').upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('pengaturan').getPublicUrl(path)
  return data.publicUrl
}

export const settingsRepository = {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadFavicon,
}
