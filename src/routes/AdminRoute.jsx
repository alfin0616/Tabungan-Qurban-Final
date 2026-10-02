import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'

/**
 * Dipasang di dalam ProtectedRoute. Jamaah (role read-only) yang
 * mencoba mengakses halaman admin lewat URL langsung akan
 * dialihkan kembali ke dashboard. Ini hanya lapisan kenyamanan UI —
 * penegakan keamanan sesungguhnya ada di Row Level Security & RPC
 * di database, sehingga tetap aman walau URL diakses paksa.
 */
export default function AdminRoute() {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
