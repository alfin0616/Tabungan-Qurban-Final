import Spinner from './Spinner'

/**
 * PageLoader — Komponen loading animasi halus saat memuat route halaman secara dinamis (Code Splitting).
 */
export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-emerald-600 dark:text-emerald-400" />
        <p className="animate-pulse text-xs font-medium text-ink-muted dark:text-ink-muted-dark">
          Memuat halaman...
        </p>
      </div>
    </div>
  )
}
