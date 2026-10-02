import { clsx } from 'clsx'

/**
 * Simple classnames merge helper (no tailwind-merge dependency to keep things light).
 * @param  {...any} inputs
 */
export function cn(...inputs) {
  return clsx(inputs)
}
