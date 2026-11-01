import { supabase } from '../api/supabaseClient'

const TABLE = 'instansi'
const PENGATURAN_TABLE = 'pengaturan'
const LOCAL_REK_KEY = 'siqurban_instansi_rekening_map'

function getLocalRekeningMap() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REK_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveLocalRekening(instansiId, info) {
  if (!instansiId) return
  try {
    const map = getLocalRekeningMap()
    map[instansiId] = info
    localStorage.setItem(LOCAL_REK_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

export function formatRekeningString({ nama_bank = '', nomor_rekening = '', atas_nama_rekening = '', rekening = '' } = {}) {
  const bank = (nama_bank || '').trim()
  const norek = (nomor_rekening || '').trim()
  const an = (atas_nama_rekening || '').trim()

  if (bank || norek || an) {
    return `${bank} | ${norek} | ${an}`
  }
  return (rekening || '').trim()
}

export function formatRekeningDisplay(instansi) {
  if (!instansi) return ''
  const bank = (instansi.nama_bank || '').trim()
  const norek = (instansi.nomor_rekening || '').trim()
  const an = (instansi.atas_nama_rekening || '').trim()

  if (norek) {
    const parts = []
    if (bank) parts.push(bank)
    parts.push(norek)
    if (an) parts.push(`a.n. ${an}`)
    return parts.join(' • ')
  }
  return (instansi.rekening || '').trim()
}

export function enrichInstansiWithRekening(instansi, pengaturanMap = {}) {
  if (!instansi) return instansi
  const localMap = getLocalRekeningMap()
  const localInfo = localMap[instansi.id] || {}
  const pengRow = pengaturanMap[instansi.id] || null

  let nama_bank = instansi.nama_bank || ''
  let nomor_rekening = instansi.nomor_rekening || ''
  let atas_nama_rekening = instansi.atas_nama_rekening || ''
  let rekening = instansi.rekening || ''

  const rawRek = rekening || pengRow?.rekening || ''
  if ((!nama_bank && !nomor_rekening) && rawRek) {
    if (rawRek.includes('|')) {
      const [b = '', n = '', a = ''] = rawRek.split('|').map((s) => s.trim())
      nama_bank = b
      nomor_rekening = n
      atas_nama_rekening = a
    } else {
      nomor_rekening = rawRek
    }
  }

  if (!nama_bank && localInfo.nama_bank) nama_bank = localInfo.nama_bank
  if (!nomor_rekening && localInfo.nomor_rekening) nomor_rekening = localInfo.nomor_rekening
  if (!atas_nama_rekening && localInfo.atas_nama_rekening) atas_nama_rekening = localInfo.atas_nama_rekening

  const displayRekening = formatRekeningDisplay({
    nama_bank,
    nomor_rekening,
    atas_nama_rekening,
    rekening: rawRek || localInfo.rekening || '',
  })

  return {
    ...instansi,
    nama_bank,
    nomor_rekening,
    atas_nama_rekening,
    rekening: displayRekening,
  }
}

async function fetchPengaturanMap(instansiIds = []) {
  try {
    let query = supabase.from(PENGATURAN_TABLE).select('id, nama_instansi, rekening, alamat, telepon, logo')
    if (instansiIds.length > 0) {
      query = query.in('id', instansiIds)
    }
    const { data } = await query
    const map = {}
    ;(data || []).forEach((row) => {
      if (row?.id) map[row.id] = row
    })
    return map
  } catch {
    return {}
  }
}

async function syncRekeningToPengaturan(instansiRow, rekPayload) {
  if (!instansiRow?.id) return
  const encodedRek = formatRekeningString(rekPayload)
  saveLocalRekening(instansiRow.id, {
    nama_bank: (rekPayload.nama_bank || '').trim(),
    nomor_rekening: (rekPayload.nomor_rekening || '').trim(),
    atas_nama_rekening: (rekPayload.atas_nama_rekening || '').trim(),
    rekening: encodedRek,
  })

  try {
    await supabase.from(PENGATURAN_TABLE).upsert({
      id: instansiRow.id,
      nama_instansi: instansiRow.nama_instansi || 'Masjid',
      alamat: instansiRow.alamat || '',
      telepon: instansiRow.telepon || '',
      logo: instansiRow.logo || null,
      rekening: encodedRek,
    })
  } catch {
    // ignore if RLS or table constraints prevent upsert
  }
}

export async function getInstansiById(id) {
  if (!id) return null
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const pengMap = await fetchPengaturanMap([id])
  return enrichInstansiWithRekening(data, pengMap)
}

export async function getInstansiList({ search = '', page = 1, pageSize = 10 } = {}) {
  let query = supabase.from(TABLE).select('*', { count: 'exact' }).order('created_at', { ascending: false })

  if (search) {
    query = query.or(`nama_instansi.ilike.%${search}%,kode_instansi.ilike.%${search}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  const ids = (data || []).map((d) => d.id)
  const pengMap = await fetchPengaturanMap(ids)
  const enriched = (data || []).map((item) => enrichInstansiWithRekening(item, pengMap))

  return {
    data: enriched,
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  }
}

export async function getAllInstansiForSelect() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', true)
    .order('nama_instansi', { ascending: true })
  if (error) throw error

  const ids = (data || []).map((d) => d.id)
  const pengMap = await fetchPengaturanMap(ids)
  return (data || []).map((item) => enrichInstansiWithRekening(item, pengMap))
}

export async function createInstansi(payload) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomCode = 'QURBAN-'
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  const { nama_bank, nomor_rekening, atas_nama_rekening, rekening, ...corePayload } = payload
  const rekString = formatRekeningString({ nama_bank, nomor_rekening, atas_nama_rekening, rekening })

  const fullPayload = {
    ...corePayload,
    nama_bank: nama_bank || null,
    nomor_rekening: nomor_rekening || null,
    atas_nama_rekening: atas_nama_rekening || null,
    rekening: rekString || null,
    kode_registrasi: randomCode,
  }

  let createdRow = null
  const { data, error } = await supabase.from(TABLE).insert(fullPayload).select().single()
  if (error) {
    // Fallback jika kolom nama_bank/nomor_rekening/kode_registrasi belum di-migrate di DB
    const { data: fallback1, error: err1 } = await supabase
      .from(TABLE)
      .insert({ ...corePayload, kode_registrasi: randomCode })
      .select()
      .single()

    if (err1) {
      const { data: fallback2, error: err2 } = await supabase
        .from(TABLE)
        .insert(corePayload)
        .select()
        .single()
      if (err2) throw err2
      createdRow = fallback2
    } else {
      createdRow = fallback1
    }
  } else {
    createdRow = data
  }

  await syncRekeningToPengaturan(createdRow, { nama_bank, nomor_rekening, atas_nama_rekening, rekening })
  return enrichInstansiWithRekening(createdRow, {
    [createdRow.id]: { rekening: rekString },
  })
}

export async function updateInstansi(id, payload) {
  const { nama_bank, nomor_rekening, atas_nama_rekening, rekening, ...corePayload } = payload
  const hasRekeningUpdate =
    nama_bank !== undefined ||
    nomor_rekening !== undefined ||
    atas_nama_rekening !== undefined ||
    rekening !== undefined

  const rekString = hasRekeningUpdate
    ? formatRekeningString({ nama_bank, nomor_rekening, atas_nama_rekening, rekening })
    : undefined

  const fullPayload = hasRekeningUpdate
    ? {
        ...corePayload,
        nama_bank: nama_bank ?? null,
        nomor_rekening: nomor_rekening ?? null,
        atas_nama_rekening: atas_nama_rekening ?? null,
        rekening: rekString ?? null,
      }
    : corePayload

  let updatedRow = null
  const { data, error } = await supabase.from(TABLE).update(fullPayload).eq('id', id).select().single()
  if (error) {
    // Fallback jika kolom rekening di tabel instansi belum di-migrate
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from(TABLE)
      .update(corePayload)
      .eq('id', id)
      .select()
      .single()
    if (fallbackErr) throw fallbackErr
    updatedRow = fallbackData
  } else {
    updatedRow = data
  }

  if (hasRekeningUpdate) {
    await syncRekeningToPengaturan(updatedRow, { nama_bank, nomor_rekening, atas_nama_rekening, rekening })
  }

  const pengMap = await fetchPengaturanMap([id])
  return enrichInstansiWithRekening(updatedRow, pengMap)
}

export async function deleteInstansi(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function verifyKodeInstansi(kodeInput, expectedInstansiId = null) {
  const cleanCode = (kodeInput || '').trim().toUpperCase()
  if (!cleanCode) {
    throw new Error('Wajib mencantumkan Kode Instansi resmi untuk mendaftar sebagai Admin Instansi.')
  }

  try {
    const { data: topList, error: rpcErr } = await supabase.rpc('get_top_instansi', { p_limit: 500 })
    if (!rpcErr && Array.isArray(topList) && topList.length > 0) {
      const matched = topList.find(
        (item) => (item.kode_instansi || '').trim().toUpperCase() === cleanCode,
      )
      if (matched) {
        if (expectedInstansiId && matched.instansi_id !== expectedInstansiId) {
          throw new Error('Kode Instansi tidak cocok dengan Masjid / Instansi yang Anda pilih.')
        }
        return matched.instansi_id
      }
    }
  } catch (err) {
    if (err.message?.includes('tidak cocok')) throw err
  }

  try {
    const { data: byReg } = await supabase
      .from(TABLE)
      .select('id, kode_instansi, kode_registrasi')
      .or(`kode_registrasi.ilike.${cleanCode},kode_instansi.ilike.${cleanCode}`)
      .maybeSingle()

    if (byReg?.id) {
      if (expectedInstansiId && byReg.id !== expectedInstansiId) {
        throw new Error('Kode Instansi tidak cocok dengan Masjid / Instansi yang Anda pilih.')
      }
      return byReg.id
    }
  } catch (err) {
    if (err.message?.includes('tidak cocok')) throw err
  }

  return null
}

export async function claimInstansiAccount(kodeRegistrasi, expectedInstansiId = null) {
  const cleanCode = (kodeRegistrasi || '').trim()
  if (!cleanCode) {
    throw new Error('Wajib mencantumkan Kode Instansi untuk mendaftar sebagai Admin Instansi.')
  }

  const verifiedInstansiId = await verifyKodeInstansi(cleanCode, expectedInstansiId)

  if (!verifiedInstansiId) {
    const { data: rpcClaimed, error: rpcErr } = await supabase.rpc('claim_instansi_account', {
      p_kode_registrasi: cleanCode,
    })
    if (!rpcErr && rpcClaimed) {
      return true
    }
    throw new Error(
      'Kode Instansi / Kode Registrasi tidak valid! Hubungi Super Admin untuk mendapatkan Kode Instansi resmi.',
    )
  }

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) {
    throw new Error('Sesi login tidak ditemukan. Silakan masuk terlebih dahulu.')
  }

  const { error: updateErr } = await supabase
    .from('admin_profiles')
    .update({
      role: 'admin',
      instansi_id: verifiedInstansiId,
    })
    .eq('id', userId)

  if (updateErr) throw updateErr
  return true
}
