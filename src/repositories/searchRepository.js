import { supabase } from '../api/supabaseClient'

/**
 * Melakukan pencarian global cerdas (Smart Search) lintas modul.
 * Filter kategori: 'all', 'instansi', 'kelompok', 'jamaah', 'transaksi', 'laporan', 'notifikasi'
 */
export async function performGlobalSearch({ query, category = 'all', page = 1, limit = 10 }) {
  if (!query || !query.trim()) {
    return {
      instansi: [],
      kelompok: [],
      jamaah: [],
      transaksi: [],
      laporan: [],
      notifikasi: [],
      total_count: 0,
      page,
      limit,
    }
  }

  const { data, error } = await supabase.rpc('global_smart_search', {
    p_query: query.trim(),
    p_category: category,
    p_page: page,
    p_limit: limit,
  })

  if (error) throw error
  return data
}
