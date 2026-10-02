import { memo } from 'react'
import { cn } from '../../lib/cn'

export const Card = memo(function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-5 shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

export const CardHeader = memo(function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  )
})

export const CardTitle = memo(function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold text-ink dark:text-ink-dark', className)} {...props}>
      {children}
    </h3>
  )
})

export default Card
