import { useState, useMemo } from 'react'
import {
  Coins,
  Wallet,
  CalendarClock,
  Calculator,
  CheckCircle2,
  Users,
  Sparkles,
  CheckSquare,
  Square,
  Filter,
  Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useTabunganList, useUpdateTargetTabungan } from '../../hooks/useTabungan'
import { useTotalKasMasjid } from '../../hooks/useDashboard'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import TabunganTable from '../../components/tables/TabunganTable'
import Modal from '../../components/modal/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import InfoRekeningInstansiCard from '../../components/cards/InfoRekeningInstansiCard'
import {
  formatCurrency,
  calculateSkemaTabungan,
  LAMA_TABUNGAN_PRESETS,
  DAFTAR_BULAN,
  hitungLamaTabunganDariBulan,
  getDaftarBulanRentang,
} from '../../utils/formatCurrency'

export default function TabunganListPage() {
  const queryClient = useQueryClient()
  const { isAdmin, anggotaSaya, instansiSaya } = useAuth()
  const { data, isLoading } = useTabunganList()
  const { data: totalKas, isLoading: loadingKas } = useTotalKasMasjid()
  const updateTarget = useUpdateTargetTabungan()

  const [editing, setEditing] = useState(null)
  const [target, setTarget] = useState('')
  const [periodeSetoran, setPeriodeSetoran] = useState('bulanan')
  const [lamaTabungan, setLamaTabungan] = useState('12')
  const [customLama, setCustomLama] = useState(false)
  const [bulanMulai, setBulanMulai] = useState(7)
  const [bulanSelesai, setBulanSelesai] = useState(4)
  const [bulanTelat, setBulanTelat] = useState(2)
  const [applyToAllInKelompok, setApplyToAllInKelompok] = useState(false)
  const [kelompokFilter, setKelompokFilter] = useState('semua')
  const [isSyncingAll, setIsSyncingAll] = useState(false)

  const totalSaldo = (data ?? []).reduce((sum, t) => sum + Number(t.saldo || 0), 0)
  const totalTarget = (data ?? []).reduce((sum, t) => sum + Number(t.target || 0), 0)

  // Kelompok dari data tabungan
  const kelompokOptions = useMemo(() => {
    const map = new Map()
    ;(data || []).forEach((t) => {
      const k = t.anggota?.kelompok
      if (k?.id && !map.has(k.id)) {
        map.set(k.id, {
          id: k.id,
          nama: k.nama_kelompok,
          target_dana: k.target_dana,
          maksimal: k.maksimal_anggota,
          jenis: k.jenis_qurban,
        })
      }
    })
    return Array.from(map.values())
  }, [data])

  const filteredData = useMemo(() => {
    if (kelompokFilter === 'semua') return data || []
    return (data || []).filter(
      (t) => t.anggota?.kelompok?.id === kelompokFilter || t.anggota?.kelompok_id === kelompokFilter,
    )
  }, [data, kelompokFilter])

  function openEdit(item) {
    const initLama = Number(item.lama_tabungan || item.anggota?.lama_tabungan || 12)
    const isPreset = LAMA_TABUNGAN_PRESETS.some((p) => p.value === initLama)
    setEditing(item)
    setTarget(String(item.target ?? 3000000))
    setPeriodeSetoran(item.periode_setoran || item.anggota?.periode_setoran || 'bulanan')
    setLamaTabungan(String(initLama))
    setCustomLama(!isPreset)
    setApplyToAllInKelompok(false)
    if (initLama === 10) {
      setBulanMulai(7)
    } else if (initLama === 12) {
      setBulanMulai(5)
    }
  }

  function handleSelectBulanMulai(bVal) {
    const b = Number(bVal)
    setBulanMulai(b)
    const calculatedLama = hitungLamaTabunganDariBulan(b, bulanSelesai)
    setLamaTabungan(String(calculatedLama))
    setCustomLama(false)
  }

  const kelompokInfo = editing?.anggota?.kelompok
  const targetPerAnggotaKelompok = kelompokInfo?.target_dana
    ? Math.round(
        Number(kelompokInfo.target_dana) /
          Number(kelompokInfo.maksimal_anggota || (kelompokInfo.jenis_qurban === 'kambing' ? 1 : 7)),
      )
    : null

  const simulasiModal = useMemo(
    () =>
      calculateSkemaTabungan({
        target: Number(target) || 3000000,
        saldo: Number(editing?.saldo || 0),
        periode: periodeSetoran,
        lamaBulan: Number(lamaTabungan) || 12,
      }),
    [target, editing?.saldo, periodeSetoran, lamaTabungan],
  )

  async function handleSaveTarget(e) {
    e.preventDefault()
    try {
      const numTarget = Number(target)
      await updateTarget.mutateAsync({
        id: editing.id,
        target: numTarget,
        anggota_id: editing.anggota_id || editing.anggota?.id,
        periode_setoran: periodeSetoran,
        lama_tabungan: Math.max(1, Number(lamaTabungan) || 12),
      })

      if (applyToAllInKelompok && kelompokInfo?.id) {
        const { syncTargetByKelompok } = await import('../../repositories/tabunganRepository')
        await syncTargetByKelompok(kelompokInfo.id, numTarget)
        queryClient.invalidateQueries({ queryKey: ['tabungan'] })
        queryClient.invalidateQueries({ queryKey: ['anggota'] })
        toast.success(`Target berhasil diperbarui dan diterapkan ke semua anggota di ${kelompokInfo.nama_kelompok}`)
      } else {
        toast.success('Skema, lama tabungan, dan target berhasil diperbarui')
      }

      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui rencana tabungan')
    }
  }

  async function handleSyncAllWithKelompok() {
    if (!kelompokOptions.length) {
      toast.error('Belum ada kelompok yang terdata')
      return
    }
    const confirmed = window.confirm(
      'Sesuaikan target tabungan seluruh anggota agar otomatis mengikuti target kelompok masing-masing (Total Target Kelompok dibagi Kapasitas)?',
    )
    if (!confirmed) return

    setIsSyncingAll(true)
    try {
      const { syncTargetByKelompok } = await import('../../repositories/tabunganRepository')
      let count = 0
      for (const k of kelompokOptions) {
        if (k.target_dana) {
          const max = Number(k.maksimal || (k.jenis === 'kambing' ? 1 : 7))
          const targetPerAnggota = max > 0 ? Math.round(Number(k.target_dana) / max) : Number(k.target_dana)
          await syncTargetByKelompok(k.id, targetPerAnggota)
          count++
        }
      }
      queryClient.invalidateQueries({ queryKey: ['tabungan'] })
      queryClient.invalidateQueries({ queryKey: ['anggota'] })
      toast.success(`Berhasil! Target seluruh anggota disesuaikan dari ${count} kelompok`)
    } catch (err) {
      toast.error('Gagal sinkronisasi target kelompok: ' + err.message)
    } finally {
      setIsSyncingAll(false)
    }
  }

  return (
    <div className="space-y-4">
      <InfoRekeningInstansiCard />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Total Tabungan Seluruh Anggota</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(totalSaldo)}</p>
        </Card>
        <Card className="border-warning/30 bg-warning-100/40 dark:bg-warning/10">
          <div className="flex items-center gap-1.5 text-warning">
            <Wallet className="h-4 w-4" />
            <p className="text-sm">Total Kas (setelah pengeluaran)</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-warning">
            {loadingKas ? '—' : formatCurrency(totalKas)}
          </p>
          <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
            Total tabungan dikurangi pengeluaran operasional
          </p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Total Target Seluruh Anggota</p>
          <p className="mt-1 text-2xl font-bold text-ink dark:text-ink-dark">{formatCurrency(totalTarget)}</p>
        </Card>
      </div>

      {/* Info Sistem Fleksibel Tanpa Batas Waktu & Penanganan Keterlambatan */}
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/60 dark:bg-emerald-950/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink dark:text-ink-dark">
              Sistem Tabungan Fleksibel (Bulanan / Mingguan Tanpa Batas Waktu Hangus)
            </h3>
            <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-muted-dark">
              Setiap jamaah dapat memilih siklus setoran <strong>Bulanan</strong> atau <strong>Mingguan</strong> serta menentukan <strong>Lama Tabungan</strong> sesuai kemampuan (misal 10, 12, 24, atau 30 bulan). Target qurban ditentukan di masing-masing <strong>Kelompok</strong> dan dapat disesuaikan per 1 anggota melalui tombol <strong>Atur Skema</strong>.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <CardTitle>Rekening &amp; Skema Tabungan Anggota</CardTitle>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
                Target tabungan 1 anggota dapat disesuaikan manual atau mengikuti target kelompoknya.
              </p>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Kelompok */}
                {kelompokOptions.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-2.5 py-1 text-xs font-medium">
                    <Filter className="h-3.5 w-3.5 text-ink-muted" />
                    <select
                      value={kelompokFilter}
                      onChange={(e) => setKelompokFilter(e.target.value)}
                      className="bg-transparent text-ink dark:text-ink-dark focus:outline-none cursor-pointer"
                    >
                      <option value="semua">Semua Kelompok ({data?.length || 0})</option>
                      {kelompokOptions.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tombol Sinkronisasi Cepat */}
                <button
                  type="button"
                  onClick={handleSyncAllWithKelompok}
                  disabled={isSyncingAll}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Sesuaikan target seluruh anggota agar otomatis mengikuti target kelompok masing-masing"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{isSyncingAll ? 'Menyesuaikan...' : 'Sesuaikan Target dari Kelompok'}</span>
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !filteredData?.length ? (
          <EmptyState icon={Coins} title="Belum ada rekening tabungan pada filter ini" />
        ) : (
          <TabunganTable
            data={filteredData}
            isAdmin={isAdmin}
            currentAnggotaId={anggotaSaya?.id}
            rekeningInstansi={instansiSaya}
            onEditPlan={openEdit}
          />
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Atur Skema & Lama Tabungan — ${editing?.anggota?.nama ?? 'Anggota'}`}
        size="md"
      >
        <form onSubmit={handleSaveTarget} className="space-y-4">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Apabila jamaah terlambat atau ingin meringankan setoran rutin, Anda dapat mengubah siklus ke <strong>Mingguan</strong> atau memperpanjang <strong>Lama Tabungan</strong> (contoh: <strong>10, 12, atau 24 Bulan</strong>).
            </span>
          </div>

          {/* Kartu Target Kelompok Anggota */}
          {kelompokInfo && (
            <div className="rounded-2xl border border-indigo-500/25 bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Kelompok: {kelompokInfo.nama_kelompok} ({kelompokInfo.jenis_qurban === 'kambing' ? 'Kambing 1/1' : 'Sapi 1/7'})
                </span>
                <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                  Target Kelompok: {formatCurrency(kelompokInfo.target_dana)}
                </span>
              </div>

              {targetPerAnggotaKelompok && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-indigo-200/70 dark:border-indigo-800/40 pt-2">
                  <span className="text-ink-muted dark:text-ink-muted-dark">
                    Target Standar per 1 Anggota ({kelompokInfo.maksimal_anggota || 7} orang):{' '}
                    <strong className="text-ink dark:text-ink-dark">{formatCurrency(targetPerAnggotaKelompok)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setTarget(String(targetPerAnggotaKelompok))}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Pasang Target Kelompok ({formatCurrency(targetPerAnggotaKelompok)})
                  </button>
                </div>
              )}
            </div>
          )}

          <Input
            label="Target Tabungan Qurban 1 Anggota Ini (Rp)"
            type="number"
            min={0}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={!isAdmin}
            required
          />

          {/* Opsi Terapkan ke Seluruh Anggota di Kelompok Ini */}
          {kelompokInfo && isAdmin && (
            <div
              onClick={() => setApplyToAllInKelompok(!applyToAllInKelompok)}
              className="rounded-xl border border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 flex items-center gap-2 text-xs text-ink dark:text-ink-dark cursor-pointer select-none"
            >
              {applyToAllInKelompok ? (
                <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <Square className="h-4 w-4 text-ink-muted shrink-0" />
              )}
              <span>
                Terapkan target <strong>{formatCurrency(Number(target) || 0)}</strong> ini ke seluruh anggota di{' '}
                <strong>{kelompokInfo.nama_kelompok}</strong>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Pilihan Siklus Setoran"
              value={periodeSetoran}
              onChange={(e) => setPeriodeSetoran(e.target.value)}
              options={[
                { value: 'bulanan', label: 'Setoran Bulanan' },
                { value: 'mingguan', label: 'Setoran Mingguan' },
              ]}
            />

            <Select
              label="Pilihan Lama Tabungan"
              value={customLama ? 'custom' : String(lamaTabungan)}
              onChange={(e) => {
                const val = e.target.value
                if (val === 'custom') {
                  setCustomLama(true)
                } else {
                  setCustomLama(false)
                  setLamaTabungan(val)
                  if (Number(val) === 10) {
                    setBulanMulai(7) // Juli -> 10 bulan
                  } else if (Number(val) === 12) {
                    setBulanMulai(5) // Mei -> 12 bulan
                  }
                }
              }}
              options={[
                ...LAMA_TABUNGAN_PRESETS.map((p) => ({ value: String(p.value), label: p.label })),
                { value: 'custom', label: 'Kustom (Input Bulan Bebas)' },
              ]}
            />
          </div>

          {/* Fitur Pilihan Bulan & Hitung Otomatis Lama Tabungan */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/25 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-ink dark:text-ink-dark flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Pilihan Bulan Mulai Menabung:
              </span>
              <span className="rounded-lg bg-emerald-600/15 px-2.5 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                Otomatis: {lamaTabungan} Bulan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-ink-muted dark:text-ink-muted-dark block mb-1">
                  Mulai Bulan Tabungan:
                </label>
                <select
                  value={bulanMulai}
                  onChange={(e) => handleSelectBulanMulai(e.target.value)}
                  className="h-10 w-full rounded-xl border border-emerald-500/40 bg-white dark:bg-bg-dark px-3 text-xs font-bold text-ink dark:text-ink-dark focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  {DAFTAR_BULAN.map((b) => {
                    const durasi = hitungLamaTabunganDariBulan(b.value, bulanSelesai)
                    return (
                      <option key={b.value} value={b.value}>
                        Bulan {b.label} {b.value === 7 ? '⭐ (Otomatis 10 Bulan - Standar Qurban)' : `(Otomatis ${durasi} Bulan)`}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-muted dark:text-ink-muted-dark block mb-1">
                  Target Pelaksanaan Qurban:
                </label>
                <select
                  value={bulanSelesai}
                  onChange={(e) => {
                    const end = Number(e.target.value)
                    setBulanSelesai(end)
                    const calculatedLama = hitungLamaTabunganDariBulan(bulanMulai, end)
                    setLamaTabungan(String(calculatedLama))
                  }}
                  className="h-10 w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3 text-xs font-medium text-ink dark:text-ink-dark focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value={4}>Bulan April (Sebelum Hari Raya Mei)</option>
                  <option value={5}>Bulan Mei (Bulan Hari Raya Qurban)</option>
                  <option value={6}>Bulan Juni</option>
                </select>
              </div>
            </div>

            {/* Rincian Nama-Nama Bulan yang Dicakup */}
            <div className="pt-0.5 border-t border-emerald-500/20">
              <div className="text-[11px] text-ink-muted dark:text-ink-muted-dark mb-1.5 flex items-center justify-between">
                <span>Rincian {lamaTabungan} Bulan Setoran:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {DAFTAR_BULAN.find((b) => b.value === Number(bulanMulai))?.label} ➔ {DAFTAR_BULAN.find((b) => b.value === Number(bulanSelesai))?.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {getDaftarBulanRentang(bulanMulai, lamaTabungan).map((bln, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-white dark:bg-bg-dark px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs"
                  >
                    <span className="text-ink-muted dark:text-ink-muted-dark font-normal">#{idx + 1}</span>
                    <span>{bln}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {customLama && (
            <Input
              label="Masukkan Lama Tabungan (Bulan)"
              type="number"
              min={1}
              max={120}
              value={lamaTabungan}
              onChange={(e) => setLamaTabungan(e.target.value)}
              placeholder="Contoh: 10 atau 30"
              required
            />
          )}

          {/* Ringkasan Simulasi */}
          <div className="rounded-2xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-ink-muted dark:text-ink-muted-dark">
              <span>Sisa Target Tabungan:</span>
              <span className="font-bold text-ink dark:text-ink-dark">
                {formatCurrency(simulasiModal.sisaTarget)}
              </span>
            </div>
            <div className="flex items-center justify-between text-ink-muted dark:text-ink-muted-dark">
              <span>Durasi Rencana Tabungan:</span>
              <span className="font-bold text-ink dark:text-ink-dark">
                {simulasiModal.lamaBulan} Bulan ({simulasiModal.totalPeriode}x {simulasiModal.labelPeriode})
              </span>
            </div>
            <div className="border-t border-border dark:border-border-dark pt-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <Calculator className="h-4 w-4" />
                Estimasi Setoran per {simulasiModal.labelPeriode}:
              </span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(simulasiModal.nominalPerPeriode)} / {simulasiModal.labelPeriode}
              </span>
            </div>
          </div>

          {/* Penanganan Keterlambatan */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/25 p-4 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-amber-900 dark:text-amber-300">
                Simulasi Penanganan Jika Jamaah Telat Bayar:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-ink-muted dark:text-ink-muted-dark">Jumlah Telat:</span>
                <select
                  value={bulanTelat}
                  onChange={(e) => setBulanTelat(Number(e.target.value))}
                  className="rounded-lg border border-amber-500/40 bg-white dark:bg-bg-dark px-2 py-1 text-xs font-bold text-ink dark:text-ink-dark"
                >
                  {[1, 2, 3, 4, 5, 6].map((m) => (
                    <option key={m} value={m}>
                      Telat {m} Bulan
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-ink-muted dark:text-ink-muted-dark">
              <p>
                • <strong>Nominal Tertunda ({bulanTelat} bln):</strong>{' '}
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {formatCurrency(simulasiModal.nominalBulanan * bulanTelat)}
                </span>
              </p>
              <p>
                • <strong>Opsi A (Perpanjang Tenor +{bulanTelat} Bulan):</strong> Lama tabungan ditambah menjadi{' '}
                <strong>{simulasiModal.lamaBulan + bulanTelat} Bulan</strong> agar cicilan tetap ringan.
              </p>
              <p>
                • <strong>Opsi B (Bagi Rata ke Sisa Bulan):</strong> Sisa target dibagi ke sisa{' '}
                <strong>{Math.max(1, simulasiModal.lamaBulan - bulanTelat)} Bulan</strong> ={' '}
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(
                    Math.ceil(simulasiModal.sisaTarget / Math.max(1, simulasiModal.lamaBulan - bulanTelat)),
                  )}{' '}
                  / bulan
                </strong>
                .
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const nextLama = simulasiModal.lamaBulan + bulanTelat
                  setCustomLama(!LAMA_TABUNGAN_PRESETS.some((p) => p.value === nextLama))
                  setLamaTabungan(String(nextLama))
                }}
                className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors cursor-pointer"
              >
                Terapkan Perpanjang +{bulanTelat} Bulan (Jadi {simulasiModal.lamaBulan + bulanTelat} Bulan)
              </button>
              {periodeSetoran === 'bulanan' && (
                <button
                  type="button"
                  onClick={() => setPeriodeSetoran('mingguan')}
                  className="rounded-xl border border-emerald-600/30 bg-white dark:bg-bg-dark px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 cursor-pointer"
                >
                  Ubah ke Cicilan Mingguan ({formatCurrency(simulasiModal.nominalMingguan)}/mgg)
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button type="submit" loading={updateTarget.isPending}>
              Simpan Rencana Tabungan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
