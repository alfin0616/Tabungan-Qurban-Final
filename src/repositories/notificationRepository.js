import { supabase } from '../api/supabaseClient'

export const NOTIFICATION_TYPES = {
  PEMBAYARAN_BERHASIL: 'pembayaran_berhasil',
  PEMBAYARAN_PENDING: 'pembayaran_pending',
  PEMBAYARAN_GAGAL: 'pembayaran_gagal',
  TARGET_HAMPIR_TERCAPAI: 'target_hampir_tercapai',
  TARGET_TERCAPAI: 'target_tercapai',
  KELOMPOK_HAMPIR_PENUH: 'kelompok_hampir_penuh',
  KELOMPOK_SUDAH_PENUH: 'kelompok_sudah_penuh',
  REMINDER_SETORAN: 'reminder_setoran',
  MAINTENANCE: 'maintenance',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
}

export const notificationRepository = {
  /**
   * Mengambil daftar notifikasi terbaru
   */
  getNotifications: async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
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
   * Hitung jumlah notifikasi yang belum dibaca
   */
  getUnreadCount: async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('read', false)

      if (error) throw error
      return count || 0
    } catch {
      return 0
    }
  },

  /**
   * Tandai 1 notifikasi sebagai sudah dibaca
   */
  markAsRead: async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error
    } catch {
      // Ignore
    }
  },

  /**
   * Tandai semua notifikasi sebagai sudah dibaca
   */
  markAllAsRead: async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false)

      if (error) throw error
    } catch {
      // Ignore
    }
  },

  /**
   * Buat notifikasi baru secara manual dengan jenis_notifikasi
   */
  createNotification: async ({ title, message, jenisNotifikasi = 'system_announcement', link = null, instansiId = null, userId = null }) => {
    try {
      const { error } = await supabase.from('notifications').insert({
        title,
        message,
        jenis_notifikasi: jenisNotifikasi,
        link,
        instansi_id: instansiId,
        user_id: userId,
      })

      if (error) throw error
    } catch {
      // Ignore
    }
  },

  /**
   * Subscribe ke Supabase Realtime Channel untuk notifikasi instan
   */
  subscribeRealtimeNotifications: (onNotificationReceived) => {
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (onNotificationReceived) {
            onNotificationReceived(payload.new)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          if (onNotificationReceived) {
            onNotificationReceived(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}

// ============================================================================
// WEB PUSH NOTIFICATION
// ============================================================================

const PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Browser tidak mendukung notifikasi.')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function subscribeToPushNotifications() {
  const granted = await requestNotificationPermission()
  if (!granted) return null

  if (!('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.ready
    
    // Cek apakah sudah subscribe
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      })
    }

    const { endpoint } = subscription
    const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh'))))
    const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))

    // Simpan ke Supabase
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: 'endpoint' }
      )
    }

    return subscription
  } catch (error) {
    console.error('Gagal subscribe notifikasi push:', error)
    return null
  }
}

