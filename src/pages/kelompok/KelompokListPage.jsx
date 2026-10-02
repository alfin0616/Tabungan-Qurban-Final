import React, { useState } from 'react'
import { Plus, Search, Users, CheckCircle2, XCircle, Trash2, Edit2, Wallet } from 'lucide-react'
import { useKelompokList, useCreateKelompok, useUpdateKelompok, useDeleteKelompok } from '../../hooks/useKelompok'
import Modal from '../../components/modal/Modal'
import ConfirmModal from '../../components/modal/ConfirmModal'
import KelompokForm from '../../components/forms/KelompokForm'
import toast from 'react-hot-toast'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { useDebounce } from 'use-debounce'
import { formatCurrency } from '../../utils/formatCurrency'

export default function KelompokListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch] = useDebounce(searchTerm, 500)
  const [page, setPage] = useState(1)
  
  const { data, isLoading } = useKelompokList({ search: debouncedSearch, page })
  
  const createKelompok = useCreateKelompok()
  const updateKelompok = useUpdateKelompok()
  const deleteKelompok = useDeleteKelompok()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingData, setEditingData] = useState(null)
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const handleOpenForm = (kelompok = null) => {
    setEditingData(kelompok)
    setIsModalOpen(true)
  }

  const handleCloseForm = () => {
    setIsModalOpen(false)
    setEditingData(null)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingData) {
        await updateKelompok.mutateAsync({ id: editingData.id, ...formData })
        toast.success('Kelompok berhasil diupdate')
      } else {
        await createKelompok.mutateAsync(formData)
        toast.success('Kelompok baru berhasil ditambahkan')
      }
      handleCloseForm()
    } catch (error) {
      toast.error(error.message || 'Terjadi kesalahan')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteKelompok.mutateAsync(deletingId)
      toast.success('Kelompok berhasil dihapus')
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus kelompok')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Manajemen Kelompok
          </h1>
          <p className="text-ink-muted dark:text-ink-muted-dark mt-1">
            Kelola grup qurban sapi dan kambing beserta target dananya.
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Tambah Kelompok
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark border border-emerald-100 dark:border-emerald-800/30 rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-emerald-100 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <input
              type="text"
              placeholder="Cari nama kelompok atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/30 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 border-b border-emerald-100 dark:border-emerald-800/30">
                <th className="p-4 font-semibold">Kelompok</th>
                <th className="p-4 font-semibold">Instansi</th>
                <th className="p-4 font-semibold">Target Dana</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 dark:divide-emerald-800/20">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-ink-muted dark:text-ink-muted-dark">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-0">
                    <EmptyState
                      icon={Users}
                      title="Belum ada data Kelompok"
                      description="Buat grup patungan sapi atau qurban kambing pertama Anda."
                      actionLabel="Tambah Kelompok"
                      onAction={() => handleOpenForm()}
                    />
                  </td>
                </tr>
              ) : (
                data?.data?.map((kelompok) => (
                  <tr
                    key={kelompok.id}
                    className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-ink dark:text-white flex items-center gap-2">
                        {kelompok.nama_kelompok}
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${kelompok.jenis_qurban === 'sapi' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                          {kelompok.jenis_qurban}
                        </span>
                      </div>
                      <div className="text-xs text-ink-muted dark:text-ink-muted-dark font-mono mt-0.5">
                        {kelompok.kode_kelompok} • Kapasitas: {kelompok.maksimal_anggota} Orang
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        {kelompok.instansi?.nama_instansi || '-'}
                      </div>
                      <div className="text-xs text-ink-muted dark:text-ink-muted-dark">Tahun: {kelompok.tahun}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-ink dark:text-white flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                        {formatCurrency(kelompok.target_dana)}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => updateKelompok.mutate({ id: kelompok.id, status: !kelompok.status })}
                        disabled={updateKelompok.isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${kelompok.status ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/50' : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50'} ${updateKelompok.isPending ? 'opacity-50 cursor-wait' : ''}`}
                        title="Klik untuk ubah status"
                      >
                        {kelompok.status ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {kelompok.status ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenForm(kelompok)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(kelompok.id)
                            setIsDeleteModalOpen(true)
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.totalPages > 1 && (
          <div className="p-4 border-t border-emerald-100 dark:border-emerald-800/30 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={handleCloseForm}
        title={editingData ? 'Edit Kelompok' : 'Tambah Kelompok Baru'}
      >
        <KelompokForm
          initialData={editingData}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isSubmitting={createKelompok.isPending || updateKelompok.isPending}
        />
      </Modal>

      <ConfirmModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Kelompok"
        description="Apakah Anda yakin ingin menghapus kelompok ini? Data anggota yang terhubung ke kelompok ini mungkin akan terpengaruh. Aksi ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        loading={deleteKelompok.isPending}
      />
    </div>
  )
}
