import { supabase } from '../api/supabaseClient'
import { syncKelompokMembersCache } from './anggotaRepository'

const TABLE = 'kelompok'

export async function getKelompokList({ search = '', instansi_id = null, page = 1, pageSize = 10 } = {}) {
  let query = supabase
    .from(TABLE)
    .select(
      '*, instansi:instansi_id(id, nama_instansi, kode_instansi), anggota(id, nama, kode_anggota, no_hp, status, tanggal_bergabung, instansi_id, kelompok_id, tabungan(saldo, target))',
      { count: 'exact' },
    )
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

  if (Array.isArray(data)) {
    const allMembers = []
    data.forEach((klp) => {
      if (Array.isArray(klp.anggota)) {
        klp.anggota.forEach((m) => {
          allMembers.push({
            ...m,
            instansi_id: m.instansi_id || klp.instansi_id,
            kelompok_id: m.kelompok_id || klp.id,
            instansi: klp.instansi || null,
            kelompok: {
              id: klp.id,
              nama_kelompok: klp.nama_kelompok,
              kode_kelompok: klp.kode_kelompok,
              jenis_qurban: klp.jenis_qurban,
              target_dana: klp.target_dana,
              maksimal_anggota: klp.maksimal_anggota,
            },
          })
        })
      }
    })
    if (allMembers.length) {
      syncKelompokMembersCache(allMembers)
    }
  }

  return { data, count: count ?? 0, page, pageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) }
}

export async function getAllKelompokForSelect(instansi_id) {
  let query = supabase
    .from(TABLE)
    .select('id, instansi_id, nama_kelompok, kode_kelompok, jenis_qurban, target_dana, maksimal_anggota')
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

export async function updateKelompok(id, payload, syncMembersTarget = false) {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single()
  if (error) throw error

  if (syncMembersTarget && data?.target_dana) {
    const max = Number(data.maksimal_anggota || (data.jenis_qurban === 'kambing' ? 1 : 7))
    const targetPerAnggota = max > 0 ? Math.round(Number(data.target_dana) / max) : Number(data.target_dana)
    try {
      const { syncTargetByKelompok } = await import('./tabunganRepository')
      await syncTargetByKelompok(id, targetPerAnggota)
    } catch (e) {
      console.warn('Gagal sinkronkan target anggota kelompok:', e)
    }
  }

  return data
}

export async function deleteKelompok(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
