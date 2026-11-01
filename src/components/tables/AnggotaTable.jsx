import { Link } from 'react-router-dom'
import { Pencil, Trash2, Eye, Building2, Users, MessageCircle } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import { sendDirectWhatsAppReminder } from '../../utils/whatsappReminder'

function getTabunganInfo(anggota) {
  const raw = anggota?.tabungan
  if (Array.isArray(raw)) return raw[0] || { saldo: 0, target: 0 }
  if (raw && typeof raw === 'object') return raw
  return { saldo: 0, target: 0 }
}

export default function AnggotaTable({
  data = [],
  onEdit,
  onDelete,
  onToggleStatus,
  isAdmin = true,
  currentAnggotaId = null,
  currentUserId = null,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
            <th className="py-3 pr-3 w-12">No.</th>
            <th className="py-3 pr-4">Nama Anggota</th>
            <th className="py-3 pr-4">Instansi & Kelompok</th>
            <th className="py-3 pr-4">No. HP</th>
            <th className="py-3 pr-4">Saldo Tabungan</th>
            <th className="py-3 pr-4">Bergabung</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-border-dark">
          {data.map((a, idx) => {
            const tb = getTabunganInfo(a)
            const isSelf =
              (currentAnggotaId && a.id === currentAnggotaId) ||
              (currentUserId && a.user_id && a.user_id === currentUserId)
            return (
              <tr
                key={a.id}
                className={`transition-colors ${
                  isSelf
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30'
                    : 'hover:bg-bg/50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-3 pr-3 font-mono text-xs font-bold text-ink-muted dark:text-ink-muted-dark">
                  #{idx + 1}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={a.foto} name={a.nama} size={36} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink dark:text-ink-dark">{a.nama}</p>
                        {isSelf && (
                          <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-ink-muted dark:text-ink-muted-dark">{a.kode_anggota}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="space-y-1">
                    {a.instansi?.nama_instansi ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{a.instansi.nama_instansi}</span>
                      </div>
                    ) : null}
                    {a.kelompok?.nama_kelompok ? (
                      <div className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        <Users className="h-3 w-3 shrink-0" />
                        <span>{a.kelompok.nama_kelompok}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-muted dark:text-ink-muted-dark">Belum pilih kelompok</span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">{a.no_hp || '-'}</td>
                <td className="py-3 pr-4">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(tb.saldo || 0)}
                  </p>
                  {Number(tb.target) > 0 && (
                    <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">
                      Target: {formatCurrency(tb.target)}
                    </p>
                  )}
                </td>
                <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">
                  {formatDate(a.tanggal_bergabung)}
                </td>
                <td className="py-3 pr-4">
                  {isAdmin && onToggleStatus ? (
                    <button
                      onClick={() => onToggleStatus(a)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        a.status
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/50'
                          : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50'
                      }`}
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
                      title="Lihat Detail"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            sendDirectWhatsAppReminder({
                              anggotaId: a.id,
                              noHp: a.no_hp,
                              nama: a.nama,
                              kodeAnggota: a.kode_anggota,
                              namaInstansi: a.instansi?.nama_instansi,
                              namaKelompok: a.kelompok?.nama_kelompok,
                              periode: a.periode_setoran || 'bulanan',
                              lamaBulan: a.lama_tabungan || 12,
                              saldo: tb.saldo || 0,
                              target: tb.target || 3000000,
                              jenisPesan: 'rutin',
                            })
                          }
                          className="rounded-lg p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700"
                          title="Ingatkan Pembayaran ke WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(a)}
                          className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600"
                          title="Edit Anggota"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(a)}
                          className="rounded-lg p-2 text-ink-muted dark:text-ink-muted-dark hover:bg-danger-100 dark:hover:bg-danger/10 hover:text-danger"
                          title="Hapus Anggota"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
