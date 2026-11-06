import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Wallet,
  FileBarChart,
  Settings,
  FolderOpen,
  Activity,
  Bug,
  ScrollText,
  HardDrive,
  ShieldCheck,
  LogOut,
  ChevronRight,
  UserCheck,
  Lock,
  CreditCard,
  ArrowLeft,
  Shield,
  Smartphone,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../../components/ui/Avatar'
import ProfileForm from '../../components/forms/ProfileForm'
import { cn } from '../../lib/cn'
import {
  InstansiIcon,
  KelompokIcon,
  AnggotaIcon,
  TabunganIcon,
  SetoranIcon,
  PenarikanIcon,
  KeuanganIcon,
} from '../../components/ui/AppIcons'

export default function ProfilePage() {
  const { user, profile, logout, isAdmin, isSuperAdmin, instansiSaya } = useAuth()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState(null) // null | 'form'

  const displayName = profile?.full_name || profile?.nama || user?.user_metadata?.nama || user?.email || 'Pengguna'
  const userRole = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin Instansi' : 'Jamaah Qurban'
  const instansiName = instansiSaya?.nama_instansi || (isSuperAdmin ? 'Pusat Nasional' : null)

  async function handleLogout() {
    try {
      await logout()
      toast.success('Berhasil keluar dari akun')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Gagal keluar')
    }
  }

  // ── DEFINISI MENU YANG SEBELUMNYA DI HAMBURGER / SIDEBAR ──
  // 1. Master Data
  const masterDataMenus = isSuperAdmin
    ? [
        { to: '/instansi', label: 'Manajemen Instansi', icon: InstansiIcon, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
        { to: '/kelompok', label: 'Kelompok Qurban', icon: KelompokIcon, color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
        { to: '/anggota', label: 'Data Anggota / Jamaah', icon: AnggotaIcon, color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
        { to: '/tabungan', label: 'Tabungan Qurban', icon: TabunganIcon, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
      ]
    : isAdmin
    ? [
        { to: '/kelompok', label: 'Kelompok Qurban', icon: KelompokIcon, color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
        { to: '/anggota', label: 'Data Anggota', icon: AnggotaIcon, color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
        { to: '/tabungan', label: 'Tabungan Jamaah', icon: TabunganIcon, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
      ]
    : [
        { to: '/tabungan', label: 'Tabungan Saya', icon: TabunganIcon, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
        { to: '/kelompok', label: 'Kelompok Qurban Saya', icon: KelompokIcon, color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
      ]

  // 2. Keuangan & Transaksi
  const keuanganMenus = isAdmin
    ? [
        { to: '/transaksi/setoran', label: 'Input Setoran Kas', icon: SetoranIcon, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
        { to: '/transaksi/penarikan', label: 'Penarikan Dana', icon: PenarikanIcon, color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
        { to: '/transaksi/riwayat', label: 'Riwayat Transaksi', icon: History, color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
        { to: '/pengeluaran', label: 'Pengeluaran Operasional', icon: Wallet, color: 'bg-pink-500/15 text-pink-600 dark:text-pink-400' },
        { to: '/laporan', label: 'Report Center / Unduh Rekap', icon: FileBarChart, color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
      ]
    : isSuperAdmin
    ? [
        { to: '/transaksi/riwayat', label: 'Riwayat Transaksi Nasional', icon: History, color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
        { to: '/laporan', label: 'Report Center Nasional', icon: FileBarChart, color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
      ]
    : [
        { to: '/transaksi/riwayat', label: 'Riwayat Setoran Saya', icon: History, color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
        { to: '/laporan', label: 'Laporan & Bukti Tabungan', icon: FileBarChart, color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
      ]

  // 3. Sistem & Administrasi
  const sistemMenus = isSuperAdmin
    ? [
        { to: '/superadmin/monitoring', label: 'Monitoring Nasional', icon: Activity, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
        { to: '/superadmin/logs', label: 'System & Error Logs', icon: Bug, color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
        { to: '/audit-log', label: 'Activity Center / Audit Log', icon: ScrollText, color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
        { to: '/backup', label: 'Backup & Recovery Data', icon: HardDrive, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
        { to: '/superadmin/pengaturan', label: 'Pengaturan Sistem Nasional', icon: ShieldCheck, color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400' },
      ]
    : isAdmin
    ? [
        { to: '/settings', label: 'Pengaturan Instansi & Rekening', icon: Settings, color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400' },
        { to: '/files', label: 'File Manager & Dokumen', icon: FolderOpen, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
        { to: '/activity-center', label: 'Activity Center', icon: Activity, color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
      ]
    : []

  if (activeView === 'form') {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <button
          onClick={() => setActiveView(null)}
          className="inline-flex items-center gap-2 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3.5 py-2 text-xs font-bold text-ink dark:text-white shadow-2xs hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Menu Akun</span>
        </button>

        <ProfileForm />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-12">
      {/* ── CARD 1: USER INFO CARD (SESUAI CONTOH VIDEO) ── */}
      <div className="rounded-3xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-6 shadow-sm text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 ring-4 ring-emerald-500/20 shadow-xs">
          <Avatar src={profile?.avatar_url || profile?.foto} name={displayName} size={76} />
        </div>

        <h2 className="mt-3.5 text-lg sm:text-xl font-extrabold text-ink dark:text-white tracking-tight">
          {displayName}
        </h2>
        <p className="text-xs text-ink-muted dark:text-ink-muted-dark font-medium mt-0.5">
          {user?.email || '-'}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Shield className="h-3.5 w-3.5" />
            <span>{userRole}</span>
          </span>
          {instansiName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-0.5 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
              <InstansiIcon className="h-3.5 w-3.5" />
              <span>{instansiName}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── CARD 2: PENGATURAN AKUN ── */}
      <div className="rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-1.5 shadow-2xs divide-y divide-border/60 dark:divide-border-dark/60">
        <button
          type="button"
          onClick={() => setActiveView('form')}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink dark:text-white">Edit Profil</p>
              <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">Ubah nama dan foto profil akun</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => setActiveView('form')}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink dark:text-white">Ubah Password</p>
              <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">Perbarui kata sandi akun login Anda</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
        </button>

        {instansiSaya?.nomor_rekening && (
          <div className="w-full flex items-center justify-between p-3.5 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink dark:text-white">Rekening Tujuan</p>
                <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 truncate">
                  {instansiSaya.nama_bank} • {instansiSaya.nomor_rekening}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CARD 3: MASTER DATA (DARI HAMBURGER) ── */}
      <div className="space-y-1.5">
        <h3 className="px-2 text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
          Master Data
        </h3>
        <div className="rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-1.5 shadow-2xs divide-y divide-border/60 dark:divide-border-dark/60">
          {masterDataMenus.map((menu) => (
            <Link
              key={menu.to}
              to={menu.to}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105', menu.color)}>
                  <menu.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-ink dark:text-white">{menu.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── CARD 4: KEUANGAN & TRANSAKSI (DARI HAMBURGER) ── */}
      <div className="space-y-1.5">
        <h3 className="px-2 text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark flex items-center gap-1.5">
          <KeuanganIcon className="h-4 w-4" />
          <span>Keuangan & Transaksi</span>
        </h3>
        <div className="rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-1.5 shadow-2xs divide-y divide-border/60 dark:divide-border-dark/60">
          {keuanganMenus.map((menu) => (
            <Link
              key={menu.to}
              to={menu.to}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105', menu.color)}>
                  <menu.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-ink dark:text-white">{menu.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── CARD 5: SISTEM & MONITORING (DARI HAMBURGER) ── */}
      {sistemMenus.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="px-2 text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
            Sistem & Monitoring
          </h3>
          <div className="rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-1.5 shadow-2xs divide-y divide-border/60 dark:divide-border-dark/60">
            {sistemMenus.map((menu) => (
              <Link
                key={menu.to}
                to={menu.to}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105', menu.color)}>
                    <menu.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-ink dark:text-white">{menu.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── CARD 6: LOGOUT (SESUAI CONTOH VIDEO) ── */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/15 p-1.5 shadow-2xs">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3.5 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 rounded-xl transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Logout / Keluar</span>
          </div>
          <ChevronRight className="h-4 w-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* ── FOOTER APLIKASI (SESUAI CONTOH VIDEO) ── */}
      <div className="pt-4 text-center text-xs text-ink-muted dark:text-ink-muted-dark space-y-1">
        <p className="font-bold text-ink dark:text-white">SIQURBAN Tabungan Qurban</p>
        <p className="text-[11px]">Versi 1.0.0 • Sistem Manajemen Qurban Terpadu</p>
      </div>
    </div>
  )
}
