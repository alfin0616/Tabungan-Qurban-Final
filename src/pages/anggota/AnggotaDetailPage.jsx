import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Wallet, Target, Phone, MapPin, Calendar } from 'lucide-react'
import { useAnggotaDetail } from '../../hooks/useAnggota'
import { useTabunganByAnggota } from '../../hooks/useTabungan'
import { useRiwayatTransaksi } from '../../hooks/useTransaksi'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function AnggotaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: anggota, isLoading: loadingAnggota } = useAnggotaDetail(id)
  const { data: tabungan, isLoading: loadingTabungan } = useTabunganByAnggota(id)
  const { data: riwayat, isLoading: loadingRiwayat } = useRiwayatTransaksi({ anggotaId: id })

  if (loadingAnggota) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!anggota) {
    return <EmptyState title="Anggota tidak ditemukan" />
  }

  const persentase =
    tabungan?.target > 0 ? Math.min(100, Math.round((tabungan.saldo / tabungan.target) * 100)) : 0

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/anggota')}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-emerald-600"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar anggota
      </button>

      <Card>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar src={anggota.foto} name={anggota.nama} size={72} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-ink dark:text-ink-dark">{anggota.nama}</h2>
              <Badge tone={anggota.status ? 'emerald' : 'danger'}>
                {anggota.status ? 'Aktif' : 'Tidak Aktif'}
              </Badge>
            </div>
            <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{anggota.kode_anggota}</p>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-ink-muted dark:text-ink-muted-dark sm:grid-cols-3">
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> {anggota.no_hp}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {anggota.alamat}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Bergabung {formatDate(anggota.tanggal_bergabung)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Saldo Tabungan</p>
              <p className="text-xl font-bold text-ink dark:text-ink-dark">
                {loadingTabungan ? '—' : formatCurrency(tabungan?.saldo)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-100 text-warning dark:bg-warning/10">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Target Qurban</p>
              <p className="text-xl font-bold text-ink dark:text-ink-dark">
                {loadingTabungan ? '—' : `${formatCurrency(tabungan?.target)} (${persentase}%)`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        {loadingRiwayat ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : !riwayat?.length ? (
          <EmptyState title="Belum ada transaksi" description="Riwayat setoran dan penarikan akan tampil di sini." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
                  <th className="py-2 pr-4">Tanggal</th>
                  <th className="py-2 pr-4">Jenis</th>
                  <th className="py-2 pr-4">Nominal</th>
                  <th className="py-2 pr-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border-dark">
                {riwayat.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 pr-4 text-ink-muted dark:text-ink-muted-dark">{formatDate(t.tanggal)}</td>
                    <td className="py-2 pr-4">
                      <Badge tone={t.jenis === 'setoran' ? 'emerald' : 'danger'}>
                        {t.jenis === 'setoran' ? 'Setoran' : 'Penarikan'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 font-medium text-ink dark:text-ink-dark">
                      {formatCurrency(t.nominal)}
                    </td>
                    <td className="py-2 pr-4 text-ink-muted dark:text-ink-muted-dark">{t.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Link
        to="/transaksi/setoran"
        state={{ anggotaId: anggota.id }}
        className="inline-block text-sm font-medium text-emerald-600 hover:underline"
      >
        + Catat setoran untuk anggota ini
      </Link>
    </div>
  )
}
