import { Link } from 'react-router-dom'
import { ArrowUpRight, Target } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'

export default function TargetQurbanCard({ totalSaldo = 0, target = 0 }) {
  const percentage = target > 0 ? Math.min(100, Math.round((totalSaldo / target) * 100)) : 0

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const arcFraction = 0.75
  const arcLength = circumference * arcFraction
  const dashOffset = arcLength - (percentage / 100) * arcLength

  const tone = percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-warning' : 'bg-danger'

  return (
    <div className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 sm:p-5 shadow-soft flex flex-col justify-between">
      {/* ── TAMPILAN MOBILE (< 768px): Minimalis Tanpa Diagram Melingkar ── */}
      <div className="block md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-white">Target Qurban</h3>
              <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">Progres musim ini</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-bold">
            {percentage}%
          </span>
        </div>

        {/* Linear Progress Bar Minimalis */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${tone}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <Link
            to="/tabungan"
            className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 border border-emerald-500/20"
          >
            <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark block">Terkumpul</span>
            <span className="font-extrabold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 block truncate">
              {formatCurrency(totalSaldo)}
            </span>
          </Link>
          <Link
            to="/kelompok"
            className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-2.5 border border-border/80 text-right"
          >
            <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark block">Target</span>
            <span className="font-extrabold text-xs sm:text-sm text-ink dark:text-white block truncate">
              {formatCurrency(target)}
            </span>
          </Link>
        </div>
      </div>

      {/* ── TAMPILAN DESKTOP (>= 768px): Arc Lingkaran Visual Hilal ── */}
      <div className="hidden md:block">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink dark:text-ink-dark">Target Qurban</h3>
            <span className="rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-semibold text-warning dark:bg-warning/10">
              {percentage}%
            </span>
          </div>
          <p className="mb-4 text-sm text-ink-muted dark:text-ink-muted-dark">
            Progres saldo terkumpul menuju target musim ini
          </p>

          <Link
            to="/tabungan"
            title="Klik untuk masuk ke menu Tabungan"
            className="relative mx-auto flex h-[190px] w-[190px] items-center justify-center group"
          >
            <svg viewBox="0 0 180 180" className="h-full w-full -rotate-[135deg]">
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="var(--color-emerald-50)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${circumference}`}
              />
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="var(--color-warning)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-3xl font-bold text-ink dark:text-ink-dark group-hover:text-emerald-600 transition-colors">
                {percentage}%
              </span>
              <span className="text-xs text-ink-muted dark:text-ink-muted-dark">tercapai</span>
            </div>
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border dark:border-border-dark pt-4 text-sm">
          <Link
            to="/tabungan"
            title="Klik nominal untuk membuka menu Tabungan"
            className="group rounded-xl border border-transparent hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 p-2 -m-2 transition-all"
          >
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark flex items-center gap-1">
              Terkumpul
              <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-emerald-600" />
            </p>
            <p className="mt-0.5 font-extrabold text-emerald-600 dark:text-emerald-400 break-words">
              {formatCurrency(totalSaldo)}
            </p>
          </Link>

          <Link
            to="/tabungan"
            title="Klik nominal untuk membuka menu Target Tabungan"
            className="group rounded-xl border border-transparent hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 p-2 -m-2 text-right transition-all"
          >
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark flex items-center justify-end gap-1">
              Target
              <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-emerald-600" />
            </p>
            <p className="mt-0.5 font-extrabold text-ink dark:text-ink-dark group-hover:text-emerald-600 dark:group-hover:text-emerald-400 break-words">
              {formatCurrency(target)}
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
