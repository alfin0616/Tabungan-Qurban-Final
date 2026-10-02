import React, { useState } from 'react'
import { Plus, Search, Building2, CheckCircle2, XCircle, Trash2, Edit2 } from 'lucide-react'
import { useInstansiList, useCreateInstansi, useUpdateInstansi, useDeleteInstansi } from '../../hooks/useInstansi'
import Modal from '../../components/modal/Modal'
import ConfirmModal from '../../components/modal/ConfirmModal'
import InstansiForm from '../../components/forms/InstansiForm'
import toast from 'react-hot-toast'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { useDebounce } from 'use-debounce'

export default function InstansiListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch] = useDebounce(searchTerm, 500)
  const [page, setPage] = useState(1)
  
  const { data, isLoading } = useInstansiList({ search: debouncedSearch, page })
  
  const createInstansi = useCreateInstansi()
  const updateInstansi = useUpdateInstansi()
  const deleteInstansi = useDeleteInstansi()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingData, setEditingData] = useState(null)
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const handleOpenForm = (instansi = null) => {
    setEditingData(instansi)
    setIsModalOpen(true)
  }

  const handleCloseForm = () => {
    setIsModalOpen(false)
    setEditingData(null)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingData) {
        await updateInstansi.mutateAsync({ id: editingData.id, ...formData })
        toast.success('Instansi berhasil diupdate')
      } else {
        await createInstansi.mutateAsync(formData)
        toast.success('Instansi baru berhasil ditambahkan')
      }
      handleCloseForm()
    } catch (error) {
      toast.error(error.message || 'Terjadi kesalahan')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteInstansi.mutateAsync(deletingId)
      toast.success('Instansi berhasil dihapus')
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus instansi')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink dark:text-white flex items-center gap-3">
            <Building2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Manajemen Instansi
          </h1>
          <p className="text-ink-muted dark:text-ink-muted-dark mt-1">
            Kelola daftar masjid, yayasan, atau institusi yang tergabung dalam sistem.
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Tambah Instansi
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark border border-emerald-100 dark:border-emerald-800/30 rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-emerald-100 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <input
              type="text"
              placeholder="Cari nama atau kode instansi..."
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
                <th className="p-4 font-semibold">Instansi</th>
                <th className="p-4 font-semibold">Tahun Aktif</th>
                <th className="p-4 font-semibold">Kontak</th>
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
                      icon={Building2}
                      title="Belum ada data Instansi"
                      description="Tambahkan instansi atau masjid pertama Anda sekarang."
                      actionLabel="Tambah Instansi"
                      onAction={() => handleOpenForm()}
                    />
                  </td>
                </tr>
              ) : (
                data?.data?.map((instansi) => (
                  <tr
                    key={instansi.id}
                    className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-ink dark:text-white">{instansi.nama_instansi}</div>
                      <div className="text-xs text-ink-muted dark:text-ink-muted-dark font-mono mt-0.5">
                        {instansi.kode_instansi}
                      </div>
                      {instansi.kode_registrasi && (
                        <div className="mt-1 flex items-center gap-1 text-xs">
                          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded font-mono select-all" title="Berikan kode ini ke admin masjid untuk mendaftar">
                            {instansi.kode_registrasi}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-ink-muted dark:text-ink-muted-dark">
                      {instansi.tahun_qurban_aktif}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-ink-muted dark:text-ink-muted-dark">{instansi.telepon || '-'}</div>
                      <div className="text-xs text-ink-muted dark:text-ink-muted-dark">{instansi.email || '-'}</div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => updateInstansi.mutate({ id: instansi.id, status: !instansi.status })}
                        disabled={updateInstansi.isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${instansi.status ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/50' : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50'} ${updateInstansi.isPending ? 'opacity-50 cursor-wait' : ''}`}
                        title="Klik untuk ubah status"
                      >
                        {instansi.status ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {instansi.status ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenForm(instansi)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(instansi.id)
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
        title={editingData ? 'Edit Instansi' : 'Tambah Instansi Baru'}
      >
        <InstansiForm
          initialData={editingData}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isSubmitting={createInstansi.isPending || updateInstansi.isPending}
        />
      </Modal>

      <ConfirmModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Instansi"
        description="Apakah Anda yakin ingin menghapus instansi ini? Semua data kelompok dan anggota di dalamnya akan terpengaruh. Aksi ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        loading={deleteInstansi.isPending}
      />
    </div>
  )
}
