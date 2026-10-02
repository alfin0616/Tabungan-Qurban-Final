import { useMemo, useState } from 'react'
import { Plus, Search, Download, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  usePengeluaranList,
  useCreatePengeluaran,
  useUpdatePengeluaran,
  useDeletePengeluaran,
} from '../../hooks/usePengeluaran'
import { exportPengeluaranToExcel } from '../../repositories/pengeluaranRepository'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/modal/Modal'
import ConfirmModal from '../../components/modal/ConfirmModal'
import PengeluaranTable from '../../components/tables/PengeluaranTable'
import PengeluaranForm from '../../components/forms/PengeluaranForm'
import { KATEGORI_OPTIONS } from '../../repositories/pengeluaranRepository'
import { formatCurrency } from '../../utils/formatCurrency'

export default function PengeluaranListPage() {
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalAkhir, setTanggalAkhir] = useState('')
  const [kategori, setKategori] = useState('semua')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filters = useMemo(
    () => ({ tanggalMulai, tanggalAkhir, kategori, search }),
    [tanggalMulai, tanggalAkhir, kategori, search],
  )
  const { data, isLoading } = usePengeluaranList(filters)

  const createMutation = useCreatePengeluaran()
  const updateMutation = useUpdatePengeluaran()
  const deleteMutation = useDeletePengeluaran()

  const totalPengeluaran = (data ?? []).reduce((sum, p) => sum + Number(p.nominal || 0), 0)

  async function handleSubmit(values) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: values })
        toast.success('Pengeluaran berhasil diperbarui')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Pengeluaran berhasil dicatat')
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengeluaran')
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success('Pengeluaran berhasil dihapus')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus pengeluaran')
    }
  }

  async function handleExport() {
    if (!data?.length) return toast.error('Tidak ada data untuk diekspor')
    await exportPengeluaranToExcel(data)
  }

  return (
    <div className="space-y-4">
      <Card className="border-danger/20 bg-danger-100/30 dark:bg-danger/10">
        <p className="text-sm text-danger">Total Pengeluaran (sesuai filter)</p>
        <p className="mt-1 text-2xl font-bold text-danger">{formatCurrency(totalPengeluaran)}</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran Operasional</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export Excel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Tambah Pengeluaran
            </Button>
          </div>
        </CardHeader>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Tanggal Mulai" type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
          <Input label="Tanggal Akhir" type="date" value={tanggalAkhir} onChange={(e) => setTanggalAkhir(e.target.value)} />
          <Select
            label="Kategori"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            options={[{ value: 'semua', label: 'Semua Kategori' }, ...KATEGORI_OPTIONS]}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink dark:text-ink-dark">Cari Keterangan</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari keterangan..."
                className="h-10 w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-9 pr-3 text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-muted-dark/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !data?.length ? (
          <EmptyState
            icon={Wallet}
            title="Belum ada pengeluaran tercatat"
            description="Catat pengeluaran operasional masjid seperti listrik, air, ATK, dll."
          />
        ) : (
          <PengeluaranTable
            data={data}
            onEdit={(p) => {
              setEditing(p)
              setModalOpen(true)
            }}
            onDelete={setDeleting}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
        size="md"
      >
        <PengeluaranForm
          key={editing?.id ?? 'new'}
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          submitLabel={editing ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}
        />
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus Pengeluaran"
        description="Yakin ingin menghapus catatan pengeluaran ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
