import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageCircle,
  BellRing,
  CalendarClock,
  ArrowDownCircle,
  Settings2,
  CheckCircle2,
  Eye,
  Send,
  Search,
  ShieldCheck,
  Phone,
  Sparkles,
} from 'lucide-react'
import { useTabunganList } from '../../hooks/useTabungan'
import { useAnggotaBelumSetor } from '../../hooks/useTransaksi'
import { useAuth } from '../../context/AuthContext'
import { enrichRowWithSkema } from '../../repositories/tabunganRepository'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import Modal from '../modal/Modal'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import EmptyState from '../ui/EmptyState'
import { formatCurrency, calculateSkemaTabungan } from '../../utils/formatCurrency'
import {
  buildPaymentReminderMessage,
  sendDirectWhatsAppReminder,
  getReminderLogs,
  formatWhatsAppNumber,
} from '../../utils/whatsappReminder'

export default function WaPaymentReminderCard() {
  const { isAdmin, isSuperAdmin, instansiSaya } = useAuth()
  const { data: tabunganList, isLoading: loadingTabungan } = useTabunganList()
  const { data: belumSetorList, isLoading: loadingBelumSetor } = useAnggotaBelumSetor()

  const [filterMode, setFilterMode] = useState('belum_setor') // 'belum_setor' | 'belum_lunas' | 'bulanan' | 'mingguan'
  const [jenisPesan, setJenisPesan] = useState('rutin') // 'rutin' | 'telat' | 'progres'
  const [bulanTelat, setBulanTelat] = useState(2)
  const [search, setSearch] = useState('')
  const [previewItem, setPreviewItem] = useState(null)
  const [customText, setCustomText] = useState('')
  const [reminderLogs, setReminderLogs] = useState(() => getReminderLogs())

  // Gabungkan data tabungan dengan daftar anggota belum setor bulan ini
  const belumSetorIds = useMemo(() => {
    return new Set((belumSetorList || []).map((a) => a.id))
  }, [belumSetorList])

  const normalizedRows = useMemo(() => {
    const rows = []
    const seenAnggotaIds = new Set()

    for (const rawTb of tabunganList || []) {
      const tb = enrichRowWithSkema(rawTb)
      const anggota = tb.anggota || {}
      const anggotaId = tb.anggota_id || anggota.id
      if (!anggotaId) continue
      seenAnggotaIds.add(anggotaId)

      const periode = tb.periode_setoran || anggota.periode_setoran || 'bulanan'
      const lamaBulan = Number(tb.lama_tabungan || anggota.lama_tabungan || 12)
      const saldo = Number(tb.saldo || 0)
      const target = Number(tb.target || 3000000)
      const skema = calculateSkemaTabungan({ target, saldo, periode, lamaBulan })

      rows.push({
        id: tb.id,
        anggotaId,
        nama: anggota.nama || 'Jamaah Qurban',
        kodeAnggota: anggota.kode_anggota || '',
        noHp: anggota.no_hp || '',
        statusAktif: anggota.status !== false,
        namaInstansi:
          anggota.instansi?.nama_instansi ||
          instansiSaya?.nama_instansi ||
          'Masjid / Instansi Qurban',
        namaKelompok: anggota.kelompok?.nama_kelompok || '',
        periode: skema.periode,
        lamaBulan: skema.lamaBulan,
        saldo,
        target,
        sisaTarget: skema.sisaTarget,
        nominalPerPeriode: skema.nominalPerPeriode,
        labelPeriode: skema.labelPeriode,
        belumSetorBulanIni: belumSetorIds.has(anggotaId) || saldo === 0,
        belumLunas: saldo < target,
      })
    }

    // Tambahkan anggota dari belumSetorList jika belum ada di tabunganList
    for (const rawA of belumSetorList || []) {
      const a = enrichRowWithSkema(rawA)
      if (!a.id || seenAnggotaIds.has(a.id)) continue
      const periode = a.periode_setoran || 'bulanan'
      const lamaBulan = Number(a.lama_tabungan || 12)
      const saldo = 0
      const target = 3000000
      const skema = calculateSkemaTabungan({ target, saldo, periode, lamaBulan })

      rows.push({
        id: `bs-${a.id}`,
        anggotaId: a.id,
        nama: a.nama || 'Jamaah Qurban',
        kodeAnggota: a.kode_anggota || '',
        noHp: a.no_hp || '',
        statusAktif: a.status !== false,
        namaInstansi: instansiSaya?.nama_instansi || 'Masjid / Instansi Qurban',
        namaKelompok: '',
        periode: skema.periode,
        lamaBulan: skema.lamaBulan,
        saldo,
        target,
        sisaTarget: skema.sisaTarget,
        nominalPerPeriode: skema.nominalPerPeriode,
        labelPeriode: skema.labelPeriode,
        belumSetorBulanIni: true,
        belumLunas: true,
      })
    }

    return rows.filter((r) => r.statusAktif)
  }, [tabunganList, belumSetorList, belumSetorIds, instansiSaya])

  const filteredRows = useMemo(() => {
    return normalizedRows.filter((r) => {
      if (filterMode === 'belum_setor' && !r.belumSetorBulanIni) return false
      if (filterMode === 'belum_lunas' && !r.belumLunas) return false
      if (filterMode === 'bulanan' && r.periode !== 'bulanan') return false
      if (filterMode === 'mingguan' && r.periode !== 'mingguan') return false

      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matchNama = r.nama.toLowerCase().includes(q)
        const matchKode = r.kodeAnggota.toLowerCase().includes(q)
        const matchHp = r.noHp.toLowerCase().includes(q)
        const matchInstansi = r.namaInstansi.toLowerCase().includes(q)
        if (!matchNama && !matchKode && !matchHp && !matchInstansi) return false
      }
      return true
    })
  }, [normalizedRows, filterMode, search])

  function handleDirectSend(item) {
    const ok = sendDirectWhatsAppReminder({
      anggotaId: item.anggotaId,
      noHp: item.noHp,
      nama: item.nama,
      kodeAnggota: item.kodeAnggota,
      namaInstansi: item.namaInstansi,
      namaKelompok: item.namaKelompok,
      periode: item.periode,
      lamaBulan: item.lamaBulan,
      saldo: item.saldo,
      target: item.target,
      bulanTelat,
      rekeningInstansi: instansiSaya,
      jenisPesan,
    })
    if (ok) {
      setReminderLogs(getReminderLogs())
    }
  }

  function handleOpenPreview(item) {
    const msg = buildPaymentReminderMessage({
      nama: item.nama,
      kodeAnggota: item.kodeAnggota,
      namaInstansi: item.namaInstansi,
      namaKelompok: item.namaKelompok,
      periode: item.periode,
      lamaBulan: item.lamaBulan,
      saldo: item.saldo,
      target: item.target,
      bulanTelat,
      rekeningInstansi: instansiSaya,
      jenisPesan,
    })
    setPreviewItem(item)
    setCustomText(msg)
  }

  function handleSendFromModal(e) {
    e.preventDefault()
    if (!previewItem) return
    const ok = sendDirectWhatsAppReminder({
      anggotaId: previewItem.anggotaId,
      noHp: previewItem.noHp,
      nama: previewItem.nama,
      customMessage: customText,
    })
    if (ok) {
      setReminderLogs(getReminderLogs())
      setPreviewItem(null)
    }
  }

  const isLoading = loadingTabungan || loadingBelumSetor

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tl from-emerald-800 to-emerald-600 text-white shadow-md shadow-emerald-900/20">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Pengingat Pembayaran Langsung ke WhatsApp (WA)</CardTitle>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" /> 1-Klik Langsung ke WA
              </span>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-muted-dark">
              Kirim pengingat setoran bulanan/mingguan, solusi keterlambatan pembayaran, serta info nomor rekening langsung ke WhatsApp jamaah
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            {filteredRows.length} Jamaah Ditampilkan
          </span>
        </div>
      </CardHeader>

      {/* Panduan 3 Solusi Penanganan Jamaah Telat Bayar */}
      <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-950/25 p-4 md:grid-cols-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-ink dark:text-ink-dark">
              1. Saldo Aman &amp; Tanpa Hangus
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted dark:text-ink-muted-dark">
              Tidak ada batas waktu hangus. Jika jamaah telat membayar, saldo tetap tersimpan aman sampai target qurban terpenuhi.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <CalendarClock className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-ink dark:text-ink-dark">
              2. Sesuaikan Lama Tabungan (Misal 30 Bulan)
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted dark:text-ink-muted-dark">
              Jika cicilan terasa berat, ubah skema ke <strong>Mingguan</strong> atau perpanjang <strong>Lama Tabungan</strong> (24 s.d. 30 bulan) di menu Tabungan.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <MessageCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-ink dark:text-ink-dark">
              3. Pengingat Otomatis Lengkap Rekening
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted dark:text-ink-muted-dark">
              Klik tombol <strong>Ingatkan ke WA</strong> untuk membuka chat WhatsApp jamaah lengkap dengan rincian nominal cicilan dan nomor rekening masjid.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar Filter, Pencarian & Template Pesan WA */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border dark:border-border-dark bg-bg/60 dark:bg-bg-dark/60 p-3.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Filter Kategori Jamaah */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'belum_setor', label: 'Belum Setor Periode Ini' },
            { id: 'belum_lunas', label: 'Semua Belum Lunas' },
            { id: 'bulanan', label: 'Skema Bulanan' },
            { id: 'mingguan', label: 'Skema Mingguan' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                filterMode === tab.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-surface dark:bg-surface-dark text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark border border-border dark:border-border-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pilihan Template Pesan WA & Pencarian */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
              Template WA:
            </span>
            <select
              value={jenisPesan}
              onChange={(e) => setJenisPesan(e.target.value)}
              className="h-9 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-2.5 text-xs font-bold text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none"
            >
              <option value="rutin">Pengingat Setoran Rutin</option>
              <option value="telat">Pengingat Telat Bayar + Solusi</option>
              <option value="progres">Info Saldo &amp; Nomor Rekening</option>
            </select>
          </div>

          {jenisPesan === 'telat' && (
            <select
              value={bulanTelat}
              onChange={(e) => setBulanTelat(Number(e.target.value))}
              className="h-9 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 px-2.5 text-xs font-bold text-amber-800 dark:text-amber-300 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  Telat {n} Periode
                </option>
              ))}
            </select>
          )}

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau No. WA..."
              className="h-9 w-full rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark pl-8 pr-3 text-xs text-ink dark:text-ink-dark placeholder:text-ink-muted/60 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Daftar Jamaah untuk Diingatkan ke WA */}
      {isLoading ? (
        <div className="flex h-28 items-center justify-center">
          <Spinner />
        </div>
      ) : !filteredRows.length ? (
        <EmptyState
          icon={CheckCircle2}
          title="Tidak ada jamaah pada kategori filter ini"
          description="Coba ubah tab filter ke 'Semua Belum Lunas' untuk melihat seluruh anggota aktif."
        />
      ) : (
        <ul className="divide-y divide-border dark:divide-border-dark">
          {filteredRows.map((item) => {
            const waNumber = formatWhatsAppNumber(item.noHp)
            const lastSentIso = reminderLogs[item.anggotaId]
            const sentToday =
              lastSentIso &&
              new Date(lastSentIso).toDateString() === new Date().toDateString()
            const nominalDitampilkan =
              jenisPesan === 'telat'
                ? item.nominalPerPeriode * bulanTelat
                : item.nominalPerPeriode

            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 py-3.5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/anggota/${item.anggotaId}`}
                      className="text-sm font-bold text-ink dark:text-ink-dark hover:text-emerald-600 transition-colors"
                    >
                      {item.nama}
                    </Link>
                    {item.kodeAnggota && (
                      <span className="font-mono text-xs text-ink-muted dark:text-ink-muted-dark">
                        ({item.kodeAnggota})
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <CalendarClock className="h-3 w-3" />
                      <span className="capitalize">{item.periode}</span> • {item.lamaBulan} Bulan
                    </span>
                    {sentToday && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Sudah Diingatkan Hari Ini
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted dark:text-ink-muted-dark">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      {item.noHp || 'Belum ada No. WA'}
                    </span>

                    <Link
                      to="/tabungan"
                      className="hover:text-emerald-600 transition-colors"
                      title="Klik untuk masuk ke menu Tabungan"
                    >
                      Tagihan {jenisPesan === 'telat' ? `(${bulanTelat}x)` : 'Rutin'}:{' '}
                      <strong className="text-emerald-700 dark:text-emerald-400 underline decoration-emerald-500/40 underline-offset-2">
                        {formatCurrency(nominalDitampilkan)} / {item.labelPeriode}
                      </strong>
                    </Link>

                    <Link
                      to="/tabungan"
                      className="hover:text-emerald-600 transition-colors"
                      title="Klik untuk masuk ke menu Tabungan"
                    >
                      Saldo:{' '}
                      <strong className="text-ink dark:text-ink-dark">
                        {formatCurrency(item.saldo)}
                      </strong>{' '}
                      dari {formatCurrency(item.target)}
                    </Link>
                  </div>
                </div>

                {/* Tombol Aksi Langsung ke WhatsApp & Menu Terkait */}
                <div className="flex flex-wrap items-center gap-2">
                  {(isAdmin || isSuperAdmin) && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDirectSend(item)}
                        disabled={!waNumber}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
                        title={
                          waNumber
                            ? `Kirim pengingat pembayaran langsung ke WhatsApp ${item.noHp}`
                            : 'Nomor WhatsApp belum diisi'
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                        Ingatkan ke WA
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Lihat & sesuaikan isi pesan WA sebelum dikirim"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview Pesan
                      </button>

                      <Link
                        to="/transaksi/setoran"
                        state={{ anggotaId: item.anggotaId }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-xs font-bold text-ink dark:text-ink-dark hover:border-emerald-500 transition-colors"
                      >
                        <ArrowDownCircle className="h-3.5 w-3.5 text-emerald-600" />
                        Catat Setoran
                      </Link>

                      <Link
                        to="/tabungan"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark hover:border-emerald-500 hover:text-ink dark:hover:text-ink-dark transition-colors"
                      >
                        <Settings2 className="h-3.5 w-3.5 text-emerald-600" />
                        Atur Skema
                      </Link>
                    </>
                  )}

                  {!isAdmin && !isSuperAdmin && (
                    <Link
                      to="/tabungan"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                    >
                      Lihat Rincian Tabungan →
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal Preview & Custom Pesan Pengingat WhatsApp */}
      <Modal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={`Kirim Pengingat Pembayaran WA — ${previewItem?.nama ?? ''}`}
        size="md"
      >
        <form onSubmit={handleSendFromModal} className="space-y-4">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 text-xs text-ink dark:text-ink-dark flex items-center justify-between">
            <div>
              <p className="font-bold">{previewItem?.nama}</p>
              <p className="text-ink-muted dark:text-ink-muted-dark">
                Nomor Tujuan WA: <strong className="font-mono">{previewItem?.noHp || 'Belum diisi'}</strong>
              </p>
            </div>
            <span className="rounded-lg bg-emerald-600/15 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(previewItem?.nominalPerPeriode || 0)} / {previewItem?.labelPeriode}
            </span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink dark:text-ink-dark">
              Isi Pesan WhatsApp (Dapat diedit sebelum dikirim):
            </label>
            <textarea
              rows={11}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full rounded-2xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark p-3.5 text-xs leading-relaxed text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setPreviewItem(null)}>
              Batal
            </Button>
            <Button type="submit">
              <Send className="h-4 w-4" />
              Kirim Langsung ke WhatsApp
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}

