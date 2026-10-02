import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ScrollText, Loader2, ShieldAlert } from 'lucide-react'
import { auditRepository } from '../../repositories/auditRepository'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { isSuperAdmin } = useAuth()
  
  const limit = 20

  useEffect(() => {
    fetchLogs()
  }, [page])

  async function fetchLogs() {
    setLoading(true)
    try {
      const { data, count } = await auditRepository.getLogs(page, limit)
      setLogs(data)
      setTotal(count)
    } catch (err) {
      console.error('AuditLog fetch error:', err)
      toast.error(err.message || 'Gagal memuat audit log. Pastikan file migrasi SQL Modul 4 sudah dijalankan.')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <ScrollText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Audit Log</h1>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
            Catatan aktivitas sistem secara realtime.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-ink-muted dark:bg-slate-800/50 dark:text-ink-muted-dark">
              <tr>
                <th className="px-6 py-4 font-medium">Waktu</th>
                <th className="px-6 py-4 font-medium">User</th>
                {isSuperAdmin && <th className="px-6 py-4 font-medium">Instansi</th>}
                <th className="px-6 py-4 font-medium">Aksi</th>
                <th className="px-6 py-4 font-medium">Deskripsi</th>
                <th className="px-6 py-4 font-medium">Detail Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="px-6 py-8 text-center text-ink-muted">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="px-6 py-8 text-center text-ink-muted">
                    Belum ada catatan aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="whitespace-nowrap px-6 py-4 text-ink-muted dark:text-ink-muted-dark">
                      {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink dark:text-ink-dark">
                        {log.user?.full_name || 'System / Unknown'}
                      </div>
                      <div className="text-xs text-ink-muted">Role: {log.role}</div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-ink-muted dark:text-ink-muted-dark">
                        {log.instansi?.nama_instansi || '-'}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink dark:text-ink-dark">
                      {log.description}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-ink-muted dark:text-ink-muted-dark">
                        IP: {log.ip_address}
                      </div>
                      <div className="mt-1 max-w-[200px] truncate text-[10px] text-slate-400" title={log.user_agent}>
                        {log.user_agent}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4 dark:border-border-dark">
            <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-border-dark dark:hover:bg-slate-800"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-border-dark dark:hover:bg-slate-800"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
