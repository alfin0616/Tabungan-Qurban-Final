import { forwardRef, memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

const Select = forwardRef(function Select(
  { className, label, error, options = [], placeholder, id, required, ...props },
  ref,
) {
  const selectId = id || props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink dark:text-ink-dark">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'h-10 w-full appearance-none rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 pr-9 text-sm text-ink dark:text-ink-dark',
            'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
      </div>
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </div>
  )
})

export default memo(Select)
