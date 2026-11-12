import { cn } from '../../lib/cn'

const tones = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
  warning: 'bg-warning-100 text-warning border-warning/50 dark:bg-warning/10 dark:border-warning/30',
  danger: 'bg-danger-100 text-danger border-danger-100 dark:bg-danger/10 dark:border-danger/30',
  neutral: 'bg-bg dark:bg-bg-dark text-ink-muted dark:text-ink-muted-dark border-border dark:border-border-dark',
}

export default function Badge({ tone = 'neutral', className = '', children }) {
  const hasDisplayClass = /\b(hidden|flex|inline-flex|block|inline-block)\b/.test(className)
  return (
    <span
      className={cn(
        !hasDisplayClass && 'inline-flex',
        'items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap shrink-0',
        tones[tone] || tones.neutral,
        className,
      )}
    >
      {children}
    </span>
  )
}
