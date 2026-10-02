import { cn } from '../../lib/cn'

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function Avatar({ src, name, size = 40, className }) {
  const dimension = { width: size, height: size }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={dimension}
        className={cn('rounded-full object-cover border border-border dark:border-border-dark', className)}
      />
    )
  }

  return (
    <div
      style={dimension}
      className={cn(
        'flex items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700',
        className,
      )}
    >
      {initials(name) || '?'}
    </div>
  )
}
