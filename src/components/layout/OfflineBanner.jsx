import { WifiOff } from 'lucide-react'
import useOnlineStatus from '../../hooks/useOnlineStatus'

/**
 * Banner yang muncul di atas halaman saat koneksi internet terputus.
 * Otomatis hilang saat koneksi kembali.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm">
      <WifiOff className="h-4 w-4" />
      <span>Koneksi internet terputus. Beberapa fitur mungkin tidak berfungsi.</span>
    </div>
  )
}
