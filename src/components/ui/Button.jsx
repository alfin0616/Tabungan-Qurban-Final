import { forwardRef, memo } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

const variants = {
  primary:
    'bg-gradient-to-tl from-emerald-800 to-emerald-600 text-white shadow-sm hover:from-emerald-900 hover:to-emerald-700 hover:shadow-md focus-visible:outline-emerald-700',
  warning:
    'bg-gradient-to-tl from-amber-500 to-orange-400 text-white shadow-sm hover:opacity-95 hover:shadow-md focus-visible:outline-warning',
  outline:
    'border border-border dark:border-border-dark bg-white dark:bg-surface-dark text-ink dark:text-ink-dark shadow-2xs hover:border-emerald-700 hover:text-emerald-700',
  ghost:
    'text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-slate-700 dark:hover:text-emerald-400',
  danger:
    'bg-gradient-to-tl from-rose-600 to-pink-500 text-white shadow-sm hover:opacity-95 hover:shadow-md',
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})

export default memo(Button)
