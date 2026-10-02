import { cn } from '../../lib/cn'

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border dark:border-border-dark bg-bg/60 dark:bg-bg-dark/60 px-6 py-14 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
          <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold text-ink dark:text-ink-dark">{title}</p>
        {description && <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{description}</p>}
      </div>
      {action}
    </div>
  )
}
