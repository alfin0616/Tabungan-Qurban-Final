import { useState, useMemo } from 'react'
import { Coins, Wallet, CalendarClock, Calculator, CheckCircle2, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
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
} from '../../utils/formatCurrency'
import { sendDirectWhatsAppReminder } from '../../utils/whatsappReminder'

export default function TabunganListPage() {
  const { isAdmin, anggotaSaya, instansiSaya } = useAuth()
  const { data, isLoading } = useTabunganList()
  const { data: totalKas, isLoading: loadingKas } = useTotalKasMasjid()
  const updateTarget = useUpdateTargetTabungan()

  const [editing, setEditing] = useState(null)
  const [target, setTarget] = useState('')
  const [periodeSetoran, setPeriodeSetoran] = useState('bulanan')
  const [lamaTabungan, setLamaTabungan] = useState('12')
  const [customLama, setCustomLama] = useState(false)
  const [bulanTelat, setBulanTelat] = useState(2)

  const totalSaldo = (data ?? []).reduce((sum, t) => sum + Number(t.saldo || 0), 0)
  const totalTarget = (data ?? []).reduce((sum, t) => sum + Number(t.target || 0), 0)

  function openEdit(item) {
    const initLama = Number(item.lama_tabungan || item.anggota?.lama_tabungan || 12)
    const isPreset = LAMA_TABUNGAN_PRESETS.some((p) => p.value === initLama)
    setEditing(item)
    setTarget(String(item.target ?? 3000000))
    setPeriodeSetoran(item.periode_setoran || item.anggota?.periode_setoran || 'bulanan')
    setLamaTabungan(String(initLama))
    setCustomLama(!isPreset)
  }

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
      await updateTarget.mutateAsync({
        id: editing.id,
        target: Number(target),
        anggota_id: editing.anggota_id || editing.anggota?.id,
        periode_setoran: periodeSetoran,
        lama_tabungan: Math.max(1, Number(lamaTabungan) || 12),
      })
      toast.success('Skema, lama tabungan, dan target berhasil diperbarui')
      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui rencana tabungan')
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
              Setiap jamaah dapat memilih siklus setoran <strong>Bulanan</strong> atau <strong>Mingguan</strong> serta menentukan <strong>Lama Tabungan</strong> sesuai kemampuan (misal 12, 24, atau 30 bulan). Jika jamaah terlambat menyetor, saldo tidak pernah hangus dan lama tabungan dapat disesuaikan kapan saja melalui tombol <strong>Atur Skema</strong>.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rekening &amp; Skema Tabungan Anggota</CardTitle>
        </CardHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !data?.length ? (
          <EmptyState icon={Coins} title="Belum ada rekening tabungan" />
        ) : (
          <TabunganTable
            data={data}
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
              Apabila jamaah terlambat atau ingin meringankan setoran rutin, Anda dapat mengubah siklus ke <strong>Mingguan</strong> atau memperpanjang <strong>Lama Tabungan</strong> (contoh: <strong>30 Bulan</strong>).
            </span>
          </div>

          <Input
            label="Target Tabungan Qurban (Rp)"
            type="number"
            min={0}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={!isAdmin}
            required
          />

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
                }
              }}
              options={[
                ...LAMA_TABUNGAN_PRESETS.map((p) => ({ value: String(p.value), label: p.label })),
                { value: 'custom', label: 'Kustom (Input Bulan Bebas)' },
              ]}
            />
          </div>

          {customLama && (
            <Input
              label="Masukkan Lama Tabungan (Bulan)"
              type="number"
              min={1}
              max={120}
              value={lamaTabungan}
              onChange={(e) => setLamaTabungan(e.target.value)}
              placeholder="Contoh: 30"
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

          {/* Simulasi & Aksi Cepat Penanganan Jamaah Telat Bayar (Misal Telat 2 Bulan) */}
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
                className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
              >
                Terapkan Perpanjang +{bulanTelat} Bulan (Jadi {simulasiModal.lamaBulan + bulanTelat} Bulan)
              </button>
              {periodeSetoran === 'bulanan' && (
                <button
                  type="button"
                  onClick={() => setPeriodeSetoran('mingguan')}
                  className="rounded-xl border border-emerald-600/30 bg-white dark:bg-bg-dark px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50"
                >
                  Ubah ke Cicilan Mingguan ({formatCurrency(simulasiModal.nominalMingguan)}/mgg)
                </button>
              )}
              {isAdmin && editing?.anggota && (
                <button
                  type="button"
                  onClick={() =>
                    sendDirectWhatsAppReminder({
                      anggotaId: editing.anggota?.id || editing.anggota_id,
                      noHp: editing.anggota?.no_hp,
                      nama: editing.anggota?.nama,
                      kodeAnggota: editing.anggota?.kode_anggota,
                      namaInstansi: instansiSaya?.nama_instansi,
                      periode: periodeSetoran,
                      lamaBulan: Number(lamaTabungan) || 12,
                      saldo: editing.saldo,
                      target: Number(target) || 3000000,
                      bulanTelat,
                      rekeningInstansi: instansiSaya,
                      jenisPesan: 'telat',
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Kirim Pengingat Telat {bulanTelat} Bulan ke WA
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
