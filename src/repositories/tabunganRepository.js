import { supabase } from '../api/supabaseClient'

const TABLE = 'tabungan'
const SKEMA_STORAGE_KEY = 'siqurban_skema_tabungan_map_v1'

export function getLocalSkemaMap() {
  try {
    const raw = localStorage.getItem(SKEMA_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveLocalSkema(anggotaId, { periode_setoran, lama_tabungan } = {}) {
  if (!anggotaId) return
  try {
    const map = getLocalSkemaMap()
    map[anggotaId] = {
      periode_setoran: periode_setoran === 'mingguan' ? 'mingguan' : 'bulanan',
      lama_tabungan: Math.max(1, Number(lama_tabungan) || 12),
    }
    localStorage.setItem(SKEMA_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

export function enrichRowWithSkema(row) {
  if (!row) return row
  const map = getLocalSkemaMap()
  const anggotaId = row.anggota_id || row.anggota?.id || row.id
  const saved = anggotaId ? map[anggotaId] : null

  const periode_setoran =
    row.periode_setoran ||
    row.anggota?.periode_setoran ||
    saved?.periode_setoran ||
    'bulanan'

  const lama_tabungan = Number(
    row.lama_tabungan ||
      row.anggota?.lama_tabungan ||
      saved?.lama_tabungan ||
      12,
  )

  return {
    ...row,
    periode_setoran,
    lama_tabungan,
    ...(row.anggota
      ? {
          anggota: {
            ...row.anggota,
            periode_setoran,
            lama_tabungan,
          },
        }
      : {}),
  }
}

export async function getTabunganList() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, anggota:anggota_id (id, nama, kode_anggota, no_hp, tanggal_bergabung, foto, status)')
    .order('saldo', { ascending: false })
  if (error) throw error
  return (data || []).map(enrichRowWithSkema)
}

export async function getTabunganByAnggota(anggotaId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('anggota_id', anggotaId)
    .maybeSingle()
  if (error) throw error
  return enrichRowWithSkema(data)
}

export async function updateTargetTabungan(id, target, extra = {}) {
  const { anggota_id, periode_setoran, lama_tabungan } = extra || {}

  if (anggota_id && (periode_setoran || lama_tabungan)) {
    saveLocalSkema(anggota_id, { periode_setoran, lama_tabungan })
  }

  // Coba update lengkap termasuk kolom skema (jika migrasi SQL sudah dijalankan)
  if (periode_setoran || lama_tabungan) {
    const fullPayload = {
      target,
      ...(periode_setoran ? { periode_setoran } : {}),
      ...(lama_tabungan ? { lama_tabungan: Number(lama_tabungan) } : {}),
    }
    const { data: fullData, error: fullErr } = await supabase
      .from(TABLE)
      .update(fullPayload)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (!fullErr && fullData) {
      if (anggota_id) {
        await supabase
          .from('anggota')
          .update({
            ...(periode_setoran ? { periode_setoran } : {}),
            ...(lama_tabungan ? { lama_tabungan: Number(lama_tabungan) } : {}),
          })
          .eq('id', anggota_id)
          .then(() => {})
      }
      return enrichRowWithSkema(fullData)
    }
  }

  // Fallback jika kolom baru belum dimigrasi di database
  const { data, error } = await supabase
    .from(TABLE)
    .update({ target })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return enrichRowWithSkema({
    ...data,
    ...(anggota_id ? { anggota_id } : {}),
    ...(periode_setoran ? { periode_setoran } : {}),
    ...(lama_tabungan ? { lama_tabungan: Number(lama_tabungan) } : {}),
  })
}

export async function updateStatusTabungan(id, status) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return enrichRowWithSkema(data)
}
