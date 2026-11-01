import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  Users,
  Calculator,
  Zap,
  ArrowUpRight,
} from 'lucide-react'
import { useAiInsight } from '../../hooks/useAiInsight'
import {
  formatCurrency,
  calculateSkemaTabungan,
  LAMA_TABUNGAN_PRESETS,
} from '../../utils/formatCurrency'
import Badge from '../ui/Badge'

export default function AiInsightCard({ instansiId = null, kelompokId = null }) {
  const { data } = useAiInsight({ instansiId, kelompokId })
  const [periodeSimulasi, setPeriodeSimulasi] = useState('bulanan')
  const [lamaSimulasi, setLamaSimulasi] = useState(12)

  const keaktifanPct = data?.keaktifan_pct ?? 100
  const trendPct = data?.trend_pct || 0
  const statusTrend = data?.status_trend || 'stabil'
  const totalTarget = Number(data?.total_target || 21000000)
  const totalSaldo = Number(data?.total_saldo || 0)
  const anggotaAktif = Math.max(1, Number(data?.anggota_aktif || 7))

  // Hitung target rata-rata per anggota (default Rp 3.000.000 jika target kelompok Rp 21.000.000 / 7 orang)
  const targetPerOrang = useMemo(() => {
    if (totalTarget <= 0) return 3000000
    const rawPerOrang = Math.ceil(totalTarget / Math.max(anggotaAktif, 7))
    return rawPerOrang >= 500000 ? rawPerOrang : 3000000
  }, [totalTarget, anggotaAktif])

  const saldoPerOrang = useMemo(() => {
    if (totalSaldo <= 0) return 0
    return Math.floor(totalSaldo / anggotaAktif)
  }, [totalSaldo, anggotaAktif])

  const simulasi = useMemo(
    () =>
      calculateSkemaTabungan({
        target: targetPerOrang,
        saldo: saldoPerOrang,
        periode: periodeSimulasi,
        lamaBulan: lamaSimulasi,
      }),
    [targetPerOrang, saldoPerOrang, periodeSimulasi, lamaSimulasi],
  )

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/95 via-emerald-950/95 to-slate-950 p-6 text-white shadow-2xl backdrop-blur-md">
      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />

      {/* Header Widget + Selector Skema & Lama Tabungan */}
      <div className="mb-6 flex flex-col gap-3 border-b border-emerald-800/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold tracking-tight text-white">
                Kalkulator &amp; Smart Insight Tabungan
              </h3>
              <Badge
                tone="success"
                className="border border-emerald-400/30 bg-emerald-500/20 text-[10px] text-emerald-300"
              >
                Fleksibel Tanpa Batas Waktu
              </Badge>
            </div>
            <p className="text-xs text-emerald-200/80">
              Simulasikan setoran bulanan/mingguan dan lama tabungan sesuai kemampuan jamaah (klik kartu untuk masuk ke menu terkait)
            </p>
          </div>
        </div>

        {/* Filter Cepat Siklus & Lama Tabungan */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-emerald-700/70 bg-emerald-950/80 p-1">
            <button
              type="button"
              onClick={() => setPeriodeSimulasi('bulanan')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                periodeSimulasi === 'bulanan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setPeriodeSimulasi('mingguan')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                periodeSimulasi === 'mingguan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Mingguan
            </button>
          </div>

          <select
            value={lamaSimulasi}
            onChange={(e) => setLamaSimulasi(Number(e.target.value))}
            aria-label="Pilih Lama Tabungan"
            className="h-8 rounded-xl border border-emerald-700/70 bg-emerald-950/90 px-3 text-xs font-bold text-emerald-100 focus:border-emerald-400 focus:outline-none"
          >
            {LAMA_TABUNGAN_PRESETS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                Tenor: {opt.label}
              </option>
            ))}
          </select>

          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-700/60 bg-emerald-900/60 px-3 py-1.5 text-xs font-semibold text-emerald-200">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Tanpa Hangus</span>
          </div>
        </div>
      </div>

      {/* Grid Features AI Insight (Semua dapat diklik ke menu terkait) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Rekomendasi Nominal Setoran Sesuai Siklus & Tenor -> Menu Tabungan */}
        <Link
          to="/tabungan"
          title="Klik untuk masuk ke menu Tabungan & Rencana Setoran"
          className="group rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-4 shadow-sm backdrop-blur transition-all hover:border-emerald-400/70 hover:bg-emerald-900/70"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-emerald-200/80">
            <span>Estimasi Setoran ({periodeSimulasi === 'mingguan' ? 'Mingguan' : 'Bulanan'})</span>
            <Calculator className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-white break-words leading-snug group-hover:text-emerald-300 transition-colors">
            {formatCurrency(simulasi.nominalPerPeriode)}
            <span className="text-xs font-medium text-emerald-300"> / {simulasi.labelPeriode}</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-300/80">
            <span>Target {formatCurrency(targetPerOrang)} / orang</span>
            <span className="inline-flex items-center gap-0.5 font-bold text-emerald-300 group-hover:translate-x-0.5 transition-transform">
              Tabungan <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* 2. Pilihan Lama Tabungan Fleksibel -> Menu Tabungan */}
        <Link
          to="/tabungan"
          title="Klik untuk mengatur Lama Tabungan di menu Tabungan"
          className="group rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-4 shadow-sm backdrop-blur transition-all hover:border-emerald-400/70 hover:bg-emerald-900/70"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-emerald-200/80">
            <span>Rencana Lama Tabungan</span>
            <CalendarClock className="h-4 w-4 text-teal-400" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-white break-words leading-snug group-hover:text-emerald-300 transition-colors">
            {simulasi.lamaBulan} Bulan
            <span className="ml-1.5 text-xs font-semibold text-amber-300">
              ({simulasi.totalPeriode}x {simulasi.labelPeriode})
            </span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-300/80">
            <span>Bisa s.d. 30–48 bulan</span>
            <span className="inline-flex items-center gap-0.5 font-bold text-emerald-300 group-hover:translate-x-0.5 transition-transform">
              Atur Skema <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* 3. Insight Keaktifan Jamaah -> Menu Anggota */}
        <Link
          to="/anggota"
          title="Klik untuk melihat daftar Anggota"
          className="group rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-4 shadow-sm backdrop-blur transition-all hover:border-emerald-400/70 hover:bg-emerald-900/70"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-emerald-200/80">
            <span>Keaktifan Jamaah</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
            {keaktifanPct}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-950">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
              style={{ width: `${Math.min(100, Math.max(0, keaktifanPct))}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-end text-[11px] text-emerald-300">
            <span className="inline-flex items-center gap-0.5 font-bold group-hover:translate-x-0.5 transition-transform">
              Data Anggota <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* 4. Trend Setoran Tabungan -> Menu Riwayat Transaksi */}
        <Link
          to="/transaksi/riwayat"
          title="Klik untuk melihat Riwayat Transaksi"
          className="group rounded-2xl border border-emerald-800/80 bg-emerald-900/40 p-4 shadow-sm backdrop-blur transition-all hover:border-emerald-400/70 hover:bg-emerald-900/70"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-emerald-200/80">
            <span>Trend Setoran (30 Hari)</span>
            {statusTrend === 'naik' ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-lg sm:text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
              {trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`}
            </p>
            <Badge
              tone={statusTrend === 'naik' ? 'success' : statusTrend === 'turun' ? 'danger' : 'info'}
              className="text-[10px] capitalize"
            >
              {statusTrend}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-300/80">
            <span>Vs 30 hari lalu</span>
            <span className="inline-flex items-center gap-0.5 font-bold text-emerald-300 group-hover:translate-x-0.5 transition-transform">
              Riwayat <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}
