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
    <div>
      {/* ============================================================== */}
      {/* TAMPILAN MOBILE (< 768px): Card View Responsif Bebas Terpotong */}
      {/* ============================================================== */}
      <div className="block md:hidden space-y-3.5">
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
            <div
              key={t.id}
              className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark p-4 space-y-3 shadow-xs hover:border-emerald-500/40 transition-all"
            >
              {/* Header Card: Anggota & Status */}
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/anggota/${t.anggota?.id || t.anggota_id}`}
                  className="flex items-center gap-3 hover:text-emerald-600 transition-colors min-w-0"
                >
                  <Avatar src={t.anggota?.foto} name={t.anggota?.nama} size={42} />
                  <div className="min-w-0">
                    <p className="font-bold text-ink dark:text-ink-dark truncate text-sm">
                      {t.anggota?.nama || 'Anggota'}
                    </p>
                    <p className="text-xs font-mono text-ink-muted dark:text-ink-muted-dark">
                      {t.anggota?.kode_anggota || '-'}
                    </p>
                  </div>
                </Link>
                <Badge tone={t.anggota?.status !== false ? 'emerald' : 'danger'}>
                  {t.anggota?.status !== false ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              </div>

              {/* Pill Skema & Lama Tabungan */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 p-2.5 text-xs">
                <div className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="capitalize">{skema.periode}</span>
                  <span>•</span>
                  <span>{skema.lamaBulan} Bulan</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
                  {skema.totalPeriode}x {skema.labelPeriode}
                </span>
              </div>

              {/* Rincian Finansial: Saldo, Target, Cicilan Ideal */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-border/70 dark:border-border-dark/70 bg-bg/40 dark:bg-bg-dark/40 p-2.5">
                  <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark block">Saldo Terkumpul</span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 block mt-0.5 truncate">
                    {formatCurrency(t.saldo)}
                  </span>
                </div>
                <div className="rounded-xl border border-border/70 dark:border-border-dark/70 bg-bg/40 dark:bg-bg-dark/40 p-2.5">
                  <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark block">Target Qurban</span>
                  <span className="font-bold text-sm text-ink dark:text-ink-dark block mt-0.5 truncate">
                    {formatCurrency(t.target)}
                  </span>
                </div>
                <div className="col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 flex items-center justify-between">
                  <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
                    Cicilan Ideal ({skema.labelPeriode}):
                  </span>
                  <span className="font-bold text-sm text-ink dark:text-ink-dark">
                    {formatCurrency(skema.nominalPerPeriode)}{' '}
                    <span className="text-xs font-normal text-ink-muted">/{skema.labelPeriode}</span>
                  </span>
                </div>
              </div>

              {/* Progres Tabungan */}
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted dark:text-ink-muted-dark text-[11px]">Progres Tabungan</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{persentase}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100/60 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${persentase}%` }}
                  />
                </div>
              </div>

              {/* Tombol Aksi Mobile */}
              <div className="flex items-center gap-2 pt-1">
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
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Ingatkan WA</span>
                  </button>
                )}

                {canEdit && onEditPlan && (
                  <button
                    type="button"
                    onClick={() => onEditPlan(t)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/40 py-2 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 transition-all cursor-pointer"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>Atur Skema</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ============================================================== */}
      {/* TAMPILAN DESKTOP (>= 768px): Table View Lengkap                */}
      {/* ============================================================== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
              <th className="py-3 pr-4 whitespace-nowrap">Anggota</th>
              <th className="py-3 pr-4 whitespace-nowrap">Skema &amp; Lama Tabungan</th>
              <th className="py-3 pr-4 whitespace-nowrap">Cicilan Ideal</th>
              <th className="py-3 pr-4 whitespace-nowrap">Saldo Terkumpul</th>
              <th className="py-3 pr-4 whitespace-nowrap">Target</th>
              <th className="py-3 pr-4 whitespace-nowrap">Progres</th>
              <th className="py-3 pr-4 whitespace-nowrap">Status</th>
              <th className="py-3 pr-4 text-right whitespace-nowrap">Aksi</th>
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
                    <p className="font-bold text-ink dark:text-ink-dark whitespace-nowrap">
                      {formatCurrency(skema.nominalPerPeriode)}
                      <span className="text-xs font-normal text-ink-muted dark:text-ink-muted-dark">
                        {' '}/ {skema.labelPeriode}
                      </span>
                    </p>
                  </td>
                  <td className="py-3 pr-4 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatCurrency(t.saldo)}
                  </td>
                  <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark whitespace-nowrap">
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
    </div>
  )
}
