import { Eye, Trash2, Camera } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function RiwayatTable({ data = [], onDetail, onDelete, isAdmin = true }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
            <th className="py-3 pr-4">Tanggal</th>
            <th className="py-3 pr-4">Anggota</th>
            <th className="py-3 pr-4">Jenis</th>
            <th className="py-3 pr-4">Nominal</th>
            <th className="py-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-border-dark">
          {data.map((t) => (
            <tr key={t.id}>
              <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">{formatDate(t.tanggal)}</td>
              <td className="py-3 pr-4">
                <p className="font-medium text-ink dark:text-ink-dark">{t.anggota?.nama}</p>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{t.anggota?.kode_anggota}</p>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5">
                  <Badge tone={t.jenis === 'setoran' ? 'emerald' : 'danger'}>
                    {t.jenis === 'setoran' ? 'Setoran' : 'Penarikan'}
                  </Badge>
                  {t.bukti && <Camera className="h-3.5 w-3.5 text-ink-muted dark:text-ink-muted-dark" />}
                </div>
              </td>
              <td className="py-3 pr-4 font-medium text-ink dark:text-ink-dark">
                {formatCurrency(t.nominal)}
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onDetail(t)}
                    className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => onDelete(t)}
                      className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-danger-100 dark:hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
