import { useState, useRef } from 'react'
import {
  HardDrive,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { backupToExcel, backupToJson, backupTableToCsv } from '../../repositories/backupRepository'
import { restoreFromExcel, restoreFromJson } from '../../repositories/restoreRepository'
import { auditRepository } from '../../repositories/auditRepository'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const CSV_TABLES = [
  { name: 'anggota', label: 'Anggota' },
  { name: 'tabungan', label: 'Tabungan' },
  { name: 'transaksi', label: 'Transaksi' },
  { name: 'pengeluaran', label: 'Pengeluaran' },
  { name: 'kelompok', label: 'Kelompok' },
  { name: 'pengaturan', label: 'Pengaturan' },
]

export default function BackupPage() {
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingJson, setLoadingJson] = useState(false)
  const [loadingCsv, setLoadingCsv] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreResult, setRestoreResult] = useState(null)
  const fileInputRef = useRef(null)

  async function handleBackupExcel() {
    setLoadingExcel(true)
    try {
      await backupToExcel()
      toast.success('Backup Excel berhasil diunduh!')
      auditRepository.log('BACKUP_EXCEL', 'Backup seluruh data ke Excel')
    } catch (err) {
      toast.error(err.message || 'Gagal membuat backup Excel')
    } finally {
      setLoadingExcel(false)
    }
  }

  async function handleBackupJson() {
    setLoadingJson(true)
    try {
      await backupToJson()
      toast.success('Backup JSON berhasil diunduh!')
      auditRepository.log('BACKUP_JSON', 'Backup seluruh data ke JSON')
    } catch (err) {
      toast.error(err.message || 'Gagal membuat backup JSON')
    } finally {
      setLoadingJson(false)
    }
  }

  async function handleBackupCsv(tableName) {
    setLoadingCsv(tableName)
    try {
      await backupTableToCsv(tableName)
      toast.success(`CSV ${tableName} berhasil diunduh!`)
      auditRepository.log('BACKUP_CSV', `Export tabel ${tableName} ke CSV`)
    } catch (err) {
      toast.error(err.message || `Gagal export CSV ${tableName}`)
    } finally {
      setLoadingCsv(null)
    }
  }

  async function handleRestore(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setRestoring(true)
    setRestoreResult(null)

    try {
      let result
      if (file.name.endsWith('.json')) {
        result = await restoreFromJson(file)
      } else if (file.name.endsWith('.xlsx')) {
        result = await restoreFromExcel(file)
      } else {
        throw new Error('Format file tidak didukung. Gunakan file .xlsx atau .json')
      }

      setRestoreResult(result)
      auditRepository.log('RESTORE', `Restore dari file ${file.name}`)

      if (result.errors.length) {
        toast.error(`Restore selesai dengan ${result.errors.length} error`)
      } else {
        toast.success('Restore berhasil!')
      }
    } catch (err) {
      toast.error(err.message || 'Gagal melakukan restore')
    } finally {
      setRestoring(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <HardDrive className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Backup & Recovery</h1>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
            Unduh backup atau pulihkan data dari file backup.
          </p>
        </div>
      </div>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-600" />
            Backup Data
          </CardTitle>
        </CardHeader>

        <div className="space-y-4 p-5 pt-0">
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
            Unduh seluruh data instansi Anda ke dalam satu file. Backup bisa digunakan untuk restore jika terjadi kehilangan data.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleBackupExcel}
              disabled={loadingExcel}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-border-dark dark:bg-surface-dark dark:hover:border-emerald-700 dark:hover:bg-emerald-900/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink dark:text-ink-dark">
                  {loadingExcel ? 'Mengunduh...' : 'Backup Excel (.xlsx)'}
                </p>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  Semua tabel dalam satu file multi-sheet
                </p>
              </div>
              {loadingExcel && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
            </button>

            <button
              onClick={handleBackupJson}
              disabled={loadingJson}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-border-dark dark:bg-surface-dark dark:hover:border-blue-700 dark:hover:bg-blue-900/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileJson className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink dark:text-ink-dark">
                  {loadingJson ? 'Mengunduh...' : 'Backup JSON (.json)'}
                </p>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  Format universal, bisa dibaca program lain
                </p>
              </div>
              {loadingJson && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
            </button>
          </div>

          {/* CSV per tabel */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
                Export CSV per Tabel
              </p>
              <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark">
                ✓ Kompatibel Microsoft Excel (Indonesia)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CSV_TABLES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleBackupCsv(t.name)}
                  disabled={loadingCsv === t.name}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-slate-400 hover:text-ink dark:border-border-dark dark:bg-surface-dark dark:hover:border-slate-600 dark:hover:text-ink-dark"
                >
                  {loadingCsv === t.name ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Restore Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-amber-600" />
            Restore Data
          </CardTitle>
        </CardHeader>

        <div className="space-y-4 p-5 pt-0">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
            <p className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Perhatian:</strong> Restore akan menambahkan/memperbarui data yang ada.
                Data existing yang tidak ada di file backup <strong>tidak akan dihapus</strong>.
                Pastikan Anda menggunakan file backup dari SIQURBAN.
              </span>
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.json"
              onChange={handleRestore}
              className="hidden"
              id="restore-file"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
            >
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sedang memproses...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Pilih File Backup (.xlsx / .json)
                </>
              )}
            </Button>
          </div>

          {/* Restore Result */}
          {restoreResult && (
            <div className="space-y-2 rounded-xl border border-border bg-slate-50 p-4 dark:border-border-dark dark:bg-slate-800/50">
              {restoreResult.restored.length > 0 && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Berhasil di-restore:
                  </p>
                  <ul className="ml-6 list-disc text-xs text-ink-muted dark:text-ink-muted-dark">
                    {restoreResult.restored.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {restoreResult.skipped.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-500">Dilewati (kosong):</p>
                  <p className="ml-6 text-xs text-ink-muted dark:text-ink-muted-dark">
                    {restoreResult.skipped.join(', ')}
                  </p>
                </div>
              )}
              {restoreResult.errors.length > 0 && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" /> Error:
                  </p>
                  <ul className="ml-6 list-disc text-xs text-red-500 dark:text-red-400">
                    {restoreResult.errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Info Backup & Automation Scheduler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Otomatisasi Sistem & Scheduler (Supabase Automation)
          </CardTitle>
        </CardHeader>
        <div className="p-5 pt-0 space-y-4">
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
            Sistem SIQURBAN dilengkapi dengan fitur otomatisasi terjadwal (*Task Scheduler & Auto Backup Trigger*) untuk pembersihan log tua, pengiriman pengingat bulanan, dan snapshot database.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={async () => {
                try {
                  const { automationRepository } = await import('../../repositories/automationRepository')
                  const res = await automationRepository.runScheduledTasks()
                  toast.success('Master Scheduler Otomatis berhasil dijalankan!')
                } catch (err) {
                  toast.error(err.message)
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              Jalankan Master Scheduler
            </button>

            <button
              onClick={async () => {
                try {
                  const { automationRepository } = await import('../../repositories/automationRepository')
                  const res = await automationRepository.triggerMonthlyReminders()
                  toast.success(`Pengingat setoran bulanan dikirim (${res.reminders_sent || 0} notifikasi)`)
                } catch (err) {
                  toast.error(err.message)
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              Trigger Reminder Bulanan
            </button>

            <button
              onClick={async () => {
                try {
                  const { automationRepository } = await import('../../repositories/automationRepository')
                  const res = await automationRepository.cleanupOldLogs(0)
                  toast.success(`Seluruh log error/sistem berhasil dibersihkan (${res.deleted_system_logs || 0} log dihapus)`)
                } catch (err) {
                  toast.error(err.message)
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
            >
              <HardDrive className="h-4 w-4" />
              Hapus Semua Log Error (Reset)
            </button>

            <button
              onClick={async () => {
                try {
                  const { automationRepository } = await import('../../repositories/automationRepository')
                  const res = await automationRepository.cleanupOldLogs(30)
                  toast.success(`Log tua (>30 hari) dibersihkan (${res.deleted_system_logs || 0} log dihapus)`)
                } catch (err) {
                  toast.error(err.message)
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-sm"
            >
              <HardDrive className="h-4 w-4" />
              Pembersihan Log (&gt;30 Hari)
            </button>
          </div>

          <p className="mt-2 text-xs text-ink-muted dark:text-ink-muted-dark">
            💡 Tip: Master scheduler secara otomatis berjalan setiap hari (00:00 UTC) melalui Supabase Cron `pg_cron` untuk menjamin kesehatan performa database.
          </p>
        </div>
      </Card>
    </div>
  )
}
