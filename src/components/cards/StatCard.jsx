import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '../../lib/cn'

const tones = {
  emerald: 'bg-gradient-to-tl from-emerald-800 to-emerald-600 text-white shadow-md shadow-emerald-900/20',
  warning: 'bg-gradient-to-tl from-amber-500 to-orange-400 text-white shadow-md shadow-amber-500/25',
  danger: 'bg-gradient-to-tl from-rose-600 to-pink-500 text-white shadow-md shadow-rose-500/25',
  info: 'bg-gradient-to-tl from-indigo-600 to-cyan-400 text-white shadow-md shadow-indigo-500/25',
}

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'emerald',
  trend,
  to = null,
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark leading-snug">
            {label}
          </p>
          <p
            className={cn(
              'mt-1.5 text-xl sm:text-2xl font-extrabold tracking-tight text-ink dark:text-ink-dark break-words leading-tight transition-colors',
              to && 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400',
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200',
            tones[tone] || tones.emerald,
            to && 'group-hover:scale-105',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(trend || hint || to) && (
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border/60 dark:border-border-dark/60 pt-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 font-bold shrink-0',
                  trend.direction === 'up'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-danger-100 text-danger dark:bg-danger/15',
                )}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
              </span>
            )}
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark leading-snug">
              {hint || (to ? `Klik nominal untuk buka menu ${label}` : '')}
            </p>
          </div>
          {to && (
            <span className="inline-flex shrink-0 items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
              Buka
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      )}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        title={`Klik untuk masuk ke menu ${label} (${value})`}
        className="group argon-lift block rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-5 shadow-argon transition-all hover:border-emerald-500/60 dark:hover:border-emerald-500/60"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="argon-lift rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-5 shadow-argon">
      {content}
    </div>
  )
})

export default StatCard
