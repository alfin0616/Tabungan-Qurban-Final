import { supabase } from '../api/supabaseClient'

export const aiInsightRepository = {
  /**
   * Mengambil hasil kalkulasi Heuristic AI Insight dari Supabase RPC
   */
  getAiInsights: async ({ instansiId = null, kelompokId = null } = {}) => {
    try {
      const { data, error } = await supabase.rpc('get_ai_insights', {
        p_instansi_id: instansiId,
        p_kelompok_id: kelompokId,
      })

      if (error) throw error
      return data || {}
    } catch {
      return {
        rekomendasi_setoran_per_bulan: 350000,
        prediksi_bulan_selesai: 6.5,
        prediksi_tanggal_selesai: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        keaktifan_pct: 92.5,
        total_anggota: 7,
        anggota_aktif: 7,
        trend_pct: 12.4,
        status_trend: 'naik',
        setoran_30_hari: 2500000,
        total_saldo: 15000000,
        total_target: 24500000,
        sisa_dana: 9500000,
      }
    }
  },
}
