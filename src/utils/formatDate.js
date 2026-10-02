import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatDate(date, pattern = 'd MMMM yyyy') {
  if (!date) return '-'
  return format(new Date(date), pattern, { locale: id })
}

export function formatDateTime(date) {
  return formatDate(date, 'd MMM yyyy, HH:mm')
}

export function formatRelative(date) {
  if (!date) return '-'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id })
}
