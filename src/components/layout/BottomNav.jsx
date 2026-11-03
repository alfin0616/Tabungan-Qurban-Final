import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Coins, History, User } from 'lucide-react'
import { cn } from '../../lib/cn'

const navItems = [
  { to: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { to: '/tabungan', label: 'Tabungan', icon: Coins },
  { to: '/transaksi/riwayat', label: 'Riwayat', icon: History },
  { to: '/profile', label: 'Profil', icon: User },
]

export default function BottomNav() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-border/80 dark:border-border-dark/80 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full py-1 space-y-0.5 transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-7 rounded-xl transition-all',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : '',
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 transition-transform',
                      isActive ? 'scale-110' : 'scale-100',
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    isActive ? 'font-bold' : 'font-medium',
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
