import { supabase } from '../api/supabaseClient'

export const monitoringRepository = {
  /**
   * Mengukur latensi koneksi ke database Supabase (dalam milidetik)
   */
  pingDatabase: async () => {
    const start = performance.now()
    try {
      const { error } = await supabase.from('instansi').select('id').limit(1)
      const end = performance.now()
      if (error) throw error
      return Math.round(end - start)
    } catch {
      return -1 // error/offline
    }
  },

  /**
   * Mengambil metrik kesehatan sistem dari RPC get_system_health_metrics
   */
  getHealthMetrics: async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_health_metrics')
      if (error) throw error
      return data
    } catch {
      // Fallback manual query jika RPC belum di-apply
      const [instansiRes, anggotaRes, transaksiRes, tabunganRes] = await Promise.all([
        supabase.from('instansi').select('id', { count: 'exact', head: true }),
        supabase.from('anggota').select('id', { count: 'exact', head: true }),
        supabase.from('transaksi').select('id', { count: 'exact', head: true }),
        supabase.from('tabungan').select('saldo'),
      ])

      const totalSaldo = (tabunganRes.data || []).reduce((acc, curr) => acc + Number(curr.saldo || 0), 0)

      return {
        status: 'healthy',
        total_instansi: instansiRes.count || 0,
        total_anggota: anggotaRes.count || 0,
        total_transaksi: transaksiRes.count || 0,
        total_saldo: totalSaldo,
        active_users_24h: 1,
        server_time: new Date().toISOString(),
      }
    }
  },

  /**
   * Streaming / log aktivitas terbaru dari audit_logs
   */
  getRecentActivities: async (limit = 15) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch {
      return []
    }
  },

  /**
   * Mengambil kesehatan per instansi (jumlah anggota, saldo, & status)
   */
  getInstansiHealthList: async () => {
    try {
      const { data, error } = await supabase
        .from('instansi')
        .select('id, nama, kode_instansi, status, created_at')
        .order('nama', { ascending: true })

      if (error) throw error
      return data || []
    } catch {
      return []
    }
  },
}
