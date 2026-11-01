import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Wallet,
  Eye,
  ExternalLink,
  Building2,
} from 'lucide-react'
import { useKelompokList, useCreateKelompok, useUpdateKelompok, useDeleteKelompok } from '../../hooks/useKelompok'
import { useInstansiSelect } from '../../hooks/useInstansi'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/modal/Modal'
import ConfirmModal from '../../components/modal/ConfirmModal'
import KelompokForm from '../../components/forms/KelompokForm'
import toast from 'react-hot-toast'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { useDebounce } from 'use-debounce'
import { formatCurrency } from '../../utils/formatCurrency'

function getAnggotaSaldo(anggota) {
  const raw = anggota?.tabungan
  if (Array.isArray(raw)) return Number(raw[0]?.saldo || 0)
  if (raw && typeof raw === 'object') return Number(raw.saldo || 0)
  return 0
}

export default function KelompokListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialInstansi = searchParams.get('instansi_id') || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch] = useDebounce(searchTerm, 500)
  const [instansiFilter, setInstansiFilter] = useState(initialInstansi)
  const [page, setPage] = useState(1)

  const { isSuperAdmin } = useAuth()
  const { data: instansiOptions } = useInstansiSelect()

  useEffect(() => {
    const paramInstansi = searchParams.get('instansi_id') || ''
    if (paramInstansi !== instansiFilter) {
      setInstansiFilter(paramInstansi)
    }
  }, [searchParams])

  const { data, isLoading } = useKelompokList({
    search: debouncedSearch,
    instansi_id: instansiFilter || null,
    page,
  })

  const createKelompok = useCreateKelompok()
  const updateKelompok = useUpdateKelompok()
  const deleteKelompok = useDeleteKelompok()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingData, setEditingData] = useState(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [viewingKelompok, setViewingKelompok] = useState(null)

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

  const handleInstansiChange = (val) => {
    setInstansiFilter(val)
    setPage(1)
    if (val) {
      setSearchParams({ instansi_id: val })
    } else {
      setSearchParams({})
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-surface dark:bg-surface-dark border border-border/80 dark:border-border-dark rounded-2xl shadow-argon overflow-hidden">
        {/* Argon Card Header */}
        <div className="p-5 border-b border-border/80 dark:border-border-dark flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tl from-emerald-800 to-emerald-600 text-white shadow-md shadow-emerald-900/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-ink dark:text-white">
                Daftar & Monitoring Kelompok Qurban
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-ink-muted-dark">
                Kelola dan pantau grup qurban sapi/kambing, anggota, serta progres dananya.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            {isSuperAdmin && (
              <div className="relative min-w-[200px]">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                <select
                  value={instansiFilter}
                  onChange={(e) => handleInstansiChange(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-sm border border-border dark:border-border-dark bg-bg dark:bg-bg-dark text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="">Semua Instansi</option>
                  {(instansiOptions || []).map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nama_instansi} ({inst.kode_instansi})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted dark:text-ink-muted-dark" />
              <input
                type="text"
                placeholder="Cari nama kelompok atau kode..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-border dark:border-border-dark bg-bg dark:bg-bg-dark text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all placeholder:text-ink-muted/70"
              />
            </div>

            <button
              onClick={() => handleOpenForm()}
              className="argon-lift flex items-center justify-center gap-2 bg-gradient-to-tl from-emerald-800 to-emerald-600 hover:from-emerald-900 hover:to-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Tambah Kelompok
            </button>
          </div>
        </div>

        {/* Clean Fintech / Argon Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/80 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark border-b border-border/80 dark:border-border-dark">
                <th className="py-3.5 px-5">Kelompok</th>
                <th className="py-3.5 px-4">Instansi</th>
                <th className="py-3.5 px-4">Anggota</th>
                <th className="py-3.5 px-4">Progres & Target Dana</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
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
                      icon={Users}
                      title="Belum ada data Kelompok"
                      description="Buat grup patungan sapi atau qurban kambing pertama Anda."
                      actionLabel="Tambah Kelompok"
                      onAction={() => handleOpenForm()}
                    />
                  </td>
                </tr>
              ) : (
                data?.data?.map((kelompok) => {
                  const members = Array.isArray(kelompok.anggota) ? kelompok.anggota : []
                  const totalTerkumpul = members.reduce((sum, m) => sum + getAnggotaSaldo(m), 0)
                  const targetDana = Number(kelompok.target_dana || 0)
                  const pct =
                    targetDana > 0
                      ? Math.min(100, Math.round((totalTerkumpul / targetDana) * 100))
                      : 0

                  return (
                    <tr
                      key={kelompok.id}
                      className="hover:bg-bg/70 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-ink dark:text-white flex items-center gap-2">
                          {kelompok.nama_kelompok}
                          <span
                            className={`text-xs uppercase font-bold px-2 py-0.5 rounded-lg ${
                              kelompok.jenis_qurban === 'sapi'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {kelompok.jenis_qurban}
                          </span>
                        </div>
                        <div className="text-xs text-ink-muted dark:text-ink-muted-dark font-mono mt-0.5">
                          {kelompok.kode_kelompok}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          {kelompok.instansi?.nama_instansi || '-'}
                        </div>
                        <div className="text-xs text-ink-muted dark:text-ink-muted-dark">
                          Tahun: {kelompok.tahun}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setViewingKelompok(kelompok)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 transition-colors"
                          title="Klik untuk melihat daftar anggota kelompok ini"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {members.length} / {kelompok.maksimal_anggota} Orang
                          </span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-bold text-ink dark:text-white flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-emerald-500" />
                          {formatCurrency(totalTerkumpul)}
                          <span className="text-xs font-normal text-ink-muted">
                            / {formatCurrency(targetDana)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() =>
                            updateKelompok.mutate({ id: kelompok.id, status: !kelompok.status })
                          }
                          disabled={updateKelompok.isPending}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            kelompok.status
                              ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 dark:text-rose-400'
                          } ${updateKelompok.isPending ? 'opacity-50 cursor-wait' : ''}`}
                          title="Klik untuk ubah status"
                        >
                          {kelompok.status ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {kelompok.status ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingKelompok(kelompok)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:text-emerald-400 transition-colors"
                            title="Lihat Anggota Kelompok"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Anggota</span>
                          </button>
                          <button
                            onClick={() => handleOpenForm(kelompok)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(kelompok.id)
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
                  )
                })
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

      {/* Modal Detail Anggota dalam Kelompok */}
      <Modal
        open={!!viewingKelompok}
        onClose={() => setViewingKelompok(null)}
        title={`Anggota Kelompok: ${viewingKelompok?.nama_kelompok || ''}`}
        size="lg"
      >
        {viewingKelompok && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-bg/80 dark:bg-slate-800/60 p-3.5 border border-border dark:border-border-dark">
              <div>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  Instansi: <strong className="text-ink dark:text-white">{viewingKelompok.instansi?.nama_instansi || '-'}</strong> • Kode: <span className="font-mono">{viewingKelompok.kode_kelompok}</span>
                </p>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
                  Kapasitas: <strong>{(viewingKelompok.anggota || []).length} / {viewingKelompok.maksimal_anggota} Orang</strong> • Target Kelompok: <strong>{formatCurrency(viewingKelompok.target_dana)}</strong>
                </p>
              </div>
              <Link
                to={`/anggota?kelompok_id=${viewingKelompok.id}`}
                onClick={() => setViewingKelompok(null)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors self-start sm:self-center"
              >
                <Users className="w-3.5 h-3.5" />
                Buka di Halaman Anggota
              </Link>
            </div>

            <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-border dark:border-border-dark">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-ink-muted border-b border-border dark:border-border-dark">
                  <tr>
                    <th className="py-2.5 px-3.5">Nama Anggota</th>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">No. HP</th>
                    <th className="py-2.5 px-3">Saldo Tabungan</th>
                    <th className="py-2.5 px-3.5 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 dark:divide-border-dark">
                  {!(viewingKelompok.anggota || []).length ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-ink-muted">
                        Belum ada anggota yang terdaftar di kelompok ini.
                      </td>
                    </tr>
                  ) : (
                    viewingKelompok.anggota.map((m) => (
                      <tr key={m.id} className="hover:bg-bg/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3.5 font-semibold text-ink dark:text-white">
                          {m.nama}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-ink-muted">{m.kode_anggota}</td>
                        <td className="py-2.5 px-3 text-ink-muted">{m.no_hp || '-'}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(getAnggotaSaldo(m))}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <Link
                            to={`/anggota/${m.id}`}
                            onClick={() => setViewingKelompok(null)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                          >
                            Lihat <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

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
