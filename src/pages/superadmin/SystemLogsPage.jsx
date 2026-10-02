import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ScrollText,
  AlertTriangle,
  AlertCircle,
  Info,
  Bug,
  Filter,
  Search,
  Code2,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { logger } from '../../repositories/loggerRepository'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/modal/Modal'
import Pagination from '../../components/ui/Pagination'
import { SkeletonTableRow } from '../../components/ui/Skeleton'

export default function SystemLogsPage() {
  const [logs, setLogs] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [level, setLevel] = useState('semua')
  const [source, setSource] = useState('semua')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await logger.getLogs({ page, pageSize: 15, level, source })
      setLogs(res.data)
      setCount(res.count)
    } catch (err) {
      console.error('[SystemLogsPage] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, level, source])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = useMemo(() => {
    if (!search) return logs
    return logs.filter(
      (l) =>
        l.message?.toLowerCase().includes(search.toLowerCase()) ||
        l.url?.toLowerCase().includes(search.toLowerCase()) ||
        l.stack_trace?.toLowerCase().includes(search.toLowerCase()),
    )
  }, [logs, search])

  function getLevelBadge(lvl) {
    switch (lvl) {
      case 'fatal':
      case 'error':
        return <Badge variant="danger">{lvl.toUpperCase()}</Badge>
      case 'warn':
        return <Badge variant="warning">{lvl.toUpperCase()}</Badge>
      default:
        return <Badge variant="info">{lvl.toUpperCase()}</Badge>
    }
  }

  function getSourceBadge(src) {
    const colors = {
      frontend: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      backend: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      supabase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      payment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      pwa: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      edge_function: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    }
    return (
      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${colors[src] || colors.frontend}`}>
        {src}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <Bug className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">System & Error Logs</h1>
            <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
              Pusat pencatatan error terpusat (Frontend, Supabase, Payment, PWA & Edge Functions).
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Log
        </Button>
      </div>

      {/* Filter Card */}
      <Card>
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <Input
            placeholder="Cari pesan error / URL..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value)
              setPage(1)
            }}
          >
            <option value="semua">Semua Level Error</option>
            <option value="error">Error</option>
            <option value="fatal">Fatal</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
          </Select>

          <Select
            value={source}
            onChange={(e) => {
              setSource(e.target.value)
              setPage(1)
            }}
          >
            <option value="semua">Semua Sumber System</option>
            <option value="frontend">Frontend (React)</option>
            <option value="supabase">Supabase API / RPC</option>
            <option value="payment">Payment Gateway</option>
            <option value="pwa">PWA / Service Worker</option>
            <option value="edge_function">Edge Function</option>
            <option value="backend">Backend System</option>
          </Select>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Log Error ({count})</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto p-5 pt-0">
          {loading ? (
            <SkeletonTableRow rows={6} cols={5} />
          ) : !filteredLogs.length ? (
            <p className="text-center py-8 text-xs text-ink-muted dark:text-ink-muted-dark">
              Tidak ada log error ditemukan.
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-ink-muted dark:border-border-dark dark:text-ink-muted-dark">
                  <th className="py-3 px-2">Waktu</th>
                  <th className="py-3 px-2">Level</th>
                  <th className="py-3 px-2">Sumber</th>
                  <th className="py-3 px-2">Pesan Error</th>
                  <th className="py-3 px-2">URL</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border-dark">
                {filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-2 whitespace-nowrap text-ink-muted dark:text-ink-muted-dark">
                      {format(new Date(item.created_at), 'd MMM yyyy HH:mm:ss', { locale: id })}
                    </td>
                    <td className="py-3 px-2">{getLevelBadge(item.level)}</td>
                    <td className="py-3 px-2">{getSourceBadge(item.source)}</td>
                    <td className="py-3 px-2 font-medium text-ink dark:text-ink-dark max-w-xs truncate">
                      {item.message}
                    </td>
                    <td className="py-3 px-2 text-ink-muted dark:text-ink-muted-dark max-w-xs truncate">
                      {item.url || '-'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(item)}
                        title="Lihat Detail Stack Trace"
                      >
                        <Code2 className="h-3.5 w-3.5" /> Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {count > 15 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={Math.ceil(count / 15)}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Modal Detail Stack Trace */}
      {selectedLog && (
        <Modal
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Detail Log & Stack Trace"
        >
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-semibold text-ink-muted dark:text-ink-muted-dark">Pesan Error:</p>
              <p className="mt-1 font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800">
                {selectedLog.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-semibold text-ink-muted dark:text-ink-muted-dark">Waktu:</p>
                <p className="text-ink dark:text-ink-dark">
                  {format(new Date(selectedLog.created_at), 'dd MMMM yyyy HH:mm:ss', { locale: id })}
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink-muted dark:text-ink-muted-dark">Sumber / Level:</p>
                <p className="text-ink dark:text-ink-dark uppercase">{selectedLog.source} / {selectedLog.level}</p>
              </div>
            </div>

            {selectedLog.url && (
              <div>
                <p className="font-semibold text-ink-muted dark:text-ink-muted-dark">URL Halaman:</p>
                <p className="text-ink dark:text-ink-dark font-mono break-all">{selectedLog.url}</p>
              </div>
            )}

            {selectedLog.stack_trace && (
              <div>
                <p className="font-semibold text-ink-muted dark:text-ink-muted-dark">Stack Trace:</p>
                <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-red-300">
                  {selectedLog.stack_trace}
                </pre>
              </div>
            )}

            {selectedLog.context_data && Object.keys(selectedLog.context_data).length > 0 && (
              <div>
                <p className="font-semibold text-ink-muted dark:text-ink-muted-dark">Context Data (JSON):</p>
                <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
                  {JSON.stringify(selectedLog.context_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
