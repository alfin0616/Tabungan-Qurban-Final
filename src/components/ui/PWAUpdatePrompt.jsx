import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download, RefreshCw, X } from 'lucide-react'
import { cn } from '../../lib/cn'

export default function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Cek update setiap 1 jam (Version Checker)
      if (r) {
        setInterval(() => {
          r.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  // State untuk menangkap event "A2HS" (Add to Home Screen)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Mencegah mini-infobar Chrome muncul otomatis
      e.preventDefault()
      // Simpan event untuk di-trigger nanti
      setDeferredPrompt(e)
      setShowInstallBtn(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt')
    }
    setDeferredPrompt(null)
    setShowInstallBtn(false)
  }

  const closeRefresh = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  // Jika butuh refresh (ada update) atau siap mode offline (notif awal) atau bisa diinstal
  if (!needRefresh && !offlineReady && !showInstallBtn) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl dark:border-emerald-900/50 dark:bg-surface-dark">
      <button onClick={closeRefresh} className="absolute right-3 top-3 text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark">
        <X className="h-4 w-4" />
      </button>

      <div className="mr-6">
        {needRefresh && (
          <>
            <h3 className="text-sm font-bold text-ink dark:text-ink-dark">Pembaruan Tersedia</h3>
            <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
              Versi terbaru aplikasi SIQURBAN siap digunakan.
            </p>
            <button
              onClick={() => updateServiceWorker(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <RefreshCw className="h-4 w-4" /> Muat Ulang Sekarang
            </button>
          </>
        )}

        {offlineReady && (
          <>
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Siap Offline</h3>
            <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
              Aplikasi kini dapat bekerja tanpa koneksi internet.
            </p>
          </>
        )}

        {showInstallBtn && !needRefresh && (
          <>
            <h3 className="text-sm font-bold text-ink dark:text-ink-dark">Instal Aplikasi SIQURBAN</h3>
            <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
              Dapatkan pengalaman layaknya aplikasi native di HP Anda.
            </p>
            <button
              onClick={handleInstallClick}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-2 text-xs font-semibold transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-800/40"
            >
              <Download className="h-4 w-4" /> Instal ke Layar Utama
            </button>
          </>
        )}
      </div>
    </div>
  )
}
