import { forwardRef, memo } from 'react'
import { cn } from '../../lib/cn'

const Input = forwardRef(function Input(
  { className, label, error, hint, icon: Icon, id, required, ...props },
  ref,
) {
  const inputId = id || props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink dark:text-ink-dark">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'h-10 w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-muted-dark/60',
            'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            Icon && 'pl-9',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className,
          )}
          {...props}
        />
      </div>
      {hint && !error && <span className="text-xs text-ink-muted dark:text-ink-muted-dark">{hint}</span>}
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </div>
  )
})

export default memo(Input)
