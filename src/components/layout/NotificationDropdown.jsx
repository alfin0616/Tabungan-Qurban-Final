import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  XCircle,
  Target,
  Sparkles,
  Users,
  UserCheck,
  Calendar,
  Wrench,
  Megaphone,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { notificationRepository } from '../../repositories/notificationRepository'
import toast from 'react-hot-toast'

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const loadNotifications = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        notificationRepository.getNotifications(15),
        notificationRepository.getUnreadCount(),
      ])
      setNotifications(list)
      setUnreadCount(count)
    } catch {
      // Ignore
    }
  }, [])

  // Supabase Realtime Subscription & Initial Load
  useEffect(() => {
    loadNotifications()

    const unsubscribe = notificationRepository.subscribeRealtimeNotifications((newNotif) => {
      setNotifications((prev) => {
        const exists = prev.find((n) => n.id === newNotif.id)
        if (exists) {
          return prev.map((n) => (n.id === newNotif.id ? newNotif : n))
        }
        return [newNotif, ...prev]
      })

      if (!newNotif.read) {
        setUnreadCount((count) => count + 1)
        toast(newNotif.title || 'Notifikasi Baru', {
          icon: '🔔',
          style: { borderRadius: '12px', background: '#10b981', color: '#fff' },
        })
      }
    })

    return () => unsubscribe()
  }, [loadNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleMarkAllRead() {
    await notificationRepository.markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function handleItemClick(item) {
    if (!item.read) {
      await notificationRepository.markAsRead(item.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    setOpen(false)
    if (item.link) {
      navigate(item.link)
    }
  }

  function renderIcon(type, jenisNotifikasi) {
    const key = jenisNotifikasi || type
    switch (key) {
      case 'pembayaran_berhasil':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'pembayaran_pending':
        return <Clock className="h-4 w-4 text-amber-500" />
      case 'pembayaran_gagal':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'target_hampir_tercapai':
        return <Target className="h-4 w-4 text-sky-500" />
      case 'target_tercapai':
        return <Sparkles className="h-4 w-4 text-amber-500" />
      case 'kelompok_hampir_penuh':
        return <Users className="h-4 w-4 text-indigo-500" />
      case 'kelompok_sudah_penuh':
        return <UserCheck className="h-4 w-4 text-purple-500" />
      case 'reminder_setoran':
        return <Calendar className="h-4 w-4 text-emerald-600" />
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-orange-500" />
      case 'system_announcement':
        return <Megaphone className="h-4 w-4 text-blue-500" />
      case 'setoran':
        return <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
      case 'penarikan':
        return <ArrowUpCircle className="h-4 w-4 text-amber-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifikasi"
        className="relative rounded-full p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop overlay for Mobile */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden"
          />

          <div className="fixed inset-x-3 top-16 z-50 mx-auto max-w-sm rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 shadow-2xl backdrop-blur-md transition-all sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-none">
            {/* Header Dropdown */}
            <div className="mb-2.5 flex items-center justify-between border-b border-border dark:border-border-dark pb-2 px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink dark:text-ink-dark">Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {unreadCount} baru
                  </span>
                )}
              </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tandai dibaca
              </button>
            )}
          </div>

          {/* Body List Notifikasi */}
          <div className="max-h-80 overflow-y-auto space-y-1 pr-0.5">
            {!notifications.length ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-1" />
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Belum ada notifikasi.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl p-2.5 transition-colors ${
                    !item.read
                      ? 'bg-emerald-50/70 dark:bg-emerald-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 rounded-lg bg-surface p-1.5 shadow-xs dark:bg-surface-dark">
                    {renderIcon(item.type, item.jenis_notifikasi)}
                  </div>

                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold truncate ${!item.read ? 'text-ink dark:text-ink-dark font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark shrink-0 ml-2">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  {!item.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </>
    )}
  </div>
  )
}
