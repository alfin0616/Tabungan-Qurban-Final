import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Copy, Check, Building2, Users, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function InfoRekeningInstansiCard({ instansiProp = null }) {
  const { instansiSaya, anggotaSaya, isSuperAdmin, isAdminInstansi, isJamaah } = useAuth()
  const [copied, setCopied] = useState(false)

  const instansi = instansiProp || instansiSaya || anggotaSaya?.instansi
  if (isSuperAdmin && !instansiProp) return null
  if (!instansi) return null

  const nomorRekening = (instansi.nomor_rekening || instansi.rekening || '').trim()
  const namaBank = (instansi.nama_bank || '').trim()
  const atasNama = (instansi.atas_nama_rekening || '').trim()
  const kelompokNama = anggotaSaya?.kelompok?.nama_kelompok

  const handleCopy = async () => {
    if (!nomorRekening) return
    // Ambil hanya digit angka jika user ingin menyalin nomor rekening murni, atau salin teks nomor_rekening
    const cleanNum = instansi.nomor_rekening ? instansi.nomor_rekening.trim() : nomorRekening
    try {
      await navigator.clipboard.writeText(cleanNum)
      setCopied(true)
      toast.success('Nomor rekening berhasil disalin!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin nomor rekening')
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-3.5 sm:p-5 shadow-argon">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
        {/* Info Instansi & Kelompok */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tl from-emerald-800 to-emerald-600 text-white shadow-md shadow-emerald-900/20">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{instansi.nama_instansi}</span>
              </span>
              {isJamaah && kelompokNama && (
                <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 truncate">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Kelompok: {kelompokNama}</span>
                </span>
              )}
            </div>
            <h3 className="mt-1 text-sm sm:text-lg font-bold text-ink dark:text-white leading-snug">
              Nomor Rekening Setoran Tabungan Qurban
            </h3>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark leading-relaxed">
              {isJamaah
                ? 'Gunakan nomor rekening resmi instansi/masjid berikut untuk transfer setoran tabungan qurban Anda.'
                : 'Informasi nomor rekening resmi instansi yang ditampilkan kepada seluruh anggota/jamaah.'}
            </p>
          </div>
        </div>

        {/* Detail Rekening Bank */}
        {nomorRekening ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 px-3.5 py-3 sm:px-4 lg:min-w-[320px] min-w-0">
            <div className="min-w-0">
              {namaBank && (
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 truncate">
                  {namaBank}
                </p>
              )}
              <p className="font-mono text-base sm:text-xl font-extrabold tracking-wide text-ink dark:text-white select-all break-all sm:break-normal">
                {nomorRekening}
              </p>
              {atasNama && (
                <p className="text-xs font-medium text-ink-muted dark:text-ink-muted-dark truncate">
                  a.n. <strong className="text-ink dark:text-white">{atasNama}</strong>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all shrink-0 self-start sm:self-center"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin No. Rek'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
              {isAdminInstansi
                ? 'Nomor rekening instansi belum diatur.'
                : 'Nomor rekening belum dicantumkan oleh pengurus instansi. Silakan hubungi pengurus masjid/instansi Anda.'}
            </p>
            {isAdminInstansi && (
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 text-xs font-semibold shrink-0"
              >
                <Settings className="h-3.5 w-3.5" />
                Atur Rekening
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

