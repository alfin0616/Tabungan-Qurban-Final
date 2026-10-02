import { useState } from 'react'
import {
  Activity,
  Search,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Calendar,
  Shield,
  Wallet,
  ScrollText,
  User,
  Globe,
  Monitor,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useActivityLogs, useActivityStats } from '../../hooks/useActivityLogs'
import { ACTION_CATEGORIES, getCategoryInfoForAction, auditRepository } from '../../repositories/auditRepository'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { exportLaporanExcel } from '../../utils/exportExcel'
import { exportLaporanCsv } from '../../utils/exportCsv'
import { cn } from '../../lib/cn'

const PAGE_SIZE = 20

export default function ActivityCenterPage() {
  const { isSuperAdmin } = useAuth()
  const [category, setCategory] = useState('semua')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  // ---- Query Data ----
  const { data: logData, isLoading, refetch, isRefetching } = useActivityLogs({
    page,
    limit: PAGE_SIZE,
    category,
    search,
    startDate,
    endDate,
  })

  const { data: stats } = useActivityStats()

  const logs = logData?.data || []
  const totalCount = logData?.count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // ---- Export Excel / CSV ----
  async function handleExport(formatType = 'excel') {
    if (!logs.length) {
      toast.error('Tidak ada data aktivitas untuk diekspor')
      return
    }

    try {
      setExporting(true)
      const columns = [
        'No',
        'Waktu Kejadian',
        'Nama Pengguna',
        'Role',
        'Instansi',
        'Kategori',
        'Aksi',
        'Deskripsi',
        'IP Address',
        'Browser',
      ]

      const rows = logs.map((item, idx) => {
        const catInfo = getCategoryInfoForAction(item.action)
        return [
          (page - 1) * PAGE_SIZE + idx + 1,
          format(new Date(item.created_at), 'dd MMM yyyy HH:mm:ss', { locale: idLocale }),
          item.user?.full_name || 'System / Unknown',
          item.role || '-',
          item.instansi?.nama_instansi || '-',
          catInfo.label,
          item.action,
          item.description || '-',
          item.ip_address || '-',
          item.user_agent || '-',
        ]
      })

      const title = `Laporan-Activity-Center-${format(new Date(), 'yyyyMMdd-HHmm')}`
      if (formatType === 'excel') {
        await exportLaporanExcel({ title, columns, rows, sheetName: 'Activity Center' })
        toast.success('Berhasil mendownload laporan aktivitas (Excel)')
        auditRepository.log('EXPORT', 'Mengunduh laporan Activity Center ke Excel (.xlsx)')
      } else {
        exportLaporanCsv({ title, columns, rows })
        toast.success('Berhasil mendownload laporan aktivitas (CSV)')
        auditRepository.log('EXPORT', 'Mengunduh laporan Activity Center ke CSV')
      }
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Gagal mendownload file aktivitas')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ======== HEADER & REALTIME INDICATOR ======== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-emerald-600" />
            <h1 className="text-xl font-bold text-ink dark:text-ink-dark sm:text-2xl">
              Activity Center
            </h1>
          </div>
          <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-muted-dark">
            Pantau seluruh riwayat aktivitas sistem, autentikasi, transaksi, dan perubahan data secara realtime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Realtime WebSocket badge indicator */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            Realtime Active
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RotateCcw className={cn('h-4 w-4', (isLoading || isRefetching) && 'animate-spin')} />{' '}
            Refresh
          </Button>
        </div>
      </div>

      {/* ======== SUMMARY CARDS ======== */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft dark:border-border-dark dark:bg-surface-dark">
          <div className="flex items-center justify-between text-ink-muted dark:text-ink-muted-dark">
            <span className="text-xs font-semibold uppercase">Total Aktivitas</span>
            <ScrollText className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink dark:text-ink-dark">
            {(stats?.totalLogs || 0).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft dark:border-border-dark dark:bg-surface-dark">
          <div className="flex items-center justify-between text-ink-muted dark:text-ink-muted-dark">
            <span className="text-xs font-semibold uppercase">Hari Ini</span>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink dark:text-ink-dark">
            {(stats?.todayLogs || 0).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft dark:border-border-dark dark:bg-surface-dark">
          <div className="flex items-center justify-between text-ink-muted dark:text-ink-muted-dark">
            <span className="text-xs font-semibold uppercase">Keuangan & Payment</span>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink dark:text-ink-dark">
            {(stats?.paymentLogs || 0).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft dark:border-border-dark dark:bg-surface-dark">
          <div className="flex items-center justify-between text-ink-muted dark:text-ink-muted-dark">
            <span className="text-xs font-semibold uppercase">Sistem & Peran</span>
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink dark:text-ink-dark">
            {(stats?.systemLogs || 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* ======== FILTER BAR & CATEGORY PILLS ======== */}
      <Card>
        {/* Category Pills */}
        <div className="border-b border-border p-4 dark:border-border-dark">
          <div className="flex flex-wrap gap-2">
            {ACTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id)
                  setPage(1)
                }}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                  category === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-800/40',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search, Date Range & Export */}
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
              <input
                type="text"
                placeholder="Cari aksi, deskripsi, atau user..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="h-10 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(1)
                }}
                className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-ink-muted">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(1)
                }}
                className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                    setPage(1)
                  }}
                  className="text-xs text-danger hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={exporting || isLoading}
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={exporting || isLoading}
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* ======== ACTIVITY TABLE ======== */}
      <Card>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : !logs.length ? (
          <div className="p-10">
            <EmptyState
              icon={Activity}
              title="Aktivitas tidak ditemukan"
              description="Belum ada catatan aktivitas sistem yang sesuai dengan kriteria filter pencarian Anda."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-emerald-50/50 text-xs uppercase tracking-wider text-ink-muted dark:border-border-dark dark:bg-emerald-900/10 dark:text-ink-muted-dark">
                  <th className="py-3.5 pl-6 pr-4">Waktu</th>
                  <th className="py-3.5 pr-4">Pengguna</th>
                  {isSuperAdmin && <th className="py-3.5 pr-4">Instansi</th>}
                  <th className="py-3.5 pr-4">Kategori & Aksi</th>
                  <th className="py-3.5 pr-4">Deskripsi Aktivitas</th>
                  <th className="py-3.5 pr-6">Info Perangkat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border-dark">
                {logs.map((item) => {
                  const catInfo = getCategoryInfoForAction(item.action)
                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10"
                    >
                      <td className="whitespace-nowrap py-3.5 pl-6 pr-4 text-xs font-medium text-ink-muted dark:text-ink-muted-dark">
                        {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', {
                          locale: idLocale,
                        })}
                      </td>

                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs dark:bg-emerald-900/50 dark:text-emerald-300">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-ink dark:text-ink-dark">
                              {item.user?.full_name || 'System'}
                            </div>
                            <div className="text-[11px] uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
                              {item.role || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {isSuperAdmin && (
                        <td className="py-3.5 pr-4 text-xs font-medium text-ink-muted dark:text-ink-muted-dark">
                          {item.instansi?.nama_instansi || 'Nasional / Sistem'}
                        </td>
                      )}

                      <td className="py-3.5 pr-4">
                        <div className="flex flex-col items-start gap-1">
                          <Badge tone={catInfo.color}>{catInfo.label}</Badge>
                          <span className="font-mono text-xs font-bold text-ink dark:text-ink-dark">
                            {item.action}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 pr-4 text-ink dark:text-ink-dark max-w-md">
                        {item.description || '-'}
                      </td>

                      <td className="py-3.5 pr-6 text-xs text-ink-muted dark:text-ink-muted-dark">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Globe className="h-3 w-3 text-emerald-600" />
                          <span>{item.ip_address || '0.0.0.0'}</span>
                        </div>
                        <div
                          title={item.user_agent || ''}
                          className="mt-0.5 flex items-center gap-1.5 truncate max-w-[160px]"
                        >
                          <Monitor className="h-3 w-3 text-emerald-600" />
                          <span>
                            {item.user_agent
                              ? item.user_agent.split('/')[0] || item.user_agent
                              : 'Unknown'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ======== PAGINATION ======== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
            Menampilkan halaman <strong className="text-ink dark:text-ink-dark">{page}</strong> dari{' '}
            <strong className="text-ink dark:text-ink-dark">{totalPages}</strong> ({totalCount}{' '}
            total catatan)
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
