import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import OfflineBanner from './OfflineBanner'
import BottomNav from './BottomNav'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'

const titles = {
  '/dashboard': 'Dashboard',
  '/instansi': 'Manajemen Instansi',
  '/kelompok': 'Manajemen Kelompok',
  '/anggota': 'Data Anggota',
  '/tabungan': 'Tabungan',
  '/transaksi/setoran': 'Setoran',
  '/transaksi/penarikan': 'Penarikan',
  '/transaksi/riwayat': 'Riwayat Transaksi',
  '/laporan': 'Laporan',
  '/pengeluaran': 'Pengeluaran Operasional',
  '/profile': 'Profil Saya',
  '/settings': 'Pengaturan',
  '/files': 'File Manager',
  '/activity-center': 'Activity Center',
  // Super Admin
  '/superadmin/dashboard': 'Dashboard Super Admin',
  '/superadmin/instansi': 'Manajemen Instansi',
  '/superadmin/kelompok': 'Manajemen Kelompok',
  '/superadmin/monitoring': 'Monitoring',
  '/superadmin/logs': 'System & Error Logs',
  '/superadmin/statistik': 'Statistik',
  '/superadmin/laporan': 'Laporan Nasional',
  '/superadmin/pengaturan': 'Pengaturan Sistem',
  '/superadmin/audit-log': 'Audit Log',
  '/audit-log': 'Audit Log',
  '/backup': 'Backup & Recovery',
}

function resolveTitle(pathname) {
  if (titles[pathname]) return titles[pathname]
  if (pathname.startsWith('/anggota/')) return 'Detail Anggota'
  return 'SIQURBAN'
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('siqurban_sidebar_collapsed') === 'true'
  })
  const { pathname } = useLocation()
  const { isAdmin, isSuperAdmin, instansiSaya } = useAuth()
  const isJamaah = !isAdmin && !isSuperAdmin

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('siqurban_sidebar_collapsed', String(next))
      return next
    })
  }

  return (
    <div className="min-h-dvh w-full bg-bg dark:bg-bg-dark">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div
        className={cn(
          'min-h-dvh min-w-0 flex flex-col w-full transition-all duration-300',
          collapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <OfflineBanner />
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          onToggleCollapsed={toggleCollapsed}
          collapsed={collapsed}
          title={resolveTitle(pathname)}
        />

        {/* Argon Extended Gradient Hero Header — Selaras dengan warna Deep Emerald Sidebar */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-800 px-4 pt-5 pb-20 lg:px-6 shadow-sm">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-black/10 blur-xl" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-100/90">
                <span>SIQURBAN</span>
                <span>/</span>
                <span className="font-semibold text-white">{resolveTitle(pathname)}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {resolveTitle(pathname)}
              </h2>
            </div>

            {isSuperAdmin ? (
              <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
                <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
                <span>Super Admin • Monitoring Seluruh Instansi</span>
              </div>
            ) : (
              instansiSaya?.nama_instansi && (
                <div className="inline-flex max-w-full items-start gap-2 self-start sm:self-auto sm:max-w-[50%] rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="break-words leading-snug">Panel Instansi: {instansiSaya.nama_instansi}</span>
                </div>
              )
            )}
          </div>
        </div>

        <main
          className="relative z-10 -mt-14 flex-1 min-w-0 w-full px-3.5 sm:px-4 lg:px-6 mobile-bottom-nav-pad pb-32 lg:pb-8"
          style={{
            paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 16px) + 1.5rem)',
          }}
        >
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
