import { formatCurrency } from '../../utils/formatCurrency'

/**
 * Signature visual: a crescent-shaped progress arc (evokes the hilal / new moon
 * marking the start of Dzulhijjah) instead of a generic circular donut.
 */
export default function TargetQurbanCard({ totalSaldo = 0, target = 0 }) {
  const percentage = target > 0 ? Math.min(100, Math.round((totalSaldo / target) * 100)) : 0

  const radius = 70
  const circumference = 2 * Math.PI * radius
  // Arc spans 270deg (like a crescent opening) instead of a full 360 donut
  const arcFraction = 0.75
  const arcLength = circumference * arcFraction
  const dashOffset = arcLength - (percentage / 100) * arcLength

  return (
    <div className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-5 shadow-soft">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink dark:text-ink-dark">Target Qurban</h3>
        <span className="rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-semibold text-warning dark:bg-warning/10">
          {percentage}%
        </span>
      </div>
      <p className="mb-4 text-sm text-ink-muted dark:text-ink-muted-dark">Progres saldo terkumpul menuju target musim ini</p>

      <div className="relative mx-auto flex h-[190px] w-[190px] items-center justify-center">
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
          <span className="text-3xl font-bold text-ink dark:text-ink-dark">{percentage}%</span>
          <span className="text-xs text-ink-muted dark:text-ink-muted-dark">tercapai</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border dark:border-border-dark pt-4 text-sm">
        <div>
          <p className="text-ink-muted dark:text-ink-muted-dark">Terkumpul</p>
          <p className="font-semibold text-emerald-600">{formatCurrency(totalSaldo)}</p>
        </div>
        <div className="text-right">
          <p className="text-ink-muted dark:text-ink-muted-dark">Target</p>
          <p className="font-semibold text-ink dark:text-ink-dark">{formatCurrency(target)}</p>
        </div>
      </div>
    </div>
  )
}
