import { supabase } from '../api/supabaseClient'

const TABLE = 'admin_profiles'

export async function updateProfile(userId, payload) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadAvatar(file, userId) {
  const ext = file.name.split('.').pop()
  const path = `avatar/${userId}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
