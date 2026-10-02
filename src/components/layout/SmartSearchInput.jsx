import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  Building2,
  Users,
  Layers,
  Receipt,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useSmartSearch } from '../../hooks/useSmartSearch'
import Badge from '../ui/Badge'

const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'instansi', label: 'Instansi' },
  { id: 'kelompok', label: 'Kelompok' },
  { id: 'jamaah', label: 'Jamaah' },
  { id: 'transaksi', label: 'Transaksi' },
  { id: 'laporan', label: 'Laporan' },
  { id: 'notifikasi', label: 'Notifikasi' },
]

export default function SmartSearchInput({ onSearch }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  const limit = 5
  const { data, isLoading, isFetching } = useSmartSearch(query, category, page, limit)

  // Reset page when category or query changes
  useEffect(() => {
    setPage(1)
  }, [category, query])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectResult = (link) => {
    setIsOpen(false)
    setQuery('')
    if (link) navigate(link)
  }

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'instansi': return <Building2 className="h-4 w-4 text-emerald-600" />
      case 'kelompok': return <Layers className="h-4 w-4 text-amber-600" />
      case 'jamaah': return <Users className="h-4 w-4 text-sky-600" />
      case 'transaksi': return <Receipt className="h-4 w-4 text-purple-600" />
      case 'laporan': return <FileText className="h-4 w-4 text-rose-600" />
      case 'notifikasi': return <Bell className="h-4 w-4 text-indigo-600" />
      default: return <Search className="h-4 w-4 text-gray-500" />
    }
  }

  const instansiList = data?.instansi || []
  const kelompokList = data?.kelompok || []
  const jamaahList = data?.jamaah || []
  const transaksiList = data?.transaksi || []
  const laporanList = data?.laporan || []
  const notifikasiList = data?.notifikasi || []

  const allItems = [
    ...instansiList,
    ...kelompokList,
    ...jamaahList,
    ...transaksiList,
    ...laporanList,
    ...notifikasiList,
  ]

  const totalCount = data?.total_count || 0
  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <div ref={dropdownRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            onSearch?.(e.target.value)
          }}
          placeholder="Smart Search (Jamaah, Instansi, Transaksi...)"
          className="h-10 w-full rounded-xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark pl-9 pr-8 text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-muted-dark/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink dark:hover:text-ink-dark"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          isFetching && (
            <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-600" />
          )
        )}
      </div>

      {/* Autocomplete Dropdown Popup */}
      {isOpen && query.trim().length >= 1 && (
        <div className="absolute left-0 right-0 z-50 mt-2 w-full max-w-md rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 shadow-2xl backdrop-blur sm:min-w-[340px] md:min-w-[420px]">
          {/* Filter Categories */}
          <div className="mb-3 flex flex-wrap gap-1 overflow-x-auto border-b border-border pb-2 dark:border-border-dark scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  category === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-ink-muted hover:bg-emerald-50 dark:hover:bg-slate-700 dark:text-ink-muted-dark'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results List */}
          {isLoading ? (
            <div className="flex h-32 items-center justify-center gap-2 text-xs text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Mencari realtime data...</span>
            </div>
          ) : !allItems.length ? (
            <div className="p-6 text-center text-xs text-ink-muted dark:text-ink-muted-dark">
              Tidak ada hasil pencarian untuk "{query}"
            </div>
          ) : (
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {allItems.map((item, idx) => (
                <div
                  key={`${item.category}-${item.id || idx}`}
                  onClick={() => handleSelectResult(item.link)}
                  className="group cursor-pointer flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-emerald-50 dark:hover:bg-slate-700/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink dark:text-ink-dark truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {item.title}
                      </p>
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Badge tone="info" className="capitalize shrink-0 text-[10px]">
                    {item.category}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          {totalCount > limit && (
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-ink-muted dark:border-border-dark dark:text-ink-muted-dark">
              <span>
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-border p-1 hover:bg-emerald-50 disabled:opacity-40 dark:border-border-dark dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border p-1 hover:bg-emerald-50 disabled:opacity-40 dark:border-border-dark dark:hover:bg-slate-700"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
