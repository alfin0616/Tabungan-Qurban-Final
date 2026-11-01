import { useState } from 'react'
import {
  Users,
  Wallet,
  TrendingUp,
  Receipt,
  TrendingDown,
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
  const { isAdmin } = useAuth()
  const [periodeGrafik, setPeriodeGrafik] = useState('bulanan')

  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    tick: isDark ? '#94a3b8' : '#64748b',
    line: isDark ? '#34d399' : '#059669',
  }

  const { data: summary, isLoading: loadingSummary } = useDashboardSummary()
  const { data: grafik, isLoading: loadingGrafik } = useGrafikSetoran(periodeGrafik)

  return (
    <div className="space-y-6">
      {/* Informasi Nomor Rekening Instansi untuk Jamaah & Admin Instansi */}
      <InfoRekeningInstansiCard />

      {loadingSummary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard count={5} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            label="Pengeluaran Bulan Ini"
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
            tone="danger"
            label="Jumlah Transaksi"
            value={summary?.jumlahTransaksi ?? 0}
            hint="Bulan berjalan • Klik ke Riwayat Transaksi"
            to="/transaksi/riwayat"
          />
        </div>
      )}

      {/* AI Smart Insight & Kalkulator Lama Tabungan */}
      <AiInsightCard />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
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

        <TargetQurbanCard totalSaldo={summary?.totalSaldo} target={summary?.targetQurban} />
      </div>

      {/* Pusat Pengingat Pembayaran Langsung ke WhatsApp (WA) */}
      <WaPaymentReminderCard />
    </div>
  )
}
