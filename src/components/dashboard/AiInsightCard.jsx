import { Sparkles, TrendingUp, TrendingDown, Calendar, Users, Calculator, ArrowUpRight, Zap, Target } from 'lucide-react'
import { useAiInsight } from '../../hooks/useAiInsight'
import { formatCurrency } from '../../utils/formatCurrency'
import Badge from '../ui/Badge'

export default function AiInsightCard({ instansiId = null, kelompokId = null }) {
  const { data, isLoading } = useAiInsight({ instansiId, kelompokId })

  const rekomendasiSetoran = data?.rekomendasi_setoran_per_bulan || 0
  const prediksiBulan = data?.prediksi_bulan_selesai || 0
  const prediksiTanggal = data?.prediksi_tanggal_selesai
  const keaktifanPct = data?.keaktifan_pct || 100
  const trendPct = data?.trend_pct || 0
  const statusTrend = data?.status_trend || 'stabil'
  const totalSaldo = data?.total_saldo || 0
  const totalTarget = data?.total_target || 0
  const sisaDana = data?.sisa_dana || 0

  const formattedDate = prediksiTanggal
    ? new Date(prediksiTanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : '-'

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/90 via-emerald-950/95 to-slate-950 p-6 text-white shadow-2xl backdrop-blur-md">
      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />

      {/* Header Widget */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold tracking-tight text-white">AI Smart Insight</h3>
              <Badge tone="success" className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px]">
                Heuristic Engine
              </Badge>
            </div>
            <p className="text-xs text-emerald-200/80">Analisis prediksi & rekomendasi setoran cerdas</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-emerald-900/60 px-3 py-1.5 border border-emerald-700/60 text-xs font-semibold text-emerald-200">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Realtime Predictive</span>
        </div>
      </div>

      {/* Grid Features AI Insight */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Rekomendasi Nominal Setoran */}
        <div className="rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-4 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center justify-between text-xs text-emerald-200/80">
            <span>Rekomendasi Setoran</span>
            <Calculator className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-white">
            {formatCurrency(rekomendasiSetoran)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-300/80">
            Per anggota / bulan untuk memenuhi sisa {formatCurrency(sisaDana)}
          </p>
        </div>

        {/* 2. Prediksi Waktu Target Tercapai */}
        <div className="rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-4 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center justify-between text-xs text-emerald-200/80">
            <span>Prediksi Target Tercapai</span>
            <Calendar className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-xl font-extrabold text-white">
            {prediksiBulan > 0 ? `${prediksiBulan} Bulan` : 'Target Tercapai 🎉'}
          </p>
          <p className="mt-1 text-[11px] text-emerald-300/80">
            Estimasi: <span className="font-semibold text-amber-300">{formattedDate}</span>
          </p>
        </div>

        {/* 3. Insight Keaktifan Jamaah */}
        <div className="rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-4 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center justify-between text-xs text-emerald-200/80">
            <span>Keaktifan Jamaah</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-xl font-extrabold text-white">{keaktifanPct}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-950">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
              style={{ width: `${Math.min(100, Math.max(0, keaktifanPct))}%` }}
            />
          </div>
        </div>

        {/* 4. Trend Setoran Tabungan */}
        <div className="rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-4 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center justify-between text-xs text-emerald-200/80">
            <span>Trend Setoran (30 Hari)</span>
            {statusTrend === 'naik' ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-extrabold text-white">
              {trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`}
            </p>
            <Badge
              tone={statusTrend === 'naik' ? 'success' : statusTrend === 'turun' ? 'danger' : 'info'}
              className="text-[10px] capitalize"
            >
              {statusTrend}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-emerald-300/80">
            Dibandingkan 30 hari sebelumnya
          </p>
        </div>
      </div>
    </div>
  )
}
