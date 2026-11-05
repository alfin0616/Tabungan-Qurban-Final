import React, { useState } from 'react'
import { Plus, Search, Building2, CheckCircle2, XCircle, Trash2, Edit2, Eye } from 'lucide-react'
import { useInstansiList, useCreateInstansi, useUpdateInstansi, useDeleteInstansi } from '../../hooks/useInstansi'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/modal/Modal'
import ConfirmModal from '../../components/modal/ConfirmModal'
import InstansiMonitoringModal from '../../components/modal/InstansiMonitoringModal'
import InstansiForm from '../../components/forms/InstansiForm'
import toast from 'react-hot-toast'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { useDebounce } from 'use-debounce'

export default function InstansiListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch] = useDebounce(searchTerm, 500)
  const [page, setPage] = useState(1)

  const { isSuperAdmin } = useAuth()
  const { data, isLoading } = useInstansiList({ search: debouncedSearch, page })

  const createInstansi = useCreateInstansi()
  const updateInstansi = useUpdateInstansi()
  const deleteInstansi = useDeleteInstansi()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingData, setEditingData] = useState(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [monitoringInstansi, setMonitoringInstansi] = useState(null)

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
      <div className="bg-surface dark:bg-surface-dark border border-border/80 dark:border-border-dark rounded-2xl shadow-argon overflow-hidden">
        {/* Argon Card Header */}
        <div className="p-5 border-b border-border/80 dark:border-border-dark flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tl from-emerald-800 to-emerald-600 text-white shadow-md shadow-emerald-900/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-ink dark:text-white">
                Daftar & Monitoring Instansi Mitra
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-ink-muted-dark">
                Kelola dan pantau langsung seluruh instansi, kelompok qurban, hingga tabungan anggota.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted dark:text-ink-muted-dark" />
              <input
                type="text"
                placeholder="Cari nama atau kode instansi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-border dark:border-border-dark bg-bg dark:bg-bg-dark text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all placeholder:text-ink-muted/70"
              />
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => handleOpenForm()}
                className="argon-lift flex items-center justify-center gap-2 bg-gradient-to-tl from-emerald-800 to-emerald-600 hover:from-emerald-900 hover:to-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Tambah Instansi
              </button>
            )}
          </div>
        </div>

        {/* TAMPILAN MOBILE (< 768px): Card View Responsif Minimalis */}
        <div className="block md:hidden p-3.5 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-ink-muted dark:text-ink-muted-dark">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat data...
            </div>
          ) : data?.data?.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Belum ada data Instansi"
              description="Tambahkan instansi atau masjid pertama Anda sekarang."
              actionLabel="Tambah Instansi"
              onAction={() => handleOpenForm()}
            />
          ) : (
            data?.data?.map((instansi) => (
              <div
                key={instansi.id}
                className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark p-3.5 space-y-2.5 shadow-2xs"
              >
                {/* Header: Nama & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-ink dark:text-white text-sm">
                      {instansi.nama_instansi}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md font-mono font-semibold">
                        Kode: {instansi.kode_instansi}
                      </span>
                      {instansi.kode_registrasi && (
                        <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md font-mono font-semibold">
                          Reg: {instansi.kode_registrasi}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => updateInstansi.mutate({ id: instansi.id, status: !instansi.status })}
                    disabled={updateInstansi.isPending}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      instansi.status
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {instansi.status ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                {/* Rekening & Kontak */}
                <div className="rounded-xl border border-border/70 dark:border-border-dark/70 bg-bg/40 dark:bg-bg-dark/40 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted dark:text-ink-muted-dark">Rekening:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                      {instansi.nama_bank ? `${instansi.nama_bank} • ` : ''}
                      {instansi.nomor_rekening || instansi.rekening || 'Belum diatur'}
                    </span>
                  </div>
                  {instansi.atas_nama_rekening && (
                    <div className="text-[11px] text-ink-muted dark:text-ink-muted-dark text-right">
                      a.n. {instansi.atas_nama_rekening}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-ink-muted dark:text-ink-muted-dark">Tahun Qurban:</span>
                    <span className="font-semibold text-ink dark:text-white">{instansi.tahun_qurban_aktif}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-border/60 dark:border-border-dark/60 text-xs">
                  <button
                    onClick={() => setMonitoringInstansi(instansi)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Monitor Data</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenForm(instansi)}
                      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(instansi.id)
                        setIsDeleteModalOpen(true)
                      }}
                      className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clean Fintech / Argon Table (Desktop >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/80 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark border-b border-border/80 dark:border-border-dark">
                <th className="py-3.5 px-5">Instansi</th>
                <th className="py-3.5 px-4">Rekening Qurban</th>
                <th className="py-3.5 px-4">Tahun Aktif</th>
                <th className="py-3.5 px-4">Kontak</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Monitoring & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 dark:divide-border-dark">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-ink-muted dark:text-ink-muted-dark">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-0">
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
                    className="hover:bg-bg/70 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-ink dark:text-white">{instansi.nama_instansi}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span
                          className="text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md font-mono font-semibold select-all"
                          title="Kode Instansi (Gunakan untuk pendaftaran Admin Instansi)"
                        >
                          Kode: {instansi.kode_instansi}
                        </span>
                        {instansi.kode_registrasi && (
                          <span
                            className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md font-mono font-semibold select-all"
                            title="Kode Registrasi Admin Instansi"
                          >
                            Reg: {instansi.kode_registrasi}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {instansi.nomor_rekening || instansi.rekening ? (
                        <div>
                          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            {instansi.nama_bank ? `${instansi.nama_bank} • ` : ''}
                            <span className="font-mono select-all">
                              {instansi.nomor_rekening || instansi.rekening}
                            </span>
                          </div>
                          {instansi.atas_nama_rekening && (
                            <div className="text-[11px] text-ink-muted dark:text-ink-muted-dark">
                              a.n. {instansi.atas_nama_rekening}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs italic text-ink-muted dark:text-ink-muted-dark">
                          Belum diatur
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm font-medium text-ink dark:text-white">
                      {instansi.tahun_qurban_aktif}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm text-ink dark:text-white">{instansi.telepon || '-'}</div>
                      <div className="text-xs text-ink-muted dark:text-ink-muted-dark">{instansi.email || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => updateInstansi.mutate({ id: instansi.id, status: !instansi.status })}
                        disabled={updateInstansi.isPending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          instansi.status
                            ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 dark:text-rose-400'
                        } ${updateInstansi.isPending ? 'opacity-50 cursor-wait' : ''}`}
                        title="Klik untuk ubah status"
                      >
                        {instansi.status ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {instansi.status ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setMonitoringInstansi(instansi)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:text-emerald-400 transition-all"
                          title="Pantau seluruh Kelompok & Anggota di Instansi ini"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Monitor Kelompok & Anggota</span>
                        </button>
                        <button
                          onClick={() => handleOpenForm(instansi)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(instansi.id)
                            setIsDeleteModalOpen(true)
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
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
          <div className="p-4 border-t border-border/80 dark:border-border-dark flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <InstansiMonitoringModal
        open={!!monitoringInstansi}
        onClose={() => setMonitoringInstansi(null)}
        instansi={monitoringInstansi}
      />

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
