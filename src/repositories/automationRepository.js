import { supabase } from '../api/supabaseClient'

export const automationRepository = {
  /**
   * Jalankan Master Scheduled Tasks Runner (Pembersihan, Reminder, Backup Log)
   */
  runScheduledTasks: async () => {
    try {
      const { data, error } = await supabase.rpc('auto_run_scheduled_tasks')
      if (error) throw error
      return data
    } catch (err) {
      throw new Error(err.message || 'Gagal menjalankan scheduler otomatis')
    }
  },

  /**
   * Jalankan pembersihan log tua berdasarkan retensi hari
   */
  cleanupOldLogs: async (retentionDays = 30) => {
    try {
      const { data, error } = await supabase.rpc('auto_cleanup_old_logs', {
        p_retention_days: retentionDays,
      })
      if (error) throw error
      return data
    } catch (err) {
      throw new Error(err.message || 'Gagal membersihkan log tua')
    }
  },

  /**
   * Jalankan pengingat setoran bulanan otomatis
   */
  triggerMonthlyReminders: async () => {
    try {
      const { data, error } = await supabase.rpc('auto_trigger_monthly_reminders')
      if (error) throw error
      return data
    } catch (err) {
      throw new Error(err.message || 'Gagal mengirim pengingat otomatis')
    }
  },

  /**
   * Kirim Pengingat beserta WhatsApp
   */
  triggerMonthlyRemindersWithWA: async () => {
    try {
      const { data, error } = await supabase.rpc('auto_trigger_monthly_reminders')
      if (error) throw error

      // Ambil daftar anggota yang belum setor bulan ini
      // Logika sederhana: ambil semua anggota, cek transaksi
      const { data: anggotaList } = await supabase
        .from('anggota')
        .select(`
          id, nama, no_hp,
          kelompok:kelompok_id (nama_kelompok)
        `)
        .eq('status', true)
        .is('deleted_at', null)

      let waCount = 0;
      if (anggotaList && anggotaList.length > 0) {
        const { messagingRepository } = await import('./messagingRepository')
        
        for (const anggota of anggotaList) {
          if (!anggota.no_hp) continue;
          
          // Cek apakah ada setoran 30 hari terakhir
          const { data: setoran } = await supabase
            .from('transaksi')
            .select('id')
            .eq('anggota_id', anggota.id)
            .eq('jenis', 'setoran')
            .is('deleted_at', null)
            .gte('tanggal', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .limit(1)

          if (!setoran || setoran.length === 0) {
            // Berarti nunggak, kirim WA
            await messagingRepository.sendMonthlyReminder({
              phone: anggota.no_hp,
              nama: anggota.nama,
              namaKelompok: anggota.kelompok?.nama_kelompok || '-',
              sisaBulan: 5,
              saldoSaatIni: 0,
              targetDana: 0
            })
            waCount++;
          }
        }
      }

      return { ...data, wa_sent: waCount }
    } catch (err) {
      throw new Error(err.message || 'Gagal mengirim pengingat WA otomatis')
    }
  },

  /**
   * Buat snapshot backup otomatis
   */
  triggerAutoBackup: async () => {
    try {
      const { data, error } = await supabase.rpc('auto_backup_database_trigger')
      if (error) throw error
      return data
    } catch (err) {
      throw new Error(err.message || 'Gagal memicu backup otomatis')
    }
  },

  /**
   * Ubah status Maintenance Mode
   */
  toggleMaintenanceMode: async (enabled, message = null) => {
    try {
      const { data, error } = await supabase.rpc('toggle_maintenance_mode', {
        p_enabled: enabled,
        p_message: message,
      })
      if (error) throw error
      return data
    } catch (err) {
      throw new Error(err.message || 'Gagal mengubah status maintenance mode')
    }
  },

  /**
   * Ambil status saat ini untuk Maintenance Mode
   */
  getMaintenanceStatus: async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_message'])

      const settings = {}
      data?.forEach((row) => {
        settings[row.key] = row.value
      })

      return {
        enabled: settings.maintenance_mode === 'true',
        message: settings.maintenance_message || 'Sistem dalam pemeliharaan.',
      }
    } catch {
      return { enabled: false, message: '' }
    }
  },
}
