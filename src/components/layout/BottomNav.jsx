import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  User,
  ArrowDownCircle,
  Activity,
  Bug,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import { InstansiIcon, TabunganIcon } from '../ui/AppIcons'

export default function BottomNav() {
  const { isAdmin, isSuperAdmin } = useAuth()

  const navItems = isSuperAdmin
    ? [
        { to: '/superadmin/dashboard', label: 'Home', icon: LayoutDashboard, activeColor: 'text-emerald-600 dark:text-emerald-400' },
        { to: '/superadmin/monitoring', label: 'Monitor', icon: Activity, activeColor: 'text-purple-600 dark:text-purple-400' },
        { to: '/instansi', label: 'Instansi', icon: InstansiIcon, activeColor: 'text-amber-600 dark:text-amber-400' },
        { to: '/superadmin/logs', label: 'Logs', icon: Bug, activeColor: 'text-rose-600 dark:text-rose-400' },
        { to: '/profile', label: 'Akun', icon: User, activeColor: 'text-blue-600 dark:text-blue-400' },
      ]
    : isAdmin
    ? [
        { to: '/dashboard', label: 'Home', icon: LayoutDashboard, activeColor: 'text-emerald-600 dark:text-emerald-400' },
        { to: '/transaksi/setoran', label: 'Setoran', icon: ArrowDownCircle, activeColor: 'text-emerald-600 dark:text-emerald-400' },
        { to: '/tabungan', label: 'Tabungan', icon: TabunganIcon, activeColor: 'text-amber-600 dark:text-amber-400' },
        { to: '/transaksi/riwayat', label: 'Riwayat', icon: History, activeColor: 'text-indigo-600 dark:text-indigo-400' },
        { to: '/profile', label: 'Akun', icon: User, activeColor: 'text-blue-600 dark:text-blue-400' },
      ]
    : [
        { to: '/dashboard', label: 'Home', icon: LayoutDashboard, activeColor: 'text-emerald-600 dark:text-emerald-400' },
        { to: '/tabungan', label: 'Tabungan', icon: TabunganIcon, activeColor: 'text-amber-600 dark:text-amber-400' },
        { to: '/transaksi/riwayat', label: 'Riwayat', icon: History, activeColor: 'text-indigo-600 dark:text-indigo-400' },
        { to: '/profile', label: 'Akun', icon: User, activeColor: 'text-blue-600 dark:text-blue-400' },
      ]

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-border/80 dark:border-border-dark/80 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full py-1 space-y-0.5 transition-all select-none',
                isActive
                  ? 'text-emerald-800 dark:text-emerald-200 font-bold'
                  : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200',
                    isActive
                      ? 'bg-emerald-100/90 dark:bg-emerald-900/60 shadow-2xs'
                      : 'text-ink-muted dark:text-ink-muted-dark',
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-200',
                      isActive
                        ? cn('scale-110 stroke-[2.5]', item.activeColor || 'text-emerald-800 dark:text-emerald-200')
                        : 'scale-100 stroke-[1.8] opacity-80',
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10.5px] leading-tight tracking-tight transition-colors',
                    isActive ? 'font-bold text-emerald-900 dark:text-emerald-200' : 'font-medium',
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
