import { Pencil, Trash2, Receipt } from 'lucide-react'
import Badge from '../ui/Badge'
import { labelKategori } from '../../repositories/pengeluaranRepository'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function PengeluaranTable({ data = [], onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
            <th className="py-3 pr-4">Tanggal</th>
            <th className="py-3 pr-4">Kategori</th>
            <th className="py-3 pr-4">Keterangan</th>
            <th className="py-3 pr-4">Nominal</th>
            <th className="py-3 pr-4">Bukti</th>
            <th className="py-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-border-dark">
          {data.map((p) => (
            <tr key={p.id}>
              <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">{formatDate(p.tanggal)}</td>
              <td className="py-3 pr-4">
                <Badge tone="danger">{labelKategori(p.kategori)}</Badge>
              </td>
              <td className="py-3 pr-4 text-ink dark:text-ink-dark">{p.keterangan || '-'}</td>
              <td className="py-3 pr-4 font-medium text-danger">{formatCurrency(p.nominal)}</td>
              <td className="py-3 pr-4">
                {p.bukti ? (
                  <a
                    href={p.bukti}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    <Receipt className="h-3.5 w-3.5" /> Lihat
                  </a>
                ) : (
                  <span className="text-xs text-ink-muted dark:text-ink-muted-dark">-</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(p)}
                    className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-danger-100 dark:hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
