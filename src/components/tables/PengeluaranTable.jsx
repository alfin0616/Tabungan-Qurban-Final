import { Pencil, Trash2, Receipt } from 'lucide-react'
import Badge from '../ui/Badge'
import { labelKategori } from '../../repositories/pengeluaranRepository'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function PengeluaranTable({ data = [], onEdit, onDelete }) {
  return (
    <div>
      {/* ============================================================== */}
      {/* TAMPILAN MOBILE (< 768px): Card View Responsif Bebas Terpotong */}
      {/* ============================================================== */}
      <div className="block md:hidden space-y-3">
        {data.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark p-3.5 space-y-2.5 shadow-xs transition-all hover:border-danger/30"
          >
            {/* Header: Kategori & Tanggal */}
            <div className="flex items-center justify-between gap-2">
              <Badge tone="danger">{labelKategori(p.kategori)}</Badge>
              <span className="text-xs text-ink-muted dark:text-ink-muted-dark">{formatDate(p.tanggal)}</span>
            </div>

            {/* Keterangan & Nominal */}
            <div className="flex items-end justify-between gap-2 pt-0.5">
              <div className="min-w-0">
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Keterangan:</p>
                <p className="font-semibold text-ink dark:text-ink-dark text-sm truncate">{p.keterangan || '-'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-extrabold text-base text-danger">{formatCurrency(p.nominal)}</p>
              </div>
            </div>

            {/* Bukti & Aksi */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60 dark:border-border-dark/60 text-xs">
              <div>
                {p.bukti ? (
                  <a
                    href={p.bukti}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline"
                  >
                    <Receipt className="h-3.5 w-3.5" /> Lihat Bukti
                  </a>
                ) : (
                  <span className="text-ink-muted dark:text-ink-muted-dark">Tanpa bukti</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(p)}
                  className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600 cursor-pointer"
                  title="Edit Pengeluaran"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p)}
                  className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-danger-100 dark:hover:bg-danger/10 hover:text-danger cursor-pointer"
                  title="Hapus Pengeluaran"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAMPILAN DESKTOP (>= 768px): Table View Lengkap                */}
      {/* ============================================================== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
              <th className="py-3 pr-4 whitespace-nowrap">Tanggal</th>
              <th className="py-3 pr-4 whitespace-nowrap">Kategori</th>
              <th className="py-3 pr-4 whitespace-nowrap">Keterangan</th>
              <th className="py-3 pr-4 whitespace-nowrap">Nominal</th>
              <th className="py-3 pr-4 whitespace-nowrap">Bukti</th>
              <th className="py-3 pr-4 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border-dark">
            {data.map((p) => (
              <tr key={p.id}>
                <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark whitespace-nowrap">
                  {formatDate(p.tanggal)}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  <Badge tone="danger">{labelKategori(p.kategori)}</Badge>
                </td>
                <td className="py-3 pr-4 text-ink dark:text-ink-dark">{p.keterangan || '-'}</td>
                <td className="py-3 pr-4 font-medium text-danger whitespace-nowrap">
                  {formatCurrency(p.nominal)}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">
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
                <td className="py-3 pr-4 whitespace-nowrap">
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
    </div>
  )
}
