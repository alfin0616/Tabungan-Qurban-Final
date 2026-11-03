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
  const tbRow = Array.isArray(row.tabungan) ? row.tabungan[0] : row.tabungan

  // Prioritas penentuan skema:
  // 1. Data tabungan langsung (karena user mengatur skema di menu Tabungan)
  // 2. Data anggota langsung
  // 3. Data di localSkemaMap
  // 4. Default: bulanan & 12 bulan
  const periode_setoran =
    tbRow?.periode_setoran ||
    row.periode_setoran ||
    row.anggota?.periode_setoran ||
    saved?.periode_setoran ||
    'bulanan'

  const lama_tabungan = Number(
    tbRow?.lama_tabungan ||
      row.lama_tabungan ||
      row.anggota?.lama_tabungan ||
      saved?.lama_tabungan ||
      12,
  )

  const enrichedTb = tbRow
    ? {
        ...tbRow,
        periode_setoran,
        lama_tabungan,
      }
    : null

  return {
    ...row,
    periode_setoran,
    lama_tabungan,
    ...(tbRow
      ? {
          tabungan: Array.isArray(row.tabungan) ? [enrichedTb] : enrichedTb,
        }
      : {}),
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
    .select(
      '*, anggota:anggota_id (id, nama, kode_anggota, no_hp, tanggal_bergabung, foto, status, periode_setoran, lama_tabungan, kelompok_id, kelompok:kelompok_id (id, nama_kelompok, target_dana, jenis_qurban, maksimal_anggota))',
    )
    .order('saldo', { ascending: false })
  if (error) throw error

  const mapped = (data || []).map(enrichRowWithSkema)

  // Otomatis sinkronkan local map agar menu lain (seperti Form Setoran) langsung mendapatkan skema terbaru
  mapped.forEach((t) => {
    const aid = t.anggota_id || t.anggota?.id
    if (aid && (t.periode_setoran || t.lama_tabungan)) {
      saveLocalSkema(aid, {
        periode_setoran: t.periode_setoran,
        lama_tabungan: t.lama_tabungan,
      })
    }
  })

  return mapped
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

  const numTarget = Number(target) || 0
  const fullPayload = {
    target: numTarget,
    ...(periode_setoran ? { periode_setoran } : {}),
    ...(lama_tabungan ? { lama_tabungan: Math.max(1, Number(lama_tabungan)) } : {}),
  }

  // 1. Update tabel tabungan
  const { data: fullData, error: fullErr } = await supabase
    .from(TABLE)
    .update(fullPayload)
    .eq('id', id)
    .select()
    .maybeSingle()

  // 2. Pastikan tabel anggota juga tersinkronisasi
  if (anggota_id) {
    await supabase
      .from('anggota')
      .update({
        ...(periode_setoran ? { periode_setoran } : {}),
        ...(lama_tabungan ? { lama_tabungan: Math.max(1, Number(lama_tabungan)) } : {}),
      })
      .eq('id', anggota_id)
      .then(() => {})
  }

  if (fullErr) {
    // Fallback jika kolom periode_setoran/lama_tabungan belum ada di tabel tabungan
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from(TABLE)
      .update({ target: numTarget })
      .eq('id', id)
      .select()
      .single()
    if (fallbackErr) throw fallbackErr
    return enrichRowWithSkema({
      ...fallbackData,
      anggota_id,
      ...fullPayload,
    })
  }

  return enrichRowWithSkema(fullData || { id, ...fullPayload, anggota_id })
}

/**
 * Sinkronkan target tabungan seluruh anggota di satu kelompok qurban.
 */
export async function syncTargetByKelompok(kelompokId, targetPerAnggota) {
  if (!kelompokId) return []
  const numTarget = Number(targetPerAnggota) || 0

  const { data: members, error: mErr } = await supabase
    .from('anggota')
    .select('id')
    .eq('kelompok_id', kelompokId)

  if (mErr) throw mErr
  if (!members || !members.length) return []

  const memberIds = members.map((m) => m.id)

  const { error: tErr } = await supabase
    .from(TABLE)
    .update({ target: numTarget })
    .in('anggota_id', memberIds)

  if (tErr) throw tErr
  return memberIds
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
