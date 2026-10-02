import { cn } from '../../lib/cn'

/**
 * Skeleton — komponen loading placeholder yang menampilkan efek shimmer/pulse
 * sebagai pengganti Spinner agar pengalaman loading terasa lebih premium.
 *
 * Variasi:
 *  - `text`     → satu baris teks
 *  - `card`     → kartu stat dashboard
 *  - `table`    → baris tabel
 *  - `avatar`   → lingkaran avatar
 *  - `chart`    → area chart placeholder
 */

function SkeletonBase({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/50',
        className,
      )}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ count = 1, className }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark',
            className,
          )}
        >
          <SkeletonBase className="mb-3 h-10 w-10 rounded-xl" />
          <SkeletonBase className="mb-2 h-7 w-1/3" />
          <SkeletonBase className="h-4 w-2/3" />
        </div>
      ))}
    </>
  )
}

export function SkeletonTableRow({ cols = 5, rows = 5, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBase key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 'md', className }) {
  const sizeMap = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' }
  return <SkeletonBase className={cn('rounded-full', sizeMap[size], className)} />
}

export function SkeletonChart({ className }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark', className)}>
      <SkeletonBase className="mb-4 h-5 w-1/4" />
      <SkeletonBase className="h-48 w-full rounded-xl" />
    </div>
  )
}

export default SkeletonBase
