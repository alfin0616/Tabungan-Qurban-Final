import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, User, ChevronDown, Search, Moon, Sun, Maximize2, Minimize2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import NotificationDropdown from './NotificationDropdown'
import toast from 'react-hot-toast'

import SmartSearchInput from './SmartSearchInput'

export default function Navbar({ onMenuClick, title, onSearch }) {
  const { user, profile, logout, isAdmin, isSuperAdmin } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        toast.error('Layar penuh tidak didukung di perangkat/browser ini')
      })
    } else {
      document.exitFullscreen?.()
    }
  }

  async function handleLogout() {
    try {
      await logout()
      toast.success('Berhasil keluar')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Gagal keluar')
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border dark:border-border-dark bg-surface/90 dark:bg-surface-dark/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        {(isAdmin || isSuperAdmin) && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="hidden text-lg font-semibold text-ink dark:text-ink-dark sm:block">{title}</h1>
      </div>

      <div className="hidden flex-1 max-w-sm md:block">
        <SmartSearchInput onSearch={onSearch} />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Perlebar Layar (Full Screen)'}
          aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Perlebar Layar (Full Screen)'}
          className="rounded-full p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Ubah mode tampilan"
          className="rounded-full p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <NotificationDropdown />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-emerald-50 dark:hover:bg-slate-700"
          >
            <Avatar src={profile?.avatar_url} name={profile?.full_name || user?.email} size={32} />
            <span className="hidden text-sm font-medium text-ink dark:text-ink-dark sm:block">
              {profile?.full_name || user?.email}
            </span>
            {isSuperAdmin ? (
              <Badge tone="warning" className="hidden sm:inline-flex">
                Super Admin
              </Badge>
            ) : isAdmin ? (
              <Badge tone="success" className="hidden sm:inline-flex">
                Admin
              </Badge>
            ) : (
              <Badge tone="info" className="hidden sm:inline-flex">
                Jamaah
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 text-ink-muted dark:text-ink-muted-dark" />
          </button>

          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-1.5 shadow-soft">
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/profile')
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink dark:text-ink-dark hover:bg-emerald-50 dark:hover:bg-slate-700"
                >
                  <User className="h-4 w-4" /> Profil Saya
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-100 dark:hover:bg-danger-100/10"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
