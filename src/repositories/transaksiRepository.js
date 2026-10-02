import { supabase } from '../api/supabaseClient'

const TABLE = 'transaksi'

export async function createSetoran({ tanggal, anggota_id, nominal, metode_pembayaran, keterangan, bukti }) {
  // Menggunakan RPC agar insert transaksi + update saldo tabungan berjalan atomik
  const { data, error } = await supabase.rpc('catat_setoran', {
    p_tanggal: tanggal,
    p_anggota_id: anggota_id,
    p_nominal: nominal,
    p_metode_pembayaran: metode_pembayaran,
    p_keterangan: keterangan ?? null,
    p_bukti: bukti ?? null,
  })
  if (error) throw error
  return data
}

export async function createPenarikan({ tanggal, anggota_id, nominal, keterangan, bukti }) {
  const { data, error } = await supabase.rpc('catat_penarikan', {
    p_tanggal: tanggal,
    p_anggota_id: anggota_id,
    p_nominal: nominal,
    p_keterangan: keterangan,
    p_bukti: bukti ?? null,
  })
  if (error) throw error
  return data
}

export async function uploadBuktiTransaksi(file) {
  const ext = file.name.split('.').pop()
  const path = `transaksi/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('bukti-transaksi').upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('bukti-transaksi').getPublicUrl(path)
  return data.publicUrl
}

export async function getRiwayatTransaksi({
  tanggalMulai,
  tanggalAkhir,
  anggotaId,
  jenis = 'semua',
} = {}) {
  let query = supabase
    .from(TABLE)
    .select('*, anggota:anggota_id (id, nama, kode_anggota)')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })

  if (tanggalMulai) query = query.gte('tanggal', tanggalMulai)
  if (tanggalAkhir) query = query.lte('tanggal', tanggalAkhir)
  if (anggotaId) query = query.eq('anggota_id', anggotaId)
  if (jenis !== 'semua') query = query.eq('jenis', jenis)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTransaksiBulanIni() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .gte('tanggal', start)
    .lte('tanggal', end)
  if (error) throw error
  return data
}

export async function deleteTransaksi(id) {
  const { error } = await supabase.rpc('hapus_transaksi', { p_transaksi_id: id })
  if (error) throw error
}

export async function getAnggotaBelumSetorBulanIni() {
  const { data, error } = await supabase.rpc('anggota_belum_setor_bulan_ini')
  if (error) throw error
  return data
}
