import { Link } from 'react-router-dom'
import { Pencil, Trash2, Eye } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { formatDate } from '../../utils/formatDate'

export default function AnggotaTable({ data = [], onEdit, onDelete, onToggleStatus, isAdmin = true }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
            <th className="py-3 pr-4">Anggota</th>
            <th className="py-3 pr-4">No. HP</th>
            <th className="py-3 pr-4">Jenis Kelamin</th>
            <th className="py-3 pr-4">Bergabung</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-border-dark">
          {data.map((a) => (
            <tr key={a.id}>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <Avatar src={a.foto} name={a.nama} size={36} />
                  <div>
                    <p className="font-medium text-ink dark:text-ink-dark">{a.nama}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{a.kode_anggota}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">{a.no_hp}</td>
              <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">
                {a.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
              </td>
              <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">
                {formatDate(a.tanggal_bergabung)}
              </td>
              <td className="py-3 pr-4">
                {isAdmin && onToggleStatus ? (
                  <button
                    onClick={() => onToggleStatus(a)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${a.status ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/50' : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50'}`}
                    title="Klik untuk ubah status"
                  >
                    {a.status ? 'Aktif' : 'Tidak Aktif'}
                  </button>
                ) : (
                  <Badge tone={a.status ? 'emerald' : 'danger'}>
                    {a.status ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                )}
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/anggota/${a.id}`}
                    className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => onEdit(a)}
                        className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(a)}
                        className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-danger-100 dark:hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
