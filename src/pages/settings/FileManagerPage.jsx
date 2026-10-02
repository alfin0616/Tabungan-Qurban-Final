import { useState, useMemo } from 'react'
import {
  FolderOpen,
  LayoutGrid,
  List,
  Search,
  Eye,
  Download,
  Trash2,
  FileText,
  RotateCcw,
  HardDrive,
  Layers,
  Database,
  Image as ImageIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useFiles, useDeleteFile } from '../../hooks/useFiles'
import { BUCKET_CONFIG, formatFileSize, downloadFile } from '../../repositories/fileRepository'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/modal/ConfirmModal'
import FilePreviewModal from '../../components/modal/FilePreviewModal'
import { cn } from '../../lib/cn'
import { formatDate } from '../../utils/formatDate'

const PAGE_SIZE = 18 // Cocok untuk grid 3 kolom maupun list
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico']

export default function FileManagerPage() {
  const [bucketFilter, setBucketFilter] = useState('semua')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [page, setPage] = useState(1)

  // ---- Modal State ----
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState(null)

  // ---- React Query ----
  const { data: files, stats, isLoading, refetch } = useFiles(bucketFilter, search)
  const deleteMutation = useDeleteFile()

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil((files?.length || 0) / PAGE_SIZE))
  const paginatedFiles = useMemo(() => {
    const list = files || []
    const start = (page - 1) * PAGE_SIZE
    return list.slice(start, start + PAGE_SIZE)
  }, [files, page])

  function handlePreview(file) {
    setSelectedFile(file)
    setPreviewOpen(true)
  }

  async function handleDownload(file) {
    try {
      toast.loading('Mengunduh berkas...', { id: 'dl' })
      await downloadFile(file.bucketId, file.path, file.name)
      toast.success('Berkas berhasil diunduh', { id: 'dl' })
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Gagal mengunduh berkas', { id: 'dl' })
    }
  }

  function handleConfirmDelete(file) {
    setFileToDelete(file)
  }

  async function executeDelete() {
    if (!fileToDelete) return
    try {
      await deleteMutation.mutateAsync({
        bucketId: fileToDelete.bucketId,
        path: fileToDelete.path,
      })
      toast.success('Berkas berhasil dihapus dari Supabase Storage')
      setFileToDelete(null)
      if (selectedFile?.id === fileToDelete.id) {
        setPreviewOpen(false)
        setSelectedFile(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Gagal menghapus berkas')
    }
  }

  function isImageFile(name) {
    const ext = name.split('.').pop()?.toLowerCase()
    return IMAGE_EXTENSIONS.includes(ext || '')
  }

  return (
    <div className="space-y-6">
      {/* ======== HEADER & STATS ======== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-ink dark:text-ink-dark sm:text-2xl">
            <FolderOpen className="h-7 w-7 text-emerald-600" />
            File Manager
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-muted-dark">
            Kelola berkas aset instansi, jamaah, dokumen, dan bukti pembayaran di Supabase Storage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="shrink-0"
          >
            <RotateCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 dark:border-emerald-800 dark:from-emerald-900/30 dark:to-emerald-900/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Layers className="h-4 w-4" /> Total Berkas
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-200">
            {stats.totalFiles} <span className="text-sm font-normal">file</span>
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 dark:border-blue-800 dark:from-blue-900/30 dark:to-blue-900/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <HardDrive className="h-4 w-4" /> Ukuran Penyimpanan
          </div>
          <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-200">
            {formatFileSize(stats.totalBytes)}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 dark:border-amber-800 dark:from-amber-900/30 dark:to-amber-900/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Database className="h-4 w-4" /> Storage Bucket
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-200">
            5 <span className="text-sm font-normal">bucket terhubung</span>
          </p>
        </div>
      </div>

      {/* ======== BUCKET TABS (FILTER KATEGORI) ======== */}
      <Card>
        <div className="border-b border-border p-4 dark:border-border-dark">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setBucketFilter('semua')
                setPage(1)
              }}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                bucketFilter === 'semua'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-800/40',
              )}
            >
              Semua File
            </button>

            {BUCKET_CONFIG.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBucketFilter(b.id)
                  setPage(1)
                }}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                  bucketFilter === b.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-800/40',
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* ======== CONTROL BAR (SEARCH + VIEW MODE) ======== */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
            <input
              type="text"
              placeholder="Cari nama atau path berkas..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-10 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">Tampilan:</span>
            <div className="flex rounded-xl border border-border bg-emerald-50/50 p-1 dark:border-border-dark dark:bg-surface-dark">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark',
                )}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ======== CONTENT DISPLAY ======== */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : !paginatedFiles.length ? (
        <Card>
          <div className="p-10">
            <EmptyState
              icon={FolderOpen}
              title="Tidak ada berkas ditemukan"
              description="Belum ada file yang diunggah ke storage atau tidak sesuai filter pencarian."
            />
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ======== GRID VIEW ======== */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
          {paginatedFiles.map((file) => {
            const isImg = isImageFile(file.name)
            return (
              <div
                key={file.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-border-dark dark:bg-surface-dark"
              >
                {/* Thumbnail / Image Preview Area */}
                <div
                  onClick={() => handlePreview(file)}
                  className="relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden bg-slate-900/90 transition-colors group-hover:bg-slate-900"
                >
                  {isImg ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-emerald-400 shadow-md">
                        <FileText className="h-7 w-7" />
                      </div>
                      <span className="text-xs font-semibold uppercase text-slate-400">
                        {file.name.split('.').pop()}
                      </span>
                    </div>
                  )}

                  {/* Overlay badge kategori di sudut kiri atas */}
                  <div className="absolute left-3 top-3">
                    <Badge tone="emerald" className="shadow-sm">
                      {file.bucketLabel}
                    </Badge>
                  </div>

                  {/* Hover icon Pratinjau */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-md">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </span>
                  </div>
                </div>

                {/* Info & Metadata */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3
                      title={file.name}
                      className="truncate font-medium text-sm text-ink dark:text-ink-dark"
                    >
                      {file.name}
                    </h3>
                    <p className="mt-1 flex items-center justify-between text-xs text-ink-muted dark:text-ink-muted-dark">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.createdAt)}</span>
                    </p>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-border pt-3 dark:border-border-dark">
                    <button
                      type="button"
                      onClick={() => handlePreview(file)}
                      title="Preview Berkas"
                      className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-ink-muted-dark dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      title="Download Berkas"
                      className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-ink-muted-dark dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(file)}
                      title="Hapus Berkas"
                      className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ======== LIST VIEW (TABLE) ======== */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-emerald-50/50 text-xs uppercase tracking-wider text-ink-muted dark:border-border-dark dark:bg-emerald-900/10 dark:text-ink-muted-dark">
                  <th className="py-3 pl-5 pr-3 w-16">Pratinjau</th>
                  <th className="py-3 pr-4">Nama Berkas</th>
                  <th className="py-3 pr-4">Kategori Bucket</th>
                  <th className="py-3 pr-4">Ukuran</th>
                  <th className="py-3 pr-4">Tanggal Diunggah</th>
                  <th className="py-3 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border-dark">
                {paginatedFiles.map((file) => {
                  const isImg = isImageFile(file.name)
                  return (
                    <tr
                      key={file.id}
                      className="transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10"
                    >
                      <td className="py-3 pl-5 pr-3">
                        <div
                          onClick={() => handlePreview(file)}
                          className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-800 dark:border-border-dark"
                        >
                          {isImg ? (
                            <img src={file.url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <FileText className="h-5 w-5 text-emerald-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          onClick={() => handlePreview(file)}
                          className="cursor-pointer font-medium text-ink hover:text-emerald-600 hover:underline dark:text-ink-dark dark:hover:text-emerald-400"
                        >
                          {file.name}
                        </span>
                        <div className="text-[11px] text-ink-muted font-mono truncate max-w-[200px] dark:text-ink-muted-dark">
                          {file.path}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone="emerald">{file.bucketLabel}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold text-ink dark:text-ink-dark">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="py-3 pr-4 text-xs text-ink-muted dark:text-ink-muted-dark">
                        {formatDate(file.createdAt)}
                      </td>
                      <td className="py-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handlePreview(file)}
                            title="Preview Berkas"
                            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-ink-muted-dark dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            title="Download Berkas"
                            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-ink-muted-dark dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(file)}
                            title="Hapus Berkas"
                            className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======== PAGINATION ======== */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* ======== MODALS ======== */}
      <FilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={selectedFile}
        onDelete={handleConfirmDelete}
      />

      <ConfirmModal
        open={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={executeDelete}
        title="Hapus Berkas dari Storage?"
        description={`Apakah Anda yakin ingin menghapus "${fileToDelete?.name}" secara permanen? File yang dihapus dari Supabase Storage tidak dapat dikembalikan.`}
        confirmText="Hapus Permanen"
      />
    </div>
  )
}
