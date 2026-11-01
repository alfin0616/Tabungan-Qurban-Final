import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Layers,
  Wallet,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react'
import Modal from './Modal'
import { useKelompokList } from '../../hooks/useKelompok'
import { useAnggotaList } from '../../hooks/useAnggota'
import { formatCurrency } from '../../utils/formatCurrency'

function extractTabungan(anggota) {
  const raw = anggota?.tabungan
  if (Array.isArray(raw)) return raw[0] || { saldo: 0, target: 0 }
  if (raw && typeof raw === 'object') return raw
  return { saldo: 0, target: 0 }
}

export default function InstansiMonitoringModal({ open, onClose, instansi }) {
  const [activeTab, setActiveTab] = useState('hirarki')
  const [expandedKelompok, setExpandedKelompok] = useState({})
  const [searchAnggota, setSearchAnggota] = useState('')

  const instansiId = instansi?.id || instansi?.instansi_id

  const { data: kelompokRes, isLoading: loadingKelompok } = useKelompokList(
    instansiId ? { instansi_id: instansiId, page: 1, pageSize: 100 } : { page: 1, pageSize: 1 },
  )

  const { data: anggotaRes, isLoading: loadingAnggota } = useAnggotaList(
    instansiId
      ? { instansi_id: instansiId, status: 'semua', page: 1, pageSize: 200 }
      : { page: 1, pageSize: 1 },
  )

  const kelompokList = useMemo(() => {
    if (!instansiId) return []
    return (kelompokRes?.data || []).filter((k) => k.instansi_id === instansiId)
  }, [kelompokRes, instansiId])

  const anggotaList = useMemo(() => {
    if (!instansiId) return []
    return (anggotaRes?.data || []).filter((a) => a.instansi_id === instansiId)
  }, [anggotaRes, instansiId])

  const stats = useMemo(() => {
    const totalKelompok = kelompokList.length
    const totalAnggota = anggotaList.length
    const totalSaldo = anggotaList.reduce((acc, a) => {
      const tb = extractTabungan(a)
      return acc + Number(tb.saldo || 0)
    }, 0)
    return { totalKelompok, totalAnggota, totalSaldo }
  }, [kelompokList, anggotaList])

  const filteredAnggota = useMemo(() => {
    const q = searchAnggota.trim().toLowerCase()
    if (!q) return anggotaList
    return anggotaList.filter(
      (a) =>
        (a.nama || '').toLowerCase().includes(q) ||
        (a.kode_anggota || '').toLowerCase().includes(q) ||
        (a.kelompok?.nama_kelompok || '').toLowerCase().includes(q),
    )
  }, [anggotaList, searchAnggota])

  const toggleKelompok = (id) => {
    setExpandedKelompok((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }))
  }

  if (!instansi) return null

  const namaInstansi = instansi.nama_instansi || instansi.nama || 'Instansi'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Monitoring Instansi: ${namaInstansi}`}
      size="xl"
    >
      <div className="space-y-5">
        {/* Instansi Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 p-4 text-white shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">{namaInstansi}</h3>
                <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-xs font-semibold">
                  {instansi.kode_instansi || '-'}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {instansi.nomor_rekening || instansi.rekening
                  ? `Rekening Instansi: ${instansi.nama_bank ? instansi.nama_bank + ' • ' : ''}${instansi.nomor_rekening || instansi.rekening}${instansi.atas_nama_rekening ? ' (a.n. ' + instansi.atas_nama_rekening + ')' : ''}`
                  : 'Mode Monitoring Super Admin • Pantau Kelompok & Anggota secara langsung'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Link
              to={`/kelompok?instansi_id=${instansiId}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <Layers className="h-3.5 w-3.5" />
              Ke Halaman Kelompok
            </Link>
            <Link
              to={`/anggota?instansi_id=${instansiId}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 text-xs font-bold transition-colors shadow-xs"
            >
              <Users className="h-3.5 w-3.5" />
              Ke Halaman Anggota
            </Link>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border dark:border-border-dark bg-bg/60 dark:bg-slate-800/40 p-3.5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
                Total Kelompok
              </p>
              <p className="text-lg font-extrabold text-ink dark:text-white">
                { stats.totalKelompok } Kelompok
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border dark:border-border-dark bg-bg/60 dark:bg-slate-800/40 p-3.5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
                Total Anggota
              </p>
              <p className="text-lg font-extrabold text-ink dark:text-white">
                { stats.totalAnggota } Jamaah
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border dark:border-border-dark bg-bg/60 dark:bg-slate-800/40 p-3.5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
                Total Tabungan
              </p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                { formatCurrency(stats.totalSaldo) }
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border dark:border-border-dark pb-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('hirarki')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'hirarki'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Hirarki Kelompok & Anggota ({stats.totalKelompok})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('anggota')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'anggota'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua Anggota ({stats.totalAnggota})
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loadingKelompok || loadingAnggota ? (
          <div className="py-12 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            Memuat data kelompok dan anggota...
          </div>
        ) : activeTab === 'hirarki' ? (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {kelompokList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border dark:border-border-dark p-8 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
                Belum ada Kelompok Qurban yang terdaftar pada instansi ini.
              </div>
            ) : (
              kelompokList.map((kel) => {
                const members = anggotaList.filter((a) => a.kelompok_id === kel.id)
                const isExpanded = expandedKelompok[kel.id] ?? true
                const saldoKelompok = members.reduce((acc, m) => {
                  const tb = extractTabungan(m)
                  return acc + Number(tb.saldo || 0)
                }, 0)
                const targetKelompok = Number(kel.target_dana || 0)
                const pct =
                  targetKelompok > 0
                    ? Math.min(100, Math.round((saldoKelompok / targetKelompok) * 100))
                    : 0

                return (
                  <div
                    key={kel.id}
                    className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleKelompok(kel.id)}
                      className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-bg/60 dark:bg-slate-800/50 px-4 py-3 text-left hover:bg-bg dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-ink-muted shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-ink-muted shrink-0" />
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-ink dark:text-white">
                              {kel.nama_kelompok}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                kel.jenis_qurban === 'sapi'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                              }`}
                            >
                              {kel.jenis_qurban}
                            </span>
                            <span className="text-xs font-mono text-ink-muted dark:text-ink-muted-dark">
                              ({kel.kode_kelompok})
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
                            Anggota: <strong>{members.length}</strong> / {kel.maksimal_anggota} Orang • Target Kelompok: {formatCurrency(targetKelompok)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(saldoKelompok)} ({pct}%)
                          </p>
                          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="divide-y divide-border/60 dark:divide-border-dark px-4 py-2">
                        {members.length === 0 ? (
                          <p className="py-3 text-xs italic text-ink-muted dark:text-ink-muted-dark">
                            Belum ada anggota di kelompok ini.
                          </p>
                        ) : (
                          members.map((m) => {
                            const tb = extractTabungan(m)
                            return (
                              <div
                                key={m.id}
                                className="flex items-center justify-between py-2.5 text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  {m.status ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                  )}
                                  <div>
                                    <span className="font-semibold text-ink dark:text-white">
                                      {m.nama}
                                    </span>
                                    <span className="ml-2 font-mono text-[11px] text-ink-muted dark:text-ink-muted-dark">
                                      {m.kode_anggota} • {m.no_hp || '-'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(tb.saldo || 0)}
                                  </span>
                                  <Link
                                    to={`/anggota/${m.id}`}
                                    onClick={onClose}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                                    title="Lihat Detail Anggota"
                                  >
                                    Detail <ExternalLink className="h-3 w-3" />
                                  </Link>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchAnggota}
                onChange={(e) => setSearchAnggota(e.target.value)}
                placeholder="Cari nama anggota, kode, atau nama kelompok..."
                className="w-full rounded-xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark pl-9 pr-3 py-2 text-xs text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-border dark:border-border-dark">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-ink-muted dark:text-ink-muted-dark border-b border-border dark:border-border-dark">
                  <tr>
                    <th className="py-2.5 px-3">Anggota</th>
                    <th className="py-2.5 px-3">Kelompok</th>
                    <th className="py-2.5 px-3">No. HP</th>
                    <th className="py-2.5 px-3">Saldo Tabungan</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 dark:divide-border-dark">
                  {filteredAnggota.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-ink-muted">
                        Tidak ada data anggota yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredAnggota.map((a) => {
                      const tb = extractTabungan(a)
                      return (
                        <tr key={a.id} className="hover:bg-bg/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-ink dark:text-white">{a.nama}</div>
                            <div className="font-mono text-[10px] text-ink-muted">{a.kode_anggota}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            {a.kelompok?.nama_kelompok ? (
                              <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-600 dark:text-indigo-400">
                                {a.kelompok.nama_kelompok}
                              </span>
                            ) : (
                              <span className="text-ink-muted">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-ink-muted">{a.no_hp || '-'}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(tb.saldo || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              to={`/anggota/${a.id}`}
                              onClick={onClose}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                            >
                              Detail <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
