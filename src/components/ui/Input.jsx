import { forwardRef, memo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/cn'

const Input = forwardRef(function Input(
  { className, label, error, hint, icon: Icon, id, required, type = 'text', ...props },
  ref,
) {
  const inputId = id || props.name
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)

  const computedType = isPassword ? (showPassword ? 'text' : 'password') : type

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
          type={computedType}
          className={cn(
            'h-11 w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3.5 text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-muted-dark/60 transition-colors',
            'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            Icon && 'pl-10',
            isPassword && 'pr-11',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark transition-colors focus:outline-none cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && !error && <span className="text-xs text-ink-muted dark:text-ink-muted-dark">{hint}</span>}
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </div>
  )
})

export default memo(Input)
