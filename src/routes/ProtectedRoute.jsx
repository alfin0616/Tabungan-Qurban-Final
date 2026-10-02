import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'

export default function ProtectedRoute() {
  const { isAuthenticated, loading, needsClaim } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg dark:bg-bg-dark">
        <Spinner size={32} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Jamaah yang akunnya belum dihubungkan ke data anggota manapun wajib
  // menyelesaikan itu dulu sebelum bisa mengakses halaman lain.
  if (needsClaim && location.pathname !== '/hubungkan-akun') {
    return <Navigate to="/hubungkan-akun" replace />
  }

  // Sebaliknya: kalau akun SUDAH terhubung (atau bukan jamaah sama sekali)
  // tapi masih nyangkut di halaman klaim (mis. buka tab lama / back button),
  // arahkan ke dashboard supaya tidak macet di halaman ini.
  if (!needsClaim && location.pathname === '/hubungkan-akun') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}