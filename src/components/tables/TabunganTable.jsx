import { Link } from 'react-router-dom'
import { CalendarClock, Settings2, MessageCircle } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { formatCurrency, calculateSkemaTabungan } from '../../utils/formatCurrency'
import { sendDirectWhatsAppReminder } from '../../utils/whatsappReminder'

export default function TabunganTable({
  data = [],
  onEditPlan,
  isAdmin = false,
  currentAnggotaId = null,
  rekeningInstansi = null,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
            <th className="py-3 pr-4">Anggota</th>
            <th className="py-3 pr-4">Skema &amp; Lama Tabungan</th>
            <th className="py-3 pr-4">Cicilan Ideal</th>
            <th className="py-3 pr-4">Saldo Terkumpul</th>
            <th className="py-3 pr-4">Target</th>
            <th className="py-3 pr-4">Progres</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-border-dark">
          {data.map((t) => {
            const persentase = t.target > 0 ? Math.min(100, Math.round((t.saldo / t.target) * 100)) : 0
            const skema = calculateSkemaTabungan({
              target: t.target || 3000000,
              saldo: t.saldo || 0,
              periode: t.periode_setoran || t.anggota?.periode_setoran || 'bulanan',
              lamaBulan: t.lama_tabungan || t.anggota?.lama_tabungan || 12,
            })
            const canEdit = isAdmin || (currentAnggotaId && t.anggota_id === currentAnggotaId)

            return (
              <tr key={t.id} className="hover:bg-bg/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 pr-4">
                  <Link to={`/anggota/${t.anggota?.id || t.anggota_id}`} className="flex items-center gap-3 hover:text-emerald-600">
                    <Avatar src={t.anggota?.foto} name={t.anggota?.nama} size={34} />
                    <div>
                      <p className="font-semibold text-ink dark:text-ink-dark">{t.anggota?.nama || 'Anggota'}</p>
                      <p className="text-xs font-mono text-ink-muted dark:text-ink-muted-dark">{t.anggota?.kode_anggota}</p>
                    </div>
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                    <span className="capitalize">{skema.periode}</span>
                    <span>•</span>
                    <span>{skema.lamaBulan} Bulan</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-muted dark:text-ink-muted-dark">
                    Fleksibel ({skema.totalPeriode}x {skema.labelPeriode})
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <p className="font-bold text-ink dark:text-ink-dark">
                    {formatCurrency(skema.nominalPerPeriode)}
                    <span className="text-xs font-normal text-ink-muted dark:text-ink-muted-dark">
                      {' '}/ {skema.labelPeriode}
                    </span>
                  </p>
                </td>
                <td className="py-3 pr-4 font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(t.saldo)}
                </td>
                <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">
                  {formatCurrency(t.target)}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-emerald-50 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${persentase}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">{persentase}%</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={t.anggota?.status !== false ? 'emerald' : 'danger'}>
                    {t.anggota?.status !== false ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          sendDirectWhatsAppReminder({
                            anggotaId: t.anggota?.id || t.anggota_id,
                            noHp: t.anggota?.no_hp,
                            nama: t.anggota?.nama,
                            kodeAnggota: t.anggota?.kode_anggota,
                            namaInstansi:
                              t.anggota?.instansi?.nama_instansi ||
                              rekeningInstansi?.nama_instansi,
                            namaKelompok: t.anggota?.kelompok?.nama_kelompok,
                            periode: skema.periode,
                            lamaBulan: skema.lamaBulan,
                            saldo: t.saldo,
                            target: t.target,
                            rekeningInstansi,
                            jenisPesan: 'rutin',
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer"
                        title="Kirim pengingat pembayaran langsung ke WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Ingatkan WA
                      </button>
                    )}

                    {canEdit && onEditPlan && (
                      <button
                        type="button"
                        onClick={() => onEditPlan(t)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Atur Skema
                      </button>
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
