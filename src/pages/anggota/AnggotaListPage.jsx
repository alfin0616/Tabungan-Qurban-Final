import { useMemo, useRef, useState } from 'react'
import { Plus, Search, Upload, Download, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useAnggotaList,
  useCreateAnggota,
  useUpdateAnggota,
  useDeleteAnggota,
  useImportAnggota,
} from '../../hooks/useAnggota'
import { exportAnggotaToExcel } from '../../repositories/anggotaRepository'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/modal/Modal'
import ConfirmModal from '../../components/modal/ConfirmModal'
import AnggotaTable from '../../components/tables/AnggotaTable'
import AnggotaForm from '../../components/forms/AnggotaForm'

export default function AnggotaListPage() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('semua')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const fileInputRef = useRef(null)

  const filters = useMemo(() => ({ search, status, page, pageSize: 10 }), [search, status, page])
  const { data, isLoading, isFetching } = useAnggotaList(filters)

  const createMutation = useCreateAnggota()
  const updateMutation = useUpdateAnggota()
  const deleteMutation = useDeleteAnggota()
  const importMutation = useImportAnggota()

  async function handleSubmit(values) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: values })
        toast.success('Data anggota diperbarui')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Anggota baru berhasil ditambahkan')
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data anggota')
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success('Anggota berhasil dihapus')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus anggota')
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importMutation.mutateAsync(file)
      toast.success(`${imported.length} anggota berhasil diimpor`)
    } catch (err) {
      toast.error(err.message || 'Gagal mengimpor file')
    } finally {
      e.target.value = ''
    }
  }

  async function handleExport() {
    try {
      await exportAnggotaToExcel(data?.data ?? [])
    } catch {
      toast.error('Gagal mengekspor data')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Data Anggota</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Import Excel
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export Excel
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setModalOpen(true)
                }}
              >
                <Plus className="h-4 w-4" /> Tambah Anggota
              </Button>
            )}
          </div>
        </CardHeader>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Cari nama, kode anggota, atau no HP..."
              className="h-10 w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-9 pr-3 text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted/60 dark:placeholder:text-ink-muted-dark/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="sm:w-48"
            options={[
              { value: 'semua', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'tidak_aktif', label: 'Tidak Aktif' },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !data?.data?.length ? (
          <EmptyState
            icon={Users}
            title="Belum ada data anggota"
            description="Tambahkan anggota baru atau impor dari file Excel."
          />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
              <AnggotaTable
                data={data.data}
                isAdmin={isAdmin}
                onEdit={(a) => {
                  setEditing(a)
                  setModalOpen(true)
                }}
                onDelete={setDeleting}
                onToggleStatus={async (a) => {
                  try {
                    await updateMutation.mutateAsync({ id: a.id, status: !a.status })
                    toast.success('Status anggota diperbarui')
                  } catch (error) {
                    toast.error('Gagal memperbarui status')
                  }
                }}
              />
            </div>
            <div className="mt-4">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalItems={data.count}
                pageSize={data.pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit Anggota' : 'Tambah Anggota'}
        size="lg"
      >
        <AnggotaForm
          key={editing?.id ?? 'new'}
          anggotaId={editing?.id}
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          submitLabel={editing ? 'Simpan Perubahan' : 'Tambah Anggota'}
        />
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus Anggota"
        description={`Yakin ingin menghapus ${deleting?.nama}? Data tabungan dan riwayat transaksi terkait akan ikut terhapus.`}
        confirmLabel="Ya, Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
