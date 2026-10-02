import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

// Otomatis claim client saat SW aktif
self.skipWaiting()
clientsClaim()

// Precache semua file statis yang di-inject oleh Vite
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// ============================================================================
// 1. OFFLINE QUEUE & BACKGROUND SYNC (Untuk Request Mutasi Supabase)
// ============================================================================

// Inisialisasi antrean background sync (offline queue)
const bgSyncPlugin = new BackgroundSyncPlugin('siqurban-offline-queue', {
  maxRetentionTime: 24 * 60, // Coba kirim ulang selama 24 jam ke depan
  onSync: async ({ queue }) => {
    try {
      await queue.replayRequests()
      // Broadcast pesan ke UI bahwa sync selesai
      const clients = await self.clients.matchAll()
      clients.forEach((client) => {
        client.postMessage({ type: 'OFFLINE_SYNC_SUCCESS' })
      })
    } catch (error) {
      console.error('Background Sync Gagal:', error)
    }
  },
})

// Mendaftarkan route untuk POST/PUT/DELETE/PATCH ke Supabase
registerRoute(
  ({ url, request }) => url.hostname.endsWith('supabase.co') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
)
registerRoute(
  ({ url, request }) => url.hostname.endsWith('supabase.co') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PUT'
)
registerRoute(
  ({ url, request }) => url.hostname.endsWith('supabase.co') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'DELETE'
)
registerRoute(
  ({ url, request }) => url.hostname.endsWith('supabase.co') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PATCH'
)

// ============================================================================
// 2. CACHING STRATEGY UNTUK DATA GET (Supabase API)
// ============================================================================
registerRoute(
  ({ url, request }) => url.hostname.endsWith('supabase.co') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'siqurban-api-cache',
    networkTimeoutSeconds: 3, // Jika jaringan lambat >3 detik, gunakan cache
  })
)

// ============================================================================
// 3. PUSH NOTIFICATION (Web Push)
// ============================================================================
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: data.url || '/',
      },
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow(event.notification.data.url))
})
