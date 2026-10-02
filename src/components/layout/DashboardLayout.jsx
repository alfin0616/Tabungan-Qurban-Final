import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import OfflineBanner from './OfflineBanner'
import BottomNav from './BottomNav'
import { useAuth } from '../../context/AuthContext'

const titles = {
  '/dashboard': 'Dashboard',
  '/anggota': 'Data Anggota',
  '/tabungan': 'Tabungan',
  '/transaksi/setoran': 'Setoran',
  '/transaksi/penarikan': 'Penarikan',
  '/transaksi/riwayat': 'Riwayat Transaksi',
  '/laporan': 'Laporan',
  '/pengeluaran': 'Pengeluaran Operasional',
  '/profile': 'Profil Saya',
  '/settings': 'Pengaturan',
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

import { cn } from '../../lib/cn'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('siqurban_sidebar_collapsed') === 'true'
  })
  const { pathname } = useLocation()
  const { isAdmin, isSuperAdmin } = useAuth()
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
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={resolveTitle(pathname)} />
        <main className={cn("safe-bottom flex-1 min-w-0 w-full px-4 py-6 lg:px-6", isJamaah && "pb-24 lg:pb-6")}>
          <Outlet />
        </main>
        {isJamaah && <BottomNav />}
      </div>
    </div>
  )
}
