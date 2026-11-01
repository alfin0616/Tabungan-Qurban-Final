import { Eye, Trash2, Camera, FileDown } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function RiwayatTable({
  data = [],
  onDetail,
  onDownloadPdf,
  onDelete,
  isAdmin = true,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[740px] text-left text-sm">
        <thead>
          <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
            <th className="py-3 pr-4">Tanggal</th>
            <th className="py-3 pr-4">Anggota</th>
            <th className="py-3 pr-4">Jenis</th>
            <th className="py-3 pr-4">Metode</th>
            <th className="py-3 pr-4">Nominal</th>
            <th className="py-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-border-dark">
          {data.map((t) => (
            <tr
              key={t.id}
              className="hover:bg-bg/50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">
                {formatDate(t.tanggal)}
              </td>
              <td className="py-3 pr-4">
                <p className="font-semibold text-ink dark:text-ink-dark">
                  {t.anggota?.nama || '-'}
                </p>
                <p className="text-xs font-mono text-ink-muted dark:text-ink-muted-dark">
                  {t.anggota?.kode_anggota || ''}
                </p>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5">
                  <Badge tone={t.jenis === 'setoran' ? 'emerald' : 'danger'}>
                    {t.jenis === 'setoran' ? 'Setoran' : 'Penarikan'}
                  </Badge>
                  {t.bukti && (
                    <Camera className="h-3.5 w-3.5 text-ink-muted dark:text-ink-muted-dark" />
                  )}
                </div>
              </td>
              <td className="py-3 pr-4">
                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold uppercase text-ink-muted dark:text-ink-muted-dark">
                  {t.metode_pembayaran || 'TUNAI'}
                </span>
              </td>
              <td className="py-3 pr-4 font-bold text-ink dark:text-ink-dark">
                {formatCurrency(t.nominal)}
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center justify-end gap-1.5">
                  {onDownloadPdf && (
                    <button
                      type="button"
                      onClick={() => onDownloadPdf(t)}
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                      title="Download PDF Kwitansi Transaksi"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDetail(t)}
                    className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600 cursor-pointer"
                    title="Lihat Detail Transaksi"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onDelete(t)}
                      className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-danger-100 dark:hover:bg-danger/10 hover:text-danger cursor-pointer"
                      title="Hapus Transaksi"
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
