import { memo } from 'react'
import {
  Building2,
  Users,
  Layers,
  Wallet,
  Target,
  Receipt,
  TrendingUp,
  TrendingDown,
  Crown,
  Trophy,
  Award,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CalendarDays,
  UserCheck,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import {
  useStatistikNasional,
  useGrafikSetoranNasional,
  useTopInstansi,
  useTopKelompok,
  useTransaksiTerbaruNasional,
  useGrafikPerInstansi,
  useGrafikSetoranHarian,
  useGrafikSetoranTahunan,
  useJamaahTeraktif,
} from '../../hooks/useSuperAdminDashboard'
import { useTheme } from '../../context/ThemeContext'
import StatCard from '../../components/cards/StatCard'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import AiInsightCard from '../../components/dashboard/AiInsightCard'

// ─── Tooltip kustom untuk recharts ───────────────────────────────────────────
const CustomTooltipCurrency = memo(function CustomTooltipCurrency({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 text-xs shadow-soft">
      <p className="mb-1 font-semibold text-ink dark:text-ink-dark">{label}</p>
      <p className="text-emerald-600 dark:text-emerald-400">{formatCurrency(payload[0].value)}</p>
    </div>
  )
})

const CustomTooltipPct = memo(function CustomTooltipPct({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 text-xs shadow-soft">
      <p className="mb-1 font-semibold text-ink dark:text-ink-dark">{label}</p>
      <p className="text-emerald-600 dark:text-emerald-400">{payload[0].value}%</p>
      {payload[1] && (
        <p className="text-ink-muted dark:text-ink-muted-dark">
          Saldo: {formatCurrency(payload[1].value)}
        </p>
      )}
    </div>
  )
})

// ─── Progress bar nasional ────────────────────────────────────────────────────
const ProgressNasional = memo(function ProgressNasional({ saldo, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((saldo / target) * 100)) : 0
  const tone =
    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-warning' : 'bg-danger'
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Nasional</CardTitle>
        <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
          Akumulasi Semua Instansi
        </span>
      </CardHeader>
      <div className="space-y-3">
        <div className="flex items-end justify-between text-sm">
          <span className="text-ink-muted dark:text-ink-muted-dark">Total Terkumpul</span>
          <span className="text-2xl font-bold text-ink dark:text-ink-dark">
            {pct}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-border dark:bg-border-dark">
          <div
            className={`h-full rounded-full transition-all duration-700 ${tone}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-ink-muted dark:text-ink-muted-dark">
          <span>{formatCurrency(saldo)} terkumpul</span>
          <span>Target {formatCurrency(target)}</span>
        </div>
      </div>
    </Card>
  )
})

// ─── Tabel transaksi terbaru ──────────────────────────────────────────────────
const TransaksiRow = memo(function TransaksiRow({ item }) {
  const isSetoran = item.jenis === 'setoran'
  return (
    <tr className="border-b border-border dark:border-border-dark last:border-0 hover:bg-emerald-50/30 dark:hover:bg-slate-700/30 transition-colors">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
              isSetoran
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-danger-100 text-danger dark:bg-danger/10'
            }`}
          >
            {isSetoran ? (
              <ArrowDownCircle className="h-4 w-4" />
            ) : (
              <ArrowUpCircle className="h-4 w-4" />
            )}
          </span>
          <div>
            <p className="text-sm font-medium text-ink dark:text-ink-dark leading-tight">
              {item.nama_anggota}
            </p>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
              {item.nama_instansi}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 hidden sm:table-cell">
        <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
          {item.nama_kelompok ?? '—'}
        </span>
      </td>
      <td className="py-3 pr-4 hidden md:table-cell">
        <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
          {formatDate(item.tanggal)}
        </span>
      </td>
      <td className="py-3 text-right">
        <span
          className={`font-semibold text-sm ${
            isSetoran
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-danger'
          }`}
        >
          {isSetoran ? '+' : '−'}
          {formatCurrency(item.nominal)}
        </span>
      </td>
    </tr>
  )
})

// ─── Halaman utama ─────────────────────────────────────────────────────────────
export default function SuperAdminDashboardPage() {
  const { isDark } = useTheme()
  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    tick: isDark ? '#94a3b8' : '#64748b',
    line: isDark ? '#34d399' : '#059669',
    bar: isDark ? '#059669' : '#10b981',
    bar2: isDark ? '#f59e0b' : '#f59e0b',
  }

  const { data: statistik, isLoading: loadingStats } = useStatistikNasional()
  const { data: grafikNasional, isLoading: loadingGrafik } = useGrafikSetoranNasional()
  const { data: grafikHarian, isLoading: loadingGrafikHarian } = useGrafikSetoranHarian()
  const { data: grafikTahunan, isLoading: loadingGrafikTahunan } = useGrafikSetoranTahunan()
  const { data: transaksiTerbaru, isLoading: loadingTransaksi } = useTransaksiTerbaruNasional(10)
  const { data: grafikInstansi, isLoading: loadingGrafikInstansi } = useGrafikPerInstansi()

  const totalSaldo = Number(statistik?.total_saldo ?? 0)
  const totalTarget = Number(statistik?.total_target ?? 0)
  const growthBulanan = Number(statistik?.growth_bulanan ?? 0)
  const growthTahunan = Number(statistik?.growth_tahunan ?? 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-soft">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink dark:text-ink-dark">Dashboard Analitik Super Admin</h2>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
              Monitoring analitik nasional lintas seluruh instansi
            </p>
          </div>
        </div>

        {/* Growth Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-1.5 text-xs shadow-sm">
            <span className="text-ink-muted dark:text-ink-muted-dark">Growth Bulanan:</span>
            <span className={`font-bold flex items-center gap-0.5 ${growthBulanan >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}>
              {growthBulanan >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {growthBulanan >= 0 ? `+${growthBulanan}%` : `${growthBulanan}%`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-1.5 text-xs shadow-sm">
            <span className="text-ink-muted dark:text-ink-muted-dark">Growth Tahunan:</span>
            <span className={`font-bold flex items-center gap-0.5 ${growthTahunan >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}>
              {growthTahunan >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {growthTahunan >= 0 ? `+${growthTahunan}%` : `${growthTahunan}%`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards (6) ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={Building2}
          tone="emerald"
          label="Total Instansi"
          value={loadingStats ? '—' : statistik?.total_instansi ?? 0}
        />
        <StatCard
          icon={Layers}
          tone="emerald"
          label="Total Kelompok"
          value={loadingStats ? '—' : statistik?.total_kelompok ?? 0}
        />
        <StatCard
          icon={Users}
          tone="emerald"
          label="Total Jamaah"
          value={loadingStats ? '—' : statistik?.total_jamaah ?? 0}
        />
        <StatCard
          icon={Wallet}
          tone="warning"
          label="Total Saldo"
          value={loadingStats ? '—' : formatCurrency(totalSaldo)}
        />
        <StatCard
          icon={Target}
          tone="emerald"
          label="Total Target"
          value={loadingStats ? '—' : formatCurrency(totalTarget)}
        />
        <StatCard
          icon={Receipt}
          tone="danger"
          label="Transaksi Bulan Ini"
          value={loadingStats ? '—' : statistik?.total_transaksi ?? 0}
        />
      </div>

      {/* ── AI Smart Insight Widget ── */}
      <AiInsightCard />

      {/* ── Progress Nasional ── */}
      <ProgressNasional saldo={totalSaldo} target={totalTarget} />

      {/* ── Grafik Setoran Harian & Grafik Setoran Bulanan ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Grafik Setoran Harian (30 Hari Terakhir) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Grafik Setoran Harian (30 Hari Terakhir)
            </CardTitle>
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
              Setoran berhasil harian
            </span>
          </CardHeader>
          {loadingGrafikHarian ? (
            <div className="flex h-56 items-center justify-center">
              <Spinner />
            </div>
          ) : !grafikHarian?.length ? (
            <EmptyState title="Belum ada data setoran" description="Grafik harian akan muncul setelah ada transaksi." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={grafikHarian} margin={{ top: 5, right: 8, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="gradHarian" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.line} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={chartColors.line} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="tanggal"
                    tick={{ fontSize: 10, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                    height={30}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1_000_000}jt`}
                  />
                  <Tooltip content={<CustomTooltipCurrency />} />
                  <Area
                    type="monotone"
                    dataKey="total_setoran"
                    stroke={chartColors.line}
                    strokeWidth={2}
                    fill="url(#gradHarian)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Grafik Setoran Nasional (Bulanan) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Grafik Setoran Bulanan
            </CardTitle>
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
              Akumulasi bulanan
            </span>
          </CardHeader>
          {loadingGrafik ? (
            <div className="flex h-56 items-center justify-center">
              <Spinner />
            </div>
          ) : !grafikNasional?.length ? (
            <EmptyState title="Belum ada data setoran" description="Grafik akan muncul setelah ada transaksi." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={grafikNasional} margin={{ top: 5, right: 8, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="gradNasional" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.line} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={chartColors.line} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="bulan"
                    tick={{ fontSize: 10, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1_000_000}jt`}
                  />
                  <Tooltip content={<CustomTooltipCurrency />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={chartColors.line}
                    strokeWidth={2}
                    fill="url(#gradNasional)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* ── Grafik Setoran Tahunan & Progress Per Instansi ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Grafik Setoran Tahunan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Grafik Setoran Tahunan
            </CardTitle>
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
              Perbandingan akumulasi per tahun
            </span>
          </CardHeader>
          {loadingGrafikTahunan ? (
            <div className="flex h-56 items-center justify-center">
              <Spinner />
            </div>
          ) : !grafikTahunan?.length ? (
            <EmptyState title="Belum ada data" description="Grafik tahunan akan tampil setelah ada setoran." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafikTahunan} margin={{ top: 5, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="tahun"
                    tick={{ fontSize: 11, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1_000_000}jt`}
                  />
                  <Tooltip content={<CustomTooltipCurrency />} />
                  <Bar dataKey="total_setoran" fill={chartColors.bar} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Grafik Perbandingan Per Instansi (Bar) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Progress per Instansi
            </CardTitle>
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
              % Saldo / Target
            </span>
          </CardHeader>
          {loadingGrafikInstansi ? (
            <div className="flex h-56 items-center justify-center">
              <Spinner />
            </div>
          ) : !grafikInstansi?.length ? (
            <EmptyState title="Belum ada data" description="Data akan muncul setelah ada instansi aktif." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={grafikInstansi}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="category"
                    dataKey="nama_instansi"
                    tick={{ fontSize: 10, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltipPct />} />
                  <Bar dataKey="progress_pct" radius={[0, 6, 6, 0]}>
                    {(grafikInstansi ?? []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.progress_pct >= 80 ? chartColors.line : entry.progress_pct >= 50 ? chartColors.bar2 : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* ── 10 Transaksi Terbaru ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            10 Transaksi Terbaru
          </CardTitle>
          <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
            Lintas semua instansi
          </span>
        </CardHeader>
        {loadingTransaksi ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : !transaksiTerbaru?.length ? (
          <EmptyState
            title="Belum ada transaksi"
            description="Transaksi akan tampil setelah ada setoran atau penarikan."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border dark:border-border-dark">
                  <th className="pb-2 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                    Anggota / Instansi
                  </th>
                  <th className="hidden sm:table-cell pb-2 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                    Kelompok
                  </th>
                  <th className="hidden md:table-cell pb-2 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                    Tanggal
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody>
                {transaksiTerbaru.map((item) => (
                  <TransaksiRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
