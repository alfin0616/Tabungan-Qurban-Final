import { supabase } from '../api/supabaseClient'

const READ_NOTIF_STORAGE_KEY = 'siqurban_read_notifications_v1'
const MARK_ALL_READ_AT_KEY = 'siqurban_mark_all_read_at_v1'

function getLocalReadIds() {
  try {
    const raw = localStorage.getItem(READ_NOTIF_STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function addLocalReadIds(ids = []) {
  try {
    const set = getLocalReadIds()
    ids.forEach((id) => {
      if (id) set.add(String(id))
    })
    // Batasi maksimal 500 ID terakhir agar storage tetap ringan
    const arr = Array.from(set).slice(-500)
    localStorage.setItem(READ_NOTIF_STORAGE_KEY, JSON.stringify(arr))
  } catch {
    // ignore storage errors
  }
}

function getMarkAllReadTimestamp() {
  try {
    const val = localStorage.getItem(MARK_ALL_READ_AT_KEY)
    return val ? new Date(val).getTime() : 0
  } catch {
    return 0
  }
}

function setMarkAllReadTimestamp(isoString = new Date().toISOString()) {
  try {
    localStorage.setItem(MARK_ALL_READ_AT_KEY, isoString)
  } catch {
    // ignore storage errors
  }
}

export function isNotificationRead(notif) {
  if (!notif) return true
  if (notif.read === true) return true
  const readSet = getLocalReadIds()
  if (notif.id && readSet.has(String(notif.id))) return true
  const markAllTs = getMarkAllReadTimestamp()
  if (markAllTs > 0 && notif.created_at) {
    const createdTs = new Date(notif.created_at).getTime()
    if (!Number.isNaN(createdTs) && createdTs <= markAllTs) {
      return true
    }
  }
  return false
}

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
   * Mengambil daftar notifikasi terbaru dan menyelaraskan status dibaca (DB + LocalStorage)
   */
  getNotifications: async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []).map((item) => ({
        ...item,
        read: isNotificationRead(item),
      }))
    } catch {
      return []
    }
  },

  /**
   * Hitung jumlah notifikasi yang belum dibaca secara akurat
   */
  getUnreadCount: async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, read, created_at')
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      const unreadItems = (data || []).filter((item) => !isNotificationRead(item))
      return unreadItems.length
    } catch {
      return 0
    }
  },

  /**
   * Tandai 1 notifikasi sebagai sudah dibaca (tersimpan permanen di LocalStorage & DB)
   */
  markAsRead: async (id) => {
    if (!id) return
    addLocalReadIds([id])
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
    } catch {
      // Ignore if RLS blocks global notification row update; local read state is already saved
    }
  },

  /**
   * Tandai semua notifikasi sebagai sudah dibaca (tersimpan permanen di LocalStorage & DB)
   */
  markAllAsRead: async (currentNotifications = []) => {
    setMarkAllReadTimestamp(new Date().toISOString())
    if (Array.isArray(currentNotifications) && currentNotifications.length > 0) {
      addLocalReadIds(currentNotifications.map((n) => n.id))
    }
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false)
    } catch {
      // Ignore if RLS blocks global notification row update; local read state is already saved
    }
  },

  /**
   * Buat notifikasi baru secara manual dengan jenis_notifikasi
   */
  createNotification: async ({
    title,
    message,
    jenisNotifikasi = 'system_announcement',
    link = null,
    instansiId = null,
    userId = null,
  }) => {
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
  subscribeRealtimeNotifications: (onInsert, onUpdate) => {
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (onInsert && payload.new) {
            onInsert({
              ...payload.new,
              read: isNotificationRead(payload.new),
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          if (onUpdate && payload.new) {
            onUpdate({
              ...payload.new,
              read: isNotificationRead(payload.new),
            })
          }
        },
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

const PUBLIC_VAPID_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

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

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      })
    }

    const { endpoint } = subscription
    const p256dh = btoa(
      String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh'))),
    )
    const auth = btoa(
      String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))),
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: 'endpoint' },
      )
    }

    return subscription
  } catch (error) {
    console.error('Gagal subscribe notifikasi push:', error)
    return null
  }
}
