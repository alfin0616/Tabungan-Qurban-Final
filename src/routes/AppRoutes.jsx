import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import SuperAdminRoute from './SuperAdminRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import AuthLayout from '../components/layout/AuthLayout'
import PageLoader from '../components/ui/PageLoader'

// Lazy loaded page components for optimal performance & code splitting
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const ClaimAkunPage = lazy(() => import('../pages/auth/ClaimAkunPage'))
const ClaimInstansiPage = lazy(() => import('../pages/auth/ClaimInstansiPage'))

const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))

const AnggotaListPage = lazy(() => import('../pages/anggota/AnggotaListPage'))
const AnggotaDetailPage = lazy(() => import('../pages/anggota/AnggotaDetailPage'))

const TabunganListPage = lazy(() => import('../pages/tabungan/TabunganListPage'))

const SetoranPage = lazy(() => import('../pages/transaksi/SetoranPage'))
const PenarikanPage = lazy(() => import('../pages/transaksi/PenarikanPage'))
const RiwayatPage = lazy(() => import('../pages/transaksi/RiwayatPage'))

const LaporanPage = lazy(() => import('../pages/laporan/LaporanPage'))
const PengeluaranListPage = lazy(() => import('../pages/pengeluaran/PengeluaranListPage'))
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))
const FileManagerPage = lazy(() => import('../pages/settings/FileManagerPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

const SuperAdminDashboardPage = lazy(() => import('../pages/superadmin/SuperAdminDashboardPage'))
const MonitoringPage = lazy(() => import('../pages/superadmin/MonitoringPage'))
const SystemLogsPage = lazy(() => import('../pages/superadmin/SystemLogsPage'))
const SystemSettingsPage = lazy(() => import('../pages/superadmin/SystemSettingsPage'))
const AuditLogPage = lazy(() => import('../pages/settings/AuditLogPage'))
const ActivityCenterPage = lazy(() => import('../pages/settings/ActivityCenterPage'))
const BackupPage = lazy(() => import('../pages/settings/BackupPage'))
const InstansiListPage = lazy(() => import('../pages/instansi/InstansiListPage'))
const KelompokListPage = lazy(() => import('../pages/kelompok/KelompokListPage'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/claim-instansi" element={<ClaimInstansiPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          {/* Untuk pertama kali login akun yang dibuat admin — wajib klaim dan hubungkan ke data anggota */}
          <Route path="/hubungkan-akun" element={<ClaimAkunPage />} />

          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Master Data */}
            <Route element={<AdminRoute />}>
              <Route path="/instansi" element={<InstansiListPage />} />
              <Route path="/kelompok" element={<KelompokListPage />} />
            </Route>

            {/* Bisa dilihat oleh admin maupun jamaah (read-only) */}
            <Route path="/anggota" element={<AnggotaListPage />} />
            <Route path="/anggota/:id" element={<AnggotaDetailPage />} />
            <Route path="/tabungan" element={<TabunganListPage />} />
            <Route path="/transaksi/riwayat" element={<RiwayatPage />} />
            <Route path="/laporan" element={<LaporanPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Khusus admin/superadmin — jamaah otomatis dialihkan ke dashboard */}
            <Route element={<AdminRoute />}>
              <Route path="/transaksi/setoran" element={<SetoranPage />} />
              <Route path="/transaksi/penarikan" element={<PenarikanPage />} />
              <Route path="/pengeluaran" element={<PengeluaranListPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/files" element={<FileManagerPage />} />
              <Route path="/activity-center" element={<ActivityCenterPage />} />
            </Route>

            {/* Khusus superadmin — admin instansi & jamaah dialihkan ke dashboard */}
            <Route element={<SuperAdminRoute />}>
              <Route path="/superadmin/dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="/superadmin/monitoring" element={<MonitoringPage />} />
              <Route path="/superadmin/logs" element={<SystemLogsPage />} />
              <Route path="/superadmin/pengaturan" element={<SystemSettingsPage />} />
              <Route path="/audit-log" element={<ActivityCenterPage />} />
              <Route path="/backup" element={<BackupPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

