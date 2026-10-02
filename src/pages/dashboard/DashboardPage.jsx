import { Users, Wallet, TrendingUp, Receipt, AlertCircle, TrendingDown } from 'lucide-react'
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
import { useAnggotaBelumSetor } from '../../hooks/useTransaksi'
import { useTheme } from '../../context/ThemeContext'
import StatCard from '../../components/cards/StatCard'
import TargetQurbanCard from '../../components/cards/TargetQurbanCard'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { SkeletonCard, SkeletonChart } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/formatCurrency'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 text-xs shadow-soft">
      <p className="mb-1 font-semibold text-ink dark:text-ink-dark">{label}</p>
      <p className="text-emerald-600 dark:text-emerald-400">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

import AiInsightCard from '../../components/dashboard/AiInsightCard'

export default function DashboardPage() {
  const { isDark } = useTheme()
  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    tick: isDark ? '#94a3b8' : '#64748b',
    line: isDark ? '#34d399' : '#059669',
  }
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary()
  const { data: grafik, isLoading: loadingGrafik } = useGrafikSetoran()
  const { data: belumSetor, isLoading: loadingBelumSetor } = useAnggotaBelumSetor()

  return (
    <div className="space-y-6">
      {loadingSummary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SkeletonCard count={5} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={Users}
            tone="emerald"
            label="Total Anggota"
            value={summary?.totalAnggota}
          />
          <StatCard
            icon={Wallet}
            tone="warning"
            label="Total Saldo"
            value={formatCurrency(summary?.totalSaldo)}
            hint="Sudah dikurangi pengeluaran"
          />
          <StatCard
            icon={TrendingUp}
            tone="emerald"
            label="Setoran Bulan Ini"
            value={formatCurrency(summary?.setoranBulanIni)}
          />
          <StatCard
            icon={TrendingDown}
            tone="danger"
            label="Pengeluaran Bulan Ini"
            value={formatCurrency(summary?.totalPengeluaranBulanIni)}
            hint="Operasional masjid"
          />
          <StatCard
            icon={Receipt}
            tone="danger"
            label="Jumlah Transaksi"
            value={summary?.jumlahTransaksi}
            hint="Bulan berjalan"
          />
        </div>
      )}

      {/* AI Smart Insight Widget */}
      <AiInsightCard />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Grafik Setoran</CardTitle>
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">Juli 2026 – April 2027</span>
          </CardHeader>
          {loadingGrafik ? (
            <SkeletonChart />
          ) : !grafik?.length ? (
            <EmptyState title="Belum ada data setoran" description="Grafik akan muncul setelah ada transaksi setoran." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={grafik} margin={{ top: 5, right: 8, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="colorSetoran" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.line} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={chartColors.line} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="bulan"
                    tick={{ fontSize: 10.5, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: chartColors.tick }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1000000}jt`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={chartColors.line}
                    strokeWidth={2}
                    fill="url(#colorSetoran)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <TargetQurbanCard totalSaldo={summary?.totalSaldo} target={summary?.targetQurban} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anggota Belum Setor Bulan Ini</CardTitle>
          {!!belumSetor?.length && (
            <span className="rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-semibold text-danger dark:bg-danger/10">
              {belumSetor.length} anggota
            </span>
          )}
        </CardHeader>

        {loadingBelumSetor ? (
          <div className="flex h-24 items-center justify-center">
            <Spinner />
          </div>
        ) : !belumSetor?.length ? (
          <EmptyState
            icon={AlertCircle}
            title="Semua anggota sudah setor"
            description="Tidak ada anggota yang tertinggal bulan ini. Kerja bagus!"
          />
        ) : (
          <ul className="divide-y divide-border dark:divide-border-dark">
            {belumSetor.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-ink-dark">{a.nama}</p>
                  <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{a.kode_anggota}</p>
                </div>
                <span className="rounded-full bg-danger-100 px-2.5 py-1 text-xs font-semibold text-danger dark:bg-danger/10">
                  Belum setor
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
