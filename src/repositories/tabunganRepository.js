import { supabase } from '../api/supabaseClient'
import { resolveEffectiveTarget } from '../utils/formatCurrency'

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

export function saveLocalSkema(anggotaId, { periode_setoran, lama_tabungan, explicit = true } = {}) {
  if (!anggotaId) return
  try {
    const map = getLocalSkemaMap()
    const prev = map[anggotaId] || {}
    map[anggotaId] = {
      periode_setoran:
        periode_setoran === 'mingguan'
          ? 'mingguan'
          : periode_setoran === 'bulanan'
            ? 'bulanan'
            : prev.periode_setoran || 'bulanan',
      lama_tabungan: Math.max(1, Number(lama_tabungan || prev.lama_tabungan) || 10),
      explicit: Boolean(explicit || prev.explicit),
      updatedAt: Date.now(),
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
  // 1. Jika user telah menyimpan pilihan skema secara eksplisit (saved.explicit), jaga pilihan tersebut
  //    agar tidak tertimpa nilai default database (misal jika kolom DB belum di-migrate atau terkena RLS).
  // 2. Data tabungan langsung
  // 3. Data anggota langsung
  // 4. Data di localSkemaMap
  // 5. Default standar Qurban: bulanan & 10 bulan (misal target 4jt -> 400rb/bulan atau 100rb/minggu)
  const periode_setoran =
    (saved?.explicit ? saved.periode_setoran : null) ||
    tbRow?.periode_setoran ||
    row.periode_setoran ||
    row.anggota?.periode_setoran ||
    saved?.periode_setoran ||
    'bulanan'

  const lama_tabungan = Number(
    (saved?.explicit ? saved.lama_tabungan : null) ||
      tbRow?.lama_tabungan ||
      row.lama_tabungan ||
      row.anggota?.lama_tabungan ||
      saved?.lama_tabungan ||
      10,
  )

  const resolvedTarget = resolveEffectiveTarget(row, Number(row.target ?? tbRow?.target ?? 0))

  const enrichedTb = tbRow
    ? {
        ...tbRow,
        target: Number(tbRow.target) > 0 ? Number(tbRow.target) : resolvedTarget,
        periode_setoran,
        lama_tabungan,
      }
    : null

  return {
    ...row,
    ...(row.target !== undefined
      ? { target: Number(row.target) > 0 ? Number(row.target) : resolvedTarget }
      : {}),
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
      '*, anggota:anggota_id (*, kelompok:kelompok_id (id, nama_kelompok, target_dana, jenis_qurban, maksimal_anggota))',
    )
    .order('saldo', { ascending: false })
  if (error) throw error

  const localMap = getLocalSkemaMap()
  ;(data || []).forEach((rawRow) => {
    const aid = rawRow.anggota_id || rawRow.anggota?.id
    const dbPeriode = rawRow.periode_setoran || rawRow.anggota?.periode_setoran
    const dbLama = rawRow.lama_tabungan || rawRow.anggota?.lama_tabungan
    if (aid && (dbPeriode || dbLama) && !localMap[aid]?.explicit) {
      saveLocalSkema(aid, {
        periode_setoran: dbPeriode || 'bulanan',
        lama_tabungan: dbLama || 10,
        explicit: false,
      })
    }
  })

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
