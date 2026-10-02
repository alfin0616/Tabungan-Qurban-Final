import { useMemo, useState } from 'react'
import { History, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRiwayatTransaksi, useDeleteTransaksi } from '../../hooks/useTransaksi'
import { useAnggotaSelect } from '../../hooks/useAnggota'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import RiwayatTable from '../../components/tables/RiwayatTable'
import Modal from '../../components/modal/Modal'
import ConfirmModal from '../../components/modal/ConfirmModal'
import Badge from '../../components/ui/Badge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, formatDateTime } from '../../utils/formatDate'

export default function RiwayatPage() {
  const { isAdmin } = useAuth()
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalAkhir, setTanggalAkhir] = useState('')
  const [anggotaId, setAnggotaId] = useState('')
  const [jenis, setJenis] = useState('semua')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filters = useMemo(
    () => ({ tanggalMulai, tanggalAkhir, anggotaId: anggotaId || undefined, jenis }),
    [tanggalMulai, tanggalAkhir, anggotaId, jenis],
  )
  const { data, isLoading } = useRiwayatTransaksi(filters)
  const { data: anggotaList } = useAnggotaSelect()
  const deleteMutation = useDeleteTransaksi()

  const filteredData = useMemo(() => {
    if (!search) return data ?? []
    const q = search.toLowerCase()
    return (data ?? []).filter(
      (t) => t.anggota?.nama?.toLowerCase().includes(q) || t.anggota?.kode_anggota?.toLowerCase().includes(q),
    )
  }, [data, search])

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success('Transaksi berhasil dihapus dan saldo disesuaikan')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus transaksi')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input label="Tanggal Mulai" type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
          <Input label="Tanggal Akhir" type="date" value={tanggalAkhir} onChange={(e) => setTanggalAkhir(e.target.value)} />
          <Select
            label="Anggota"
            value={anggotaId}
            onChange={(e) => setAnggotaId(e.target.value)}
            placeholder="Semua anggota"
            options={(anggotaList ?? []).map((a) => ({ value: a.id, label: a.nama }))}
          />
          <Select
            label="Jenis"
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
            options={[
              { value: 'semua', label: 'Semua Jenis' },
              { value: 'setoran', label: 'Setoran' },
              { value: 'penarikan', label: 'Penarikan' },
            ]}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink dark:text-ink-dark">Cari</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nama anggota..."
                className="h-10 w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-9 pr-3 text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-muted-dark/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !filteredData.length ? (
          <EmptyState icon={History} title="Tidak ada transaksi" description="Coba ubah filter pencarian Anda." />
        ) : (
          <RiwayatTable data={filteredData} onDetail={setDetail} onDelete={setDeleting} isAdmin={isAdmin} />
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Transaksi" size="sm">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted dark:text-ink-muted-dark">Tanggal</span>
              <span className="font-medium text-ink dark:text-ink-dark">{formatDate(detail.tanggal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted dark:text-ink-muted-dark">Anggota</span>
              <span className="font-medium text-ink dark:text-ink-dark">
                {detail.anggota?.nama} ({detail.anggota?.kode_anggota})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted dark:text-ink-muted-dark">Jenis</span>
              <Badge tone={detail.jenis === 'setoran' ? 'emerald' : 'danger'}>
                {detail.jenis === 'setoran' ? 'Setoran' : 'Penarikan'}
              </Badge>
            </div>
            {detail.metode_pembayaran && (
              <div className="flex justify-between">
                <span className="text-ink-muted dark:text-ink-muted-dark">Metode</span>
                <span className="font-medium text-ink dark:text-ink-dark uppercase">{detail.metode_pembayaran}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-muted dark:text-ink-muted-dark">Nominal</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(detail.nominal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted dark:text-ink-muted-dark">Keterangan</span>
              <span className="font-medium text-ink dark:text-ink-dark">{detail.keterangan || '-'}</span>
            </div>
            <div className="flex justify-between border-t border-border dark:border-border-dark pt-3">
              <span className="text-ink-muted dark:text-ink-muted-dark">Dicatat pada</span>
              <span className="text-xs text-ink-muted dark:text-ink-muted-dark">{formatDateTime(detail.created_at)}</span>
            </div>
            {detail.bukti && (
              <div className="border-t border-border dark:border-border-dark pt-3">
                <p className="mb-2 text-ink-muted dark:text-ink-muted-dark">Bukti Foto</p>
                <a href={detail.bukti} target="_blank" rel="noreferrer">
                  <img
                    src={detail.bukti}
                    alt="Bukti transaksi"
                    className="max-h-56 w-full rounded-xl border border-border dark:border-border-dark object-cover"
                  />
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus Transaksi"
        description="Menghapus transaksi ini akan menyesuaikan kembali saldo tabungan anggota terkait. Lanjutkan?"
        confirmLabel="Ya, Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
