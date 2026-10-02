import { memo } from 'react'
import { cn } from '../../lib/cn'

const tones = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  warning: 'bg-warning-100 text-warning dark:bg-warning/10',
  danger: 'bg-danger-100 text-danger dark:bg-danger/10',
}

const StatCard = memo(function StatCard({ icon: Icon, label, value, hint, tone = 'emerald', trend }) {
  return (
    <div className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              trend.direction === 'up'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-danger-100 text-danger dark:bg-danger/10',
            )}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-ink dark:text-ink-dark">{value}</p>
      <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">{label}</p>
      {hint && <p className="mt-2 text-xs text-ink-muted dark:text-ink-muted-dark/80">{hint}</p>}
    </div>
  )
}
)

export default StatCard
