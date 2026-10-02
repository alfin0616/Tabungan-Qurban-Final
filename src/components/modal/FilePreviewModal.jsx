import { useState } from 'react'
import { Download, Trash2, FileText, ExternalLink, Calendar, HardDrive, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { formatFileSize, downloadFile } from '../../repositories/fileRepository'
import { formatDate } from '../../utils/formatDate'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico']

export default function FilePreviewModal({ open, onClose, file, onDelete }) {
  const [downloading, setDownloading] = useState(false)

  if (!file) return null

  const ext = file.name.split('.').pop()?.toLowerCase()
  const isImage = IMAGE_EXTENSIONS.includes(ext || '')

  async function handleDownload() {
    try {
      setDownloading(true)
      await downloadFile(file.bucketId, file.path, file.name)
      toast.success('Berkas berhasil diunduh')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Gagal mengunduh berkas')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Detail & Preview Berkas" size="lg">
      <div className="space-y-4">
        {/* Preview Container */}
        <div className="relative flex min-h-[220px] max-h-[380px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-slate-900/95 dark:border-border-dark p-4 shadow-inner">
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[350px] w-auto max-w-full rounded-lg object-contain transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-emerald-400 shadow-md">
                <FileText className="h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-slate-400">Pratinjau gambar tidak tersedia untuk format .{ext}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Berkas */}
        <div className="rounded-xl border border-border bg-emerald-50/40 p-4 dark:border-border-dark dark:bg-surface-dark">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-sm font-bold text-ink dark:text-ink-dark truncate max-w-[300px]">
              {file.name}
            </span>
            <Badge tone="emerald">{file.bucketLabel}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-ink-muted dark:text-ink-muted-dark sm:grid-cols-3">
            <div className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
              <span>Ukuran: <strong className="text-ink dark:text-ink-dark">{formatFileSize(file.size)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>Diunggah: <strong className="text-ink dark:text-ink-dark">{formatDate(file.createdAt)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Bucket: <strong className="text-ink dark:text-ink-dark">{file.bucketId}</strong></span>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-ink-muted dark:text-ink-muted-dark font-mono truncate">
            Path: {file.path}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onClose()
              onDelete(file)
            }}
          >
            <Trash2 className="h-4 w-4" /> Hapus Berkas
          </Button>

          <div className="flex gap-2">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-emerald-50 dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Buka URL
            </a>
            <Button variant="primary" size="sm" onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4" /> {downloading ? 'Mengunduh...' : 'Download'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
