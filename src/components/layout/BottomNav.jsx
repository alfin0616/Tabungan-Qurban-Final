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
    <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-border dark:border-border-dark bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md pb-safe">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-6 h-6 transition-transform',
                    isActive ? 'scale-110' : 'scale-100',
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
