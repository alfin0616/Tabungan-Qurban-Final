import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'

/**
 * Khusus role 'superadmin' — untuk halaman lintas-instansi (Instansi,
 * Monitoring, Pengaturan Sistem) yang akan dibangun di Fase 4.
 * Admin instansi biasa & jamaah dialihkan ke dashboard mereka sendiri.
 */
export default function SuperAdminRoute() {
  const { isSuperAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
