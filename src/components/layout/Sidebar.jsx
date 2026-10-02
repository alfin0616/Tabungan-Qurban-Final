import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  FileBarChart,
  Wallet,
  Settings,
  X,
  LogOut,
  Building2,
  Layers,
  Activity,
  BarChart3,
  ScrollText,
  ShieldCheck,
  HardDrive,
  Bug,
  Database,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  User,
  FolderOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../hooks/useSettings'
import logoSiqurban from '../../assets/logo-siqurban.png'

// Top-level reguler menu
const topLevelMenu = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

// Kelompok Dropdown Reguler (Master Data, Keuangan, dan Pengaturan)
const regularMenuGroups = [
  {
    id: 'master-data',
    label: 'Master Data',
    icon: Database,
    description: 'Pilih menu di bawah ini.',
    items: [
      { to: '/instansi', label: 'Instansi', icon: Building2, adminOnly: true },
      { to: '/kelompok', label: 'Kelompok', icon: Layers, adminOnly: true },
      { to: '/anggota', label: 'Anggota', icon: Users },
      { to: '/tabungan', label: 'Tabungan', icon: Coins },
    ],
  },
  {
    id: 'keuangan',
    label: 'Keuangan',
    icon: Wallet,
    description: 'Pilih menu transaksi & laporan keuangan di bawah ini.',
    items: [
      { to: '/transaksi/setoran', label: 'Setoran', icon: ArrowDownCircle, adminOnly: true },
      { to: '/transaksi/penarikan', label: 'Penarikan', icon: ArrowUpCircle, adminOnly: true },
      { to: '/transaksi/riwayat', label: 'Riwayat Transaksi', icon: History },
      { to: '/pengeluaran', label: 'Pengeluaran Operasional', icon: Wallet, adminOnly: true },
      { to: '/laporan', label: 'Report Center', icon: FileBarChart },
    ],
  },
  {
    id: 'pengaturan-grup',
    label: 'Pengaturan',
    icon: Settings,
    description: 'Pilih menu profil & sistem di bawah ini.',
    items: [
      { to: '/profile', label: 'Profil Saya', icon: User },
      { to: '/settings', label: 'Pengaturan', icon: Settings, adminOnly: true },
      { to: '/files', label: 'File Manager', icon: FolderOpen, adminOnly: true },
      { to: '/activity-center', label: 'Activity Center', icon: Activity, adminOnly: true },
    ],
  },
]

// Top-level Super Admin menu
const topLevelSuperAdminMenu = [
  { to: '/superadmin/dashboard', label: 'Dashboard SA', icon: LayoutDashboard },
]

// Kelompok Dropdown Super Admin
const superAdminMenuGroups = [
  {
    id: 'sa-monitoring',
    label: 'Sistem & Monitoring',
    icon: Activity,
    description: 'Pilih menu sistem & pemantauan di bawah ini.',
    items: [
      { to: '/superadmin/monitoring', label: 'Monitoring', icon: Activity },
      { to: '/superadmin/logs', label: 'System Logs', icon: Bug },
      { to: '/audit-log', label: 'Activity Center', icon: ScrollText },
      { to: '/backup', label: 'Backup & Recovery', icon: HardDrive },
      { to: '/superadmin/pengaturan', label: 'Pengaturan Sistem', icon: ShieldCheck },
    ],
  },
]

export default function Sidebar({ open, onClose, collapsed: propCollapsed, onToggleCollapsed }) {
  const { logout, isAdmin, isSuperAdmin } = useAuth()
  const { data: settings } = useSettings()
  const logoUrl = settings?.logo_url || logoSiqurban
  const appName = settings?.app_name || 'SIQURBAN'
  const navigate = useNavigate()
  const location = useLocation()
  
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    return localStorage.getItem('siqurban_sidebar_collapsed') === 'true'
  })

  const collapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed
  const toggleCollapsed = onToggleCollapsed || (() => {
    setInternalCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('siqurban_sidebar_collapsed', String(next))
      return next
    })
  })

  // State untuk Side Drawer (Mega Dropdown ke Samping)
  const [activeGroup, setActiveGroup] = useState(null)
  const sideDrawerRef = useRef(null)

  // Tutup side drawer ketika lokasi rute berubah atau klik di luar
  useEffect(() => {
    setActiveGroup(null)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(event) {
      if (sideDrawerRef.current && !sideDrawerRef.current.contains(event.target)) {
        setActiveGroup(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    try {
      await logout()
      toast.success('Berhasil keluar')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Gagal keluar')
    }
  }

  const handleLogoClick = () => {
    if (isSuperAdmin) {
      navigate('/superadmin/dashboard')
    } else {
      navigate('/dashboard')
    }
    setActiveGroup(null)
    if (open) onClose?.()
  }

  const handleOpenGroup = (group) => {
    if (activeGroup?.id === group.id) {
      setActiveGroup(null)
    } else {
      setActiveGroup(group)
    }
  }

  return (
    <>
      {/* Backdrop Mobile Overlay */}
      {open && (
        <button
          aria-label="Tutup menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen max-h-screen flex-col border-r border-emerald-800 bg-emerald-800 dark:bg-emerald-950 transition-all duration-300',
          collapsed ? 'lg:w-20' : 'lg:w-64',
          'w-64',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header Logo */}
        <div className="flex h-16 items-center justify-between border-b border-emerald-700/80 px-4">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <img
              src={logoUrl}
              alt={appName}
              className="h-9 w-9 rounded-xl object-contain shadow-soft bg-white/10 p-0.5"
              onError={(e) => {
                e.target.src = logoSiqurban
              }}
            />
            <div className={cn('flex flex-col leading-tight', collapsed && 'lg:hidden')}>
              <span className="text-base font-extrabold tracking-wider text-white truncate max-w-[130px]">
                {appName}
              </span>
              <span className="text-[10px] font-medium text-emerald-200">
                {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin Instansi' : 'Jamaah Qurban'}
              </span>
            </div>
          </button>
          <button onClick={onClose} className="rounded-lg p-1 text-emerald-200 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-transparent">
          {/* Menu Super Admin */}
          {isSuperAdmin && (
            <>
              <p
                className={cn(
                  'mb-1.5 mt-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-emerald-300',
                  collapsed && 'lg:hidden',
                )}
              >
                Super Admin
              </p>
              {collapsed && <div className="my-2 hidden border-t border-emerald-700/60 lg:block" />}
              
              {/* Top-level SA (Dashboard SA) */}
              {topLevelSuperAdminMenu.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => {
                    setActiveGroup(null)
                    onClose?.()
                  }}
                  title={label}
                  className={({ isActive }) =>
                    cn(
                      'cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      collapsed && 'lg:justify-center lg:px-2',
                      isActive
                        ? 'bg-emerald-600 text-white shadow-soft font-semibold'
                        : 'text-emerald-100 hover:bg-emerald-700 hover:text-white',
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className={cn('truncate', collapsed && 'lg:hidden')}>{label}</span>
                </NavLink>
              ))}

              {/* Group Category items (Side Dropdown Triggers) */}
              {superAdminMenuGroups.map((group) => {
                const GroupIcon = group.icon
                const isGroupActive = group.items.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
                const isOpenThisGroup = activeGroup?.id === group.id

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleOpenGroup(group)}
                    title={group.label}
                    className={cn(
                      'cursor-pointer flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      collapsed ? 'lg:justify-center lg:px-2' : '',
                      isOpenThisGroup || isGroupActive
                        ? 'bg-emerald-700/80 text-white font-bold shadow-soft'
                        : 'text-emerald-100 hover:bg-emerald-700/60 hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <GroupIcon className="h-[18px] w-[18px] shrink-0" />
                      <span className={cn('truncate', collapsed && 'lg:hidden')}>{group.label}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200 text-emerald-200',
                        isOpenThisGroup ? 'translate-x-0.5 text-white' : 'opacity-70',
                        collapsed && 'lg:hidden',
                      )}
                    />
                  </button>
                )
              })}

              <div className="my-3 border-t border-emerald-700/80" />
              <p
                className={cn(
                  'mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-emerald-300',
                  collapsed && 'lg:hidden',
                )}
              >
                Instansi Saya
              </p>
            </>
          )}

          {/* Top-level Reguler (Dashboard) */}
          {topLevelMenu.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                setActiveGroup(null)
                onClose?.()
              }}
              title={label}
              className={({ isActive }) =>
                cn(
                  'cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed && 'lg:justify-center lg:px-2',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-soft font-semibold'
                    : 'text-emerald-100 hover:bg-emerald-700 hover:text-white',
                )
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className={cn('truncate', collapsed && 'lg:hidden')}>{label}</span>
            </NavLink>
          ))}

          {/* Kelompok Dropdown Reguler (Master Data, Keuangan, Pengaturan) */}
          {regularMenuGroups.map((group) => {
            const GroupIcon = group.icon
            const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin)
            if (!visibleItems.length) return null

            const isGroupActive = visibleItems.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
            const isOpenThisGroup = activeGroup?.id === group.id

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleOpenGroup(group)}
                title={group.label}
                className={cn(
                  'cursor-pointer flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed ? 'lg:justify-center lg:px-2' : '',
                  isOpenThisGroup || isGroupActive
                    ? 'bg-emerald-700/80 text-white font-bold shadow-soft'
                    : 'text-emerald-100 hover:bg-emerald-700/60 hover:text-white',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GroupIcon className="h-[18px] w-[18px] shrink-0" />
                  <span className={cn('truncate', collapsed && 'lg:hidden')}>{group.label}</span>
                </div>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-200 text-emerald-200',
                    isOpenThisGroup ? 'translate-x-0.5 text-white' : 'opacity-70',
                    collapsed && 'lg:hidden',
                  )}
                />
              </button>
            )
          })}

          <div className="my-2 border-t border-emerald-700/60" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Keluar"
            className={cn(
              'cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200',
              collapsed && 'lg:justify-center lg:px-2',
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span className={cn('truncate', collapsed && 'lg:hidden')}>Keluar</span>
          </button>
        </nav>

        {/* Tombol Toggle Perkecil & Perbesar Menu di Bawah Sidebar (Bottom Toggle) */}
        <div className="hidden border-t border-emerald-700/80 p-3 lg:block">
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Perbesar Menu' : 'Perkecil Menu'}
            aria-label={collapsed ? 'Perbesar Menu' : 'Perkecil Menu'}
            className={cn(
              'cursor-pointer flex w-full items-center gap-3 rounded-xl p-2.5 text-emerald-200 transition-all duration-200 hover:bg-emerald-700/80 hover:text-white shadow-sm',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0 text-emerald-300" />
            ) : (
              <PanelLeftClose className="h-5 w-5 shrink-0 text-emerald-300" />
            )}
            <span className={cn('text-xs font-semibold tracking-wide truncate', collapsed && 'hidden')}>
              Perkecil Menu
            </span>
          </button>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* MEGA SIDE DRAWER PANEL (DROPDOWN KE SAMPING SEPERTI PANEL REFERENSI)  */}
      {/* ===================================================================== */}
      {activeGroup && (
        <div
          ref={sideDrawerRef}
          className={cn(
            'fixed inset-y-0 z-50 flex h-screen max-h-screen flex-col border-r border-emerald-700/80 bg-emerald-900/95 dark:bg-emerald-950/95 text-white shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-left-4',
            // On Mobile (< lg): full width (w-full / max-w-full) covering screen cleanly without cut off
            // On Desktop (lg): anchored next to sidebar (left-64 or left-20)
            'left-0 w-full sm:w-[380px]',
            collapsed
              ? 'lg:left-20 lg:w-[420px] sm:lg:w-[500px]'
              : 'lg:left-64 lg:w-[460px] sm:lg:w-[540px]',
          )}
        >
          {/* Header Drawer */}
          <div className="flex items-center justify-between border-b border-emerald-800/90 p-4 sm:p-6">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back Button for Mobile */}
              <button
                onClick={() => setActiveGroup(null)}
                title="Kembali ke Menu Utama"
                className="rounded-xl bg-emerald-800/90 p-2 text-emerald-200 hover:bg-emerald-700 hover:text-white shadow-sm lg:hidden shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                  {activeGroup.label}
                </h3>
                <p className="mt-0.5 text-[11px] sm:text-xs text-emerald-200/80 truncate">
                  {activeGroup.description || 'Pilih menu di bawah ini.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveGroup(null)}
              className="rounded-xl bg-emerald-800/80 p-2 text-emerald-200 transition-colors hover:bg-emerald-700 hover:text-white shadow-sm shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Submenu Cards Grid Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
              {activeGroup.items
                .filter((item) => !item.adminOnly || isAdmin || isSuperAdmin)
                .map((item) => {
                  const ItemIcon = item.icon
                  const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        setActiveGroup(null)
                        onClose?.()
                        navigate(item.to)
                      }}
                      className={cn(
                        'group cursor-pointer flex flex-col items-center justify-center rounded-2xl border p-3.5 sm:p-5 text-center transition-all duration-200 shadow-md',
                        isActive
                          ? 'border-2 border-emerald-300 bg-emerald-600 shadow-xl shadow-emerald-950/50 font-bold scale-[1.02]'
                          : 'border-emerald-700/80 bg-emerald-800/70 hover:border-emerald-400 hover:bg-emerald-700/90 hover:shadow-lg',
                      )}
                    >
                      <div
                        className={cn(
                          'mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-colors shadow-sm',
                          isActive
                            ? 'bg-white text-emerald-700 font-bold'
                            : 'bg-emerald-950/70 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-white',
                        )}
                      >
                        <ItemIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium leading-snug transition-colors',
                          isActive ? 'text-white font-bold' : 'text-emerald-100 group-hover:text-white',
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
