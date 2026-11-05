import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Wallet,
  TrendingUp,
  Receipt,
  TrendingDown,
  Coins,
  History,
  FileBarChart,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  Clock,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useDashboardSummary, useGrafikSetoran } from '../../hooks/useDashboard'
import { useRiwayatTransaksi } from '../../hooks/useTransaksi'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/cards/StatCard'
import TargetQurbanCard from '../../components/cards/TargetQurbanCard'
import AiInsightCard from '../../components/dashboard/AiInsightCard'
import WaPaymentReminderCard from '../../components/dashboard/WaPaymentReminderCard'
import InfoRekeningInstansiCard from '../../components/cards/InfoRekeningInstansiCard'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { SkeletonCard, SkeletonChart } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Avatar from '../../components/ui/Avatar'
import { formatDate } from '../../utils/formatDate'
import {
  formatCurrency,
  formatChartAxisCurrency,
} from '../../utils/formatCurrency'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 text-xs shadow-soft">
      <p className="mb-1 font-semibold text-ink dark:text-ink-dark">{label}</p>
      <p className="font-bold text-emerald-600 dark:text-emerald-400">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { isDark } = useTheme()
  const { user, profile, isAdmin, instansiSaya } = useAuth()
  const [periodeGrafik, setPeriodeGrafik] = useState('bulanan')

  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    tick: isDark ? '#94a3b8' : '#64748b',
    line: isDark ? '#34d399' : '#059669',
  }

  const { data: summary, isLoading: loadingSummary } = useDashboardSummary()
  const { data: grafik, isLoading: loadingGrafik } = useGrafikSetoran(periodeGrafik)
  const { data: riwayatData, isLoading: loadingRiwayat } = useRiwayatTransaksi({ page: 1, limit: 5 })

  const displayName = profile?.nama || user?.user_metadata?.nama || (isAdmin ? 'Admin Instansi' : 'Jamaah')
  const instansiName = instansiSaya?.nama_instansi || (isAdmin ? 'Admin Panel Instansi' : 'Jamaah Tabungan Qurban')

  const recentTransactions = Array.isArray(riwayatData?.data) ? riwayatData.data.slice(0, 5) : []

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── 1. GREETING HEADER MOBILE (< 768px): Minimalis Sesuai Contoh App ── */}
      <div className="flex md:hidden items-center justify-between pt-1">
        <div className="min-w-0 pr-3">
          <h1 className="text-xl font-extrabold text-ink dark:text-white tracking-tight truncate">
            Halo, {displayName}
          </h1>
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark font-medium truncate mt-0.5">
            {instansiName}
          </p>
        </div>
        <Link
          to="/profile"
          title="Buka Profil"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20 shadow-xs active:scale-95 transition-transform"
        >
          <Avatar src={profile?.foto} name={displayName} size={38} />
        </Link>
      </div>

      {/* Informasi Rekening Instansi */}
      <InfoRekeningInstansiCard />

      {/* ── 2. SECTION RINGKASAN: Grid 2-Kolom Minimalis di Mobile ── */}
      <div>
        <div className="mb-2 sm:mb-3 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-ink dark:text-white">Ringkasan</h2>
          <span className="text-xs text-ink-muted dark:text-ink-muted-dark hidden sm:inline">
            Statistik tabungan qurban musim ini
          </span>
        </div>

        {loadingSummary ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard count={5} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Users}
              tone="emerald"
              label="Total Anggota"
              value={summary?.totalAnggota ?? 0}
              hint="Klik untuk lihat daftar Anggota"
              to="/anggota"
            />
            <StatCard
              icon={Wallet}
              tone="warning"
              label="Total Saldo"
              value={formatCurrency(summary?.totalSaldo)}
              hint="Sudah dikurangi pengeluaran • Klik ke Tabungan"
              to="/tabungan"
            />
            <StatCard
              icon={TrendingUp}
              tone="emerald"
              label="Setoran Bulan Ini"
              value={formatCurrency(summary?.setoranBulanIni)}
              hint={
                isAdmin
                  ? 'Klik nominal untuk menu Setoran'
                  : 'Klik nominal untuk Riwayat Setoran'
              }
              to={isAdmin ? '/transaksi/setoran' : '/transaksi/riwayat'}
            />
            <StatCard
              icon={TrendingDown}
              tone="danger"
              label="Pengeluaran"
              value={formatCurrency(summary?.totalPengeluaranBulanIni)}
              hint={
                isAdmin
                  ? 'Operasional masjid • Klik ke Pengeluaran'
                  : 'Operasional masjid • Klik ke Laporan'
              }
              to={isAdmin ? '/pengeluaran' : '/laporan'}
            />
            <StatCard
              icon={Receipt}
              tone="info"
              label="Transaksi"
              value={summary?.jumlahTransaksi ?? 0}
              hint="Bulan berjalan • Klik ke Riwayat Transaksi"
              to="/transaksi/riwayat"
            />
          </div>
        )}
      </div>

      {/* ── 3. SECTION MENU CEPAT: Sesuai Referensi App ── */}
      <div>
        <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-bold text-ink dark:text-white">
          Menu Cepat
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {isAdmin ? (
            <>
              <Link
                to="/transaksi/setoran"
                className="group flex flex-col items-center justify-center rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 text-center shadow-2xs hover:border-emerald-500 hover:shadow-sm transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <ArrowDownCircle className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-bold text-ink dark:text-white">Setoran</span>
                <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark">Catat kas</span>
              </Link>

              <Link
                to="/anggota"
                className="group flex flex-col items-center justify-center rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 text-center shadow-2xs hover:border-emerald-500 hover:shadow-sm transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-bold text-ink dark:text-white">Anggota</span>
                <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark">Data jamaah</span>
              </Link>

              <Link
                to="/kelompok"
                className="group flex flex-col items-center justify-center rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 text-center shadow-2xs hover:border-emerald-500 hover:shadow-sm transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-bold text-ink dark:text-white">Kelompok</span>
                <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark">Grup qurban</span>
              </Link>

              <Link
                to="/pengeluaran"
                className="group flex flex-col items-center justify-center rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 text-center shadow-2xs hover:border-emerald-500 hover:shadow-sm transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-bold text-ink dark:text-white">Pengeluaran</span>
                <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark">Operasional</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/tabungan"
                className="group flex flex-col items-center justify-center rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 text-center shadow-2xs hover:border-emerald-500 hover:shadow-sm transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Coins className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-bold text-ink dark:text-white">Tabungan</span>
                <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark">Saldo & target</span>
              </Link>

              <Link
                to="/transaksi/riwayat"
                className="group flex flex-col items-center justify-center rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 text-center shadow-2xs hover:border-emerald-500 hover:shadow-sm transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <History className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-bold text-ink dark:text-white">Riwayat</span>
                <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark">Bukti setoran</span>
              </Link>

              <Link
                to="/laporan"
                className="group flex flex-col items-center justify-center rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 text-center shadow-2xs hover:border-emerald-500 hover:shadow-sm transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                  <FileBarChart className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-bold text-ink dark:text-white">Laporan PDF</span>
                <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark">Rekap resmi</span>
              </Link>

              <Link
                to="/profile"
                className="group flex flex-col items-center justify-center rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 text-center shadow-2xs hover:border-emerald-500 hover:shadow-sm transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-bold text-ink dark:text-white">Akun Saya</span>
                <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark">Profil & PIN</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── 4. TARGET QURBAN & GRAFIK (DIAGRAM DISEMBUNYIKAN DI MOBILE) ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Grafik Setoran HANYA TAMPIL DI DESKTOP (hidden md:block) sesuai arahan user */}
        <Card className="hidden md:block xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>
                Grafik Setoran ({periodeGrafik === 'mingguan' ? 'Mingguan' : 'Bulanan'})
              </CardTitle>
              <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-muted-dark">
                Akumulasi setoran fleksibel tanpa batas waktu hangus
              </p>
            </div>

            {/* Pilihan Tampilan Grafik Setoran Bulanan vs Mingguan */}
            <div className="inline-flex rounded-xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark p-1">
              <button
                type="button"
                onClick={() => setPeriodeGrafik('bulanan')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  periodeGrafik === 'bulanan'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
                }`}
              >
                Setoran Bulanan
              </button>
              <button
                type="button"
                onClick={() => setPeriodeGrafik('mingguan')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  periodeGrafik === 'mingguan'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
                }`}
              >
                Setoran Mingguan
              </button>
            </div>
          </CardHeader>

          {loadingGrafik ? (
            <SkeletonChart />
          ) : !grafik?.length ? (
            <EmptyState
              title="Belum ada data setoran"
              description="Grafik akan muncul setelah ada transaksi setoran."
            />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={grafik} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                  <defs>
                    <linearGradient id="colorSetoran" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.line} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={chartColors.line} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="bulan"
                    tick={{ fontSize: 11, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={42}
                  />
                  <YAxis
                    width={58}
                    domain={[0, (dataMax) => Math.max(Number(dataMax) || 0, 1000000)]}
                    tick={{ fontSize: 11.5, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatChartAxisCurrency}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={chartColors.line}
                    strokeWidth={2.5}
                    fill="url(#colorSetoran)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Target Qurban (di mobile otomatis memakai progress bar linier minimalis) */}
        <TargetQurbanCard totalSaldo={summary?.totalSaldo} target={summary?.targetQurban} />
      </div>

      {/* ── 5. SECTION AKTIVITAS TERBARU (Sesuai Video Contoh) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-ink dark:text-white">
            Aktivitas Terbaru
          </h2>
          <Link
            to="/transaksi/riwayat"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingRiwayat ? (
          <div className="space-y-2">
            <div className="h-16 rounded-2xl bg-surface dark:bg-surface-dark border border-border animate-pulse" />
            <div className="h-16 rounded-2xl bg-surface dark:bg-surface-dark border border-border animate-pulse" />
          </div>
        ) : !recentTransactions.length ? (
          <div className="rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-6 text-center text-xs text-ink-muted">
            Belum ada aktivitas transaksi terbaru.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map((tx) => {
              const isSetoran = tx.jenis === 'setoran'
              return (
                <Link
                  key={tx.id}
                  to="/transaksi/riwayat"
                  className="flex items-center justify-between rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3 sm:p-3.5 shadow-2xs hover:border-emerald-500/50 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isSetoran
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isSetoran ? (
                        <ArrowDownCircle className="h-5 w-5" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-ink dark:text-white truncate">
                        {tx.anggota?.nama || tx.nama_anggota || 'Transaksi Qurban'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-ink-muted-dark mt-0.5">
                        <span className="uppercase font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          {tx.metode_pembayaran || 'TUNAI'}
                        </span>
                        <span>•</span>
                        <span className="truncate">{tx.keterangan || (isSetoran ? 'Setoran Tabungan' : 'Penarikan Dana')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs sm:text-sm font-extrabold ${
                        isSetoran
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isSetoran ? '+' : '−'} {formatCurrency(tx.nominal)}
                    </p>
                    <p className="text-[10px] text-ink-muted dark:text-ink-muted-dark mt-0.5">
                      {formatDate(tx.tanggal)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* AI Smart Insight & Kalkulator Lama Tabungan */}
      <AiInsightCard />

      {/* Pusat Pengingat Pembayaran Langsung ke WhatsApp (WA) */}
      <WaPaymentReminderCard />
    </div>
  )
}
