import { forwardRef, memo, useCallback, useState } from 'react'
import { Eye, EyeOff, CalendarDays, Clock } from 'lucide-react'
import { cn } from '../../lib/cn'

const DATE_TYPES = ['date', 'month', 'week', 'time', 'datetime-local']

const DATE_PLACEHOLDER = {
  date: 'Pilih tanggal',
  month: 'Pilih bulan',
  week: 'Pilih minggu',
  time: 'Pilih jam',
  'datetime-local': 'Pilih tanggal & jam',
}

const Input = forwardRef(function Input(
  { className, label, error, hint, icon: Icon, id, required, type = 'text', placeholder, onChange, onInput, ...props },
  ref,
) {
  const inputId = id || props.name
  const isPassword = type === 'password'
  const isDateLike = DATE_TYPES.includes(type)
  const [showPassword, setShowPassword] = useState(false)
  const [uncontrolledFilled, setUncontrolledFilled] = useState(false)

  const computedType = isPassword ? (showPassword ? 'text' : 'password') : type

  const isControlled = props.value !== undefined
  const filled = isControlled ? props.value !== '' && props.value !== null : uncontrolledFilled

  // Gabungkan ref dari luar (react-hook-form / forwardRef) dengan pengecekan nilai awal
  const mergedRef = useCallback(
    (el) => {
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
      if (el && isDateLike) setUncontrolledFilled(!!el.value)
    },
    [ref, isDateLike],
  )

  function handleChange(e) {
    if (isDateLike) setUncontrolledFilled(!!e.target.value)
    onChange?.(e)
  }

  function handleInput(e) {
    if (isDateLike) setUncontrolledFilled(!!e.target.value)
    onInput?.(e)
  }

  const DateIcon = type === 'time' ? Clock : CalendarDays

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink dark:text-ink-dark">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <div className="relative min-w-0">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
        )}
        <input
          id={inputId}
          ref={mergedRef}
          type={computedType}
          placeholder={placeholder}
          onChange={handleChange}
          onInput={handleInput}
          className={cn(
            'h-11 w-full min-w-0 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3.5 text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-muted-dark/60 transition-colors',
            'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            Icon && 'pl-10',
            (isPassword || isDateLike) && 'pr-10',
            isDateLike && 'input-date peer',
            isDateLike && !filled && 'input-date-empty',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className,
          )}
          {...props}
        />

        {/* Placeholder untuk input tanggal (Android/iOS menampilkan kotak kosong bila belum diisi) */}
        {isDateLike && !filled && (
          <span
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 truncate text-sm text-ink-muted/70 dark:text-ink-muted-dark/70 peer-focus:hidden',
              Icon ? 'left-10' : 'left-3.5',
              'right-10',
            )}
          >
            {placeholder || DATE_PLACEHOLDER[type]}
          </span>
        )}

        {isDateLike && (
          <DateIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
        )}

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
