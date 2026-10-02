import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export default function Spinner({ size = 20, className }) {
  return (
    <Loader2
      className={cn('animate-spin text-emerald-600', className)}
      style={{ width: size, height: size }}
    />
  )
}
