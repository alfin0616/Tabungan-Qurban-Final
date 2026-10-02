import { useState, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  FileType2,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Hash,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useLaporan, useInstansiList, useKelompokByInstansi } from '../../hooks/useLaporan'
import { useSettings } from '../../hooks/useSettings'
import { useAuth } from '../../context/AuthContext'
import { labelKategori } from '../../repositories/pengeluaranRepository'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { cn } from '../../lib/cn'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { exportLaporanPdf } from '../../utils/exportPdf'
import { exportLaporanExcel } from '../../utils/exportExcel'
import { exportLaporanCsv } from '../../utils/exportCsv'

const periodeOptions = [
  { value: 'harian', label: 'Harian' },
  { value: 'mingguan', label: 'Mingguan' },
  { value: 'bulanan', label: 'Bulanan' },
  { value: 'tahunan', label: 'Tahunan' },
  { value: 'custom', label: 'Custom' },
]

const jenisOptions = [
  { value: 'semua', label: 'Semua Jenis' },
  { value: 'setoran', label: 'Setoran' },
  { value: 'penarikan', label: 'Penarikan' },
]

const metodeOptions = [
  { value: 'semua', label: 'Semua Metode' },
  { value: 'tunai', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'qris', label: 'QRIS' },
]

const statusOptions = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Non-Aktif' },
]

const PAGE_SIZE = 20

export default function LaporanPage() {
  const { isSuperAdmin } = useAuth()
  const { data: settings } = useSettings()

  // ---- Filter State ----
  const [periode, setPeriode] = useState('bulanan')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalAkhir, setTanggalAkhir] = useState('')
  const [instansiId, setInstansiId] = useState('')
  const [kelompokId, setKelompokId] = useState('')
  const [jenisTransaksi, setJenisTransaksi] = useState('semua')
  const [metodePembayaran, setMetodePembayaran] = useState('semua')
  const [statusAnggota, setStatusAnggota] = useState('semua')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  // ---- Data Hooks ----
  const { data: instansiList } = useInstansiList()
  const { data: kelompokList } = useKelompokByInstansi(instansiId)

  const isCustomPeriode = periode === 'custom'
  const { data, isLoading } = useLaporan({
    periode: isCustomPeriode ? 'bulanan' : periode,
    reference: new Date(),
    tanggalMulai: isCustomPeriode ? tanggalMulai : undefined,
    tanggalAkhir: isCustomPeriode ? tanggalAkhir : undefined,
    instansiId: instansiId || undefined,
    kelompokId: kelompokId || undefined,
    jenisTransaksi,
    metodePembayaran,
    statusAnggota,
    search,
  })

  const isEmpty = !data?.transaksi?.length && !data?.pengeluaran?.length

  const trxParentRef = useRef(null)
  const pglParentRef = useRef(null)

  const trxVirtualizer = useVirtualizer({
    count: data?.transaksi?.length ?? 0,
    getScrollElement: () => trxParentRef.current,
    estimateSize: () => 53, // Approx row height
    overscan: 5,
  })

  const pglVirtualizer = useVirtualizer({
    count: data?.pengeluaran?.length ?? 0,
    getScrollElement: () => pglParentRef.current,
    estimateSize: () => 53,
    overscan: 5,
  })

  // ---- Export Helpers ----
  const columns = ['Tanggal', 'Anggota', 'Jenis', 'Metode', 'Nominal', 'Keterangan']

  const rows = [
    ...(data?.transaksi ?? []).map((t) => [
      formatDate(t.tanggal),
      t.anggota?.nama ?? '-',
      t.jenis === 'setoran' ? 'Setoran' : 'Penarikan',
      t.metode_pembayaran ?? '-',
      formatCurrency(t.nominal),
      t.keterangan || '-',
    ]),
    ...(data?.pengeluaran ?? []).map((p) => [
      formatDate(p.tanggal),
      '-',
      `Pengeluaran (${labelKategori(p.kategori)})`,
      '-',
      formatCurrency(p.nominal),
      p.keterangan || '-',
    ]),
  ]

  const exportTitle = `Laporan ${periodeOptions.find((p) => p.value === periode)?.label ?? ''} - ${settings?.nama_instansi ?? 'SIQURBAN'}`
  const exportSubtitle = data ? `Periode ${formatDate(data.range.start)} – ${formatDate(data.range.end)}` : ''

  const summaryData = [
    { label: 'Total Setoran', value: formatCurrency(data?.totalSetoran ?? 0) },
    { label: 'Total Penarikan', value: formatCurrency(data?.totalPenarikan ?? 0) },
    { label: 'Total Pengeluaran Operasional', value: formatCurrency(data?.totalPengeluaran ?? 0) },
    { label: 'Saldo Bersih Periode', value: formatCurrency(data?.saldoBersih ?? 0) },
    { label: 'Jumlah Transaksi', value: String(data?.totalTransaksi ?? 0) },
  ]

  async function handleExportPdf() {
    if (isEmpty) return toast.error('Tidak ada data untuk diekspor')
    try {
      await exportLaporanPdf({ title: exportTitle, subtitle: exportSubtitle, columns, rows, summary: summaryData })
      toast.success('PDF berhasil diunduh')
    } catch (e) {
      toast.error('Gagal mengekspor PDF')
    }
  }

  async function handleExportExcel() {
    if (isEmpty) return toast.error('Tidak ada data untuk diekspor')
    try {
      await exportLaporanExcel({ title: exportTitle, columns, rows })
      toast.success('Excel berhasil diunduh')
    } catch (e) {
      toast.error('Gagal mengekspor Excel')
    }
  }

  function handleExportCsv() {
    if (isEmpty) return toast.error('Tidak ada data untuk diekspor')
    exportLaporanCsv({ title: exportTitle, columns, rows })
    toast.success('CSV berhasil diunduh')
  }

  function handleResetFilters() {
    setPeriode('bulanan')
    setTanggalMulai('')
    setTanggalAkhir('')
    setInstansiId('')
    setKelompokId('')
    setJenisTransaksi('semua')
    setMetodePembayaran('semua')
    setStatusAnggota('semua')
    setSearch('')
  }

  // Jumlah filter aktif (selain default)
  const activeFilterCount = [
    instansiId,
    kelompokId,
    jenisTransaksi !== 'semua' ? jenisTransaksi : '',
    metodePembayaran !== 'semua' ? metodePembayaran : '',
    statusAnggota !== 'semua' ? statusAnggota : '',
    search,
    isCustomPeriode && tanggalMulai ? tanggalMulai : '',
  ].filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* ======== HEADER ======== */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-ink dark:text-ink-dark sm:text-2xl">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
            Report Center
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-muted-dark">
            Analisis laporan keuangan dengan filter lengkap & export multi-format.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={isEmpty || isLoading}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isEmpty || isLoading}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={isEmpty || isLoading}>
            <FileType2 className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      {/* ======== FILTER PANEL ======== */}
      <Card>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-ink-dark">
            <Filter className="h-4 w-4 text-emerald-600" />
            Filter Laporan
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </span>
          {showFilters ? <ChevronUp className="h-4 w-4 text-ink-muted" /> : <ChevronDown className="h-4 w-4 text-ink-muted" />}
        </button>

        {showFilters && (
          <div className="border-t border-border px-5 pb-5 pt-4 dark:border-border-dark">
            {/* Baris 1: Periode */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
                Periode
              </label>
              <div className="flex flex-wrap gap-2">
                {periodeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setPeriode(opt.value)
                      setTrxPage(1)
                      setPglPage(1)
                    }}
                    className={cn(
                      'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                      periode === opt.value
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-800/40',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            {isCustomPeriode && (
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => { setTanggalMulai(e.target.value) }}
                    className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={tanggalAkhir}
                    onChange={(e) => { setTanggalAkhir(e.target.value) }}
                    className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            )}

            {/* Baris 2: Dropdowns */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Filter Instansi (SuperAdmin only) */}
              {isSuperAdmin && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                    Instansi
                  </label>
                  <select
                    value={instansiId}
                    onChange={(e) => {
                      setInstansiId(e.target.value)
                      setKelompokId('')
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-8 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Semua Instansi</option>
                    {(instansiList ?? []).map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nama_instansi}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filter Kelompok */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                  Kelompok
                </label>
                <select
                  value={kelompokId}
                  onChange={(e) => { setKelompokId(e.target.value) }}
                  disabled={isSuperAdmin && !instansiId}
                  className="h-10 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-8 text-sm text-ink disabled:opacity-50 dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Semua Kelompok</option>
                  {(kelompokList ?? []).map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelompok} ({k.jenis_qurban})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status Anggota */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                  Status Anggota
                </label>
                <select
                  value={statusAnggota}
                  onChange={(e) => { setStatusAnggota(e.target.value) }}
                  className="h-10 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-8 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Filter Metode Pembayaran */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                  Metode Pembayaran
                </label>
                <select
                  value={metodePembayaran}
                  onChange={(e) => { setMetodePembayaran(e.target.value) }}
                  className="h-10 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-8 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {metodeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Baris 3: Jenis + Search + Reset */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                  Jenis Transaksi
                </label>
                <div className="flex gap-2">
                  {jenisOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setJenisTransaksi(opt.value) }}
                      className={cn(
                        'rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                        jenisTransaksi === opt.value
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-800/40',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full sm:w-64">
                <label className="mb-1 block text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                  Cari Anggota
                </label>
                <input
                  type="text"
                  placeholder="Nama atau kode anggota..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value) }}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <Button variant="outline" size="sm" onClick={handleResetFilters} className="shrink-0">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ======== CONTENT ======== */}
      {isLoading ? (
        <div className="flex h-60 items-center justify-center">
          <Spinner />
        </div>
      ) : isEmpty ? (
        <Card>
          <div className="p-8">
            <EmptyState icon={FileDown} title="Tidak ada data pada filter ini" description="Coba ubah filter atau periode untuk melihat laporan." />
          </div>
        </Card>
      ) : (
        <>
          {/* ======== SUMMARY CARDS ======== */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 dark:border-emerald-800 dark:from-emerald-900/30 dark:to-emerald-900/10">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <ArrowDownCircle className="h-4 w-4" /> Total Setoran
              </div>
              <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-200">
                {formatCurrency(data.totalSetoran)}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-4 dark:border-red-800 dark:from-red-900/30 dark:to-red-900/10">
              <div className="flex items-center gap-2 text-xs font-semibold text-danger">
                <ArrowUpCircle className="h-4 w-4" /> Total Penarikan
              </div>
              <p className="mt-1 text-lg font-bold text-danger">
                {formatCurrency(data.totalPenarikan)}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 dark:border-amber-800 dark:from-amber-900/30 dark:to-amber-900/10">
              <div className="flex items-center gap-2 text-xs font-semibold text-warning">
                <Wallet className="h-4 w-4" /> Total Pengeluaran
              </div>
              <p className="mt-1 text-lg font-bold text-warning">
                {formatCurrency(data.totalPengeluaran)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 dark:border-slate-700 dark:from-slate-800/30 dark:to-slate-800/10">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                <Hash className="h-4 w-4" /> Jumlah Transaksi
              </div>
              <p className="mt-1 text-lg font-bold text-ink dark:text-ink-dark">
                {data.totalTransaksi}
              </p>
            </div>

            <div className={cn(
              'col-span-2 rounded-2xl border p-4 lg:col-span-1',
              data.saldoBersih >= 0
                ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100/50 dark:border-emerald-800 dark:from-emerald-900/30 dark:to-teal-900/10'
                : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-100/50 dark:border-red-800 dark:from-red-900/30 dark:to-rose-900/10',
            )}>
              <div className={cn(
                'flex items-center gap-2 text-xs font-semibold',
                data.saldoBersih >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-danger',
              )}>
                {data.saldoBersih >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                Saldo Bersih
              </div>
              <p className={cn('mt-1 text-lg font-bold', data.saldoBersih >= 0 ? 'text-emerald-700 dark:text-emerald-200' : 'text-danger')}>
                {formatCurrency(data.saldoBersih)}
              </p>
            </div>
          </div>

          {/* ======== TRANSAKSI TABLE ======== */}
          {!!data.transaksi.length && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Transaksi Anggota
                  <span className="ml-2 text-sm font-normal text-ink-muted dark:text-ink-muted-dark">
                    ({data.transaksi.length} data)
                  </span>
                </CardTitle>
              </CardHeader>
              <div ref={trxParentRef} className="max-h-[500px] overflow-auto px-5 pb-5">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white shadow-sm dark:bg-surface-dark">
                    <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
                      <th className="py-2.5 pr-4">Tanggal</th>
                      <th className="py-2.5 pr-4">Anggota</th>
                      <th className="py-2.5 pr-4">Jenis</th>
                      <th className="py-2.5 pr-4">Metode</th>
                      <th className="py-2.5 pr-4 text-right">Nominal</th>
                      <th className="py-2.5 pr-4">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-border-dark">
                    {trxVirtualizer.getVirtualItems().length > 0 && trxVirtualizer.getVirtualItems()[0].start > 0 && (
                      <tr><td colSpan={6} style={{ height: trxVirtualizer.getVirtualItems()[0].start }} /></tr>
                    )}
                    
                    {trxVirtualizer.getVirtualItems().map((virtualRow) => {
                      const t = data.transaksi[virtualRow.index]
                      return (
                        <tr key={t.id} className="transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                          <td className="py-2.5 pr-4 text-ink-muted dark:text-ink-muted-dark">{formatDate(t.tanggal)}</td>
                          <td className="py-2.5 pr-4 font-medium text-ink dark:text-ink-dark">{t.anggota?.nama ?? '-'}</td>
                          <td className="py-2.5 pr-4">
                            <Badge tone={t.jenis === 'setoran' ? 'emerald' : 'danger'}>
                              {t.jenis === 'setoran' ? 'Setoran' : 'Penarikan'}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-medium uppercase text-ink-muted dark:text-ink-muted-dark">
                              {t.metode_pembayaran ?? '-'}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right font-semibold text-ink dark:text-ink-dark">
                            {formatCurrency(t.nominal)}
                          </td>
                          <td className="py-2.5 pr-4 text-ink-muted dark:text-ink-muted-dark">{t.keterangan || '-'}</td>
                        </tr>
                      )
                    })}

                    {trxVirtualizer.getVirtualItems().length > 0 && trxVirtualizer.getTotalSize() - trxVirtualizer.getVirtualItems()[trxVirtualizer.getVirtualItems().length - 1].end > 0 && (
                      <tr><td colSpan={6} style={{ height: trxVirtualizer.getTotalSize() - trxVirtualizer.getVirtualItems()[trxVirtualizer.getVirtualItems().length - 1].end }} /></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ======== PENGELUARAN TABLE ======== */}
          {!!data.pengeluaran.length && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Pengeluaran Operasional
                  <span className="ml-2 text-sm font-normal text-ink-muted dark:text-ink-muted-dark">
                    ({data.pengeluaran.length} data)
                  </span>
                </CardTitle>
              </CardHeader>
              <div ref={pglParentRef} className="max-h-[500px] overflow-auto px-5 pb-5">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white shadow-sm dark:bg-surface-dark">
                    <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
                      <th className="py-2.5 pr-4">Tanggal</th>
                      <th className="py-2.5 pr-4">Kategori</th>
                      <th className="py-2.5 pr-4 text-right">Nominal</th>
                      <th className="py-2.5 pr-4">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-border-dark">
                    {pglVirtualizer.getVirtualItems().length > 0 && pglVirtualizer.getVirtualItems()[0].start > 0 && (
                      <tr><td colSpan={4} style={{ height: pglVirtualizer.getVirtualItems()[0].start }} /></tr>
                    )}
                    
                    {pglVirtualizer.getVirtualItems().map((virtualRow) => {
                      const p = data.pengeluaran[virtualRow.index]
                      return (
                        <tr key={p.id} className="transition-colors hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                          <td className="py-2.5 pr-4 text-ink-muted dark:text-ink-muted-dark">{formatDate(p.tanggal)}</td>
                          <td className="py-2.5 pr-4">
                            <Badge tone="warning">{labelKategori(p.kategori)}</Badge>
                          </td>
                          <td className="py-2.5 pr-4 text-right font-semibold text-warning">{formatCurrency(p.nominal)}</td>
                          <td className="py-2.5 pr-4 text-ink-muted dark:text-ink-muted-dark">{p.keterangan || '-'}</td>
                        </tr>
                      )
                    })}

                    {pglVirtualizer.getVirtualItems().length > 0 && pglVirtualizer.getTotalSize() - pglVirtualizer.getVirtualItems()[pglVirtualizer.getVirtualItems().length - 1].end > 0 && (
                      <tr><td colSpan={4} style={{ height: pglVirtualizer.getTotalSize() - pglVirtualizer.getVirtualItems()[pglVirtualizer.getVirtualItems().length - 1].end }} /></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
