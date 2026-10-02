import { supabase } from '../api/supabaseClient'

export const ACTION_CATEGORIES = [
  { id: 'semua', label: 'Semua Kategori', color: 'slate' },
  {
    id: 'auth',
    label: 'Autentikasi (Login/Logout)',
    color: 'blue',
    actions: ['LOGIN', 'LOGOUT', 'REGISTER_JAMAAH'],
  },
  {
    id: 'crud',
    label: 'Data Master (Tambah/Edit/Delete)',
    color: 'amber',
    actions: [
      'TAMBAH_ANGGOTA',
      'EDIT_ANGGOTA',
      'DELETE_ANGGOTA',
      'TAMBAH_PENGELUARAN',
      'DELETE_PENGELUARAN',
      'TAMBAH_INSTANSI',
      'EDIT_INSTANSI',
      'DELETE_INSTANSI',
    ],
  },
  {
    id: 'payment',
    label: 'Keuangan & Payment',
    color: 'emerald',
    actions: ['SETORAN', 'PENARIKAN', 'HAPUS_TRANSAKSI', 'PAYMENT'],
  },
  {
    id: 'export_import',
    label: 'Export & Import Data',
    color: 'indigo',
    actions: [
      'EXPORT',
      'IMPORT',
      'IMPORT_ANGGOTA',
      'BACKUP_EXCEL',
      'BACKUP_JSON',
      'BACKUP_CSV',
      'RESTORE',
    ],
  },
  {
    id: 'system',
    label: 'Perubahan Peran & Sistem',
    color: 'purple',
    actions: ['ROLE_CHANGE', 'SYSTEM_CHANGE', 'EDIT_SETTINGS', 'DELETE_FILE'],
  },
]

/**
 * Helper untuk menentukan kategori dan tone warna berdasarkan nama action.
 */
export function getCategoryInfoForAction(action) {
  const upper = (action || '').toUpperCase()
  for (const cat of ACTION_CATEGORIES) {
    if (cat.id === 'semua') continue
    if (cat.actions?.includes(upper)) {
      return { category: cat.id, label: cat.label, color: cat.color }
    }
  }
  return { category: 'other', label: 'Lainnya', color: 'slate' }
}

export const auditRepository = {
  /**
   * Mencatat aktivitas pengguna ke tabel audit_logs via RPC
   * @param {string} action - Nama aksi (contoh: 'LOGIN', 'TAMBAH_INSTANSI')
   * @param {string} description - Deskripsi aksi
   */
  log: async (action, description) => {
    try {
      const { error } = await supabase.rpc('log_audit_event', {
        p_action: action,
        p_description: description,
      })

      if (error) {
        console.error('Audit Log Error:', error)
      }
    } catch (err) {
      console.error('Audit Log Exception:', err)
    }
  },

  /**
   * Mengambil data log aktivitas lengkap dengan filtering, pencarian, dan paginasi.
   */
  getLogs: async ({
    page = 1,
    limit = 20,
    category = 'semua',
    search = '',
    startDate,
    endDate,
  } = {}) => {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('audit_logs')
      .select(
        `
        id,
        created_at,
        role,
        ip_address,
        user_agent,
        action,
        description,
        user_id,
        instansi (
          nama_instansi
        )
      `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })

    // Filter kategori action
    if (category && category !== 'semua') {
      const catObj = ACTION_CATEGORIES.find((c) => c.id === category)
      if (catObj && catObj.actions?.length) {
        query = query.in('action', catObj.actions)
      }
    }

    // Filter rentang tanggal
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59.999Z`)
    }

    // Filter teks pencarian (search)
    if (search) {
      query = query.or(`action.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range(from, to)
    if (error) {
      console.error('Supabase query error in getLogs:', error)
      throw error
    }

    // Fetch user profiles manually to bypass PostgREST schema cache/FK issues
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((d) => d.user_id).filter(Boolean))]
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('admin_profiles')
          .select('id, full_name')
          .in('id', userIds)

        if (profiles) {
          const profileMap = {}
          profiles.forEach((p) => {
            profileMap[p.id] = p
          })
          data.forEach((d) => {
            if (d.user_id && profileMap[d.user_id]) {
              d.user = profileMap[d.user_id]
            }
          })
        }
      }
    }

    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Ambil ringkasan statistik log (Total, Hari Ini, Payment, System/Role Change).
   */
  getStats: async () => {
    const todayStr = new Date().toISOString().slice(0, 10)

    const [allRes, todayRes, paymentRes, sysRes] = await Promise.all([
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
      supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${todayStr}T00:00:00.000Z`),
      supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .in('action', ['SETORAN', 'PENARIKAN', 'HAPUS_TRANSAKSI', 'PAYMENT']),
      supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .in('action', ['ROLE_CHANGE', 'SYSTEM_CHANGE', 'EDIT_SETTINGS', 'DELETE_FILE']),
    ])

    return {
      totalLogs: allRes.count ?? 0,
      todayLogs: todayRes.count ?? 0,
      paymentLogs: paymentRes.count ?? 0,
      systemLogs: sysRes.count ?? 0,
    }
  },
}
