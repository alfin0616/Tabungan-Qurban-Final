import { useState } from 'react'
import { Coins, Target, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTabunganList, useUpdateTargetTabungan } from '../../hooks/useTabungan'
import { useTotalKasMasjid } from '../../hooks/useDashboard'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import TabunganTable from '../../components/tables/TabunganTable'
import Modal from '../../components/modal/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../utils/formatCurrency'

export default function TabunganListPage() {
  const { isAdmin } = useAuth()
  const { data, isLoading } = useTabunganList()
  const { data: totalKas, isLoading: loadingKas } = useTotalKasMasjid()
  const updateTarget = useUpdateTargetTabungan()
  const [editing, setEditing] = useState(null)
  const [target, setTarget] = useState('')

  const totalSaldo = (data ?? []).reduce((sum, t) => sum + Number(t.saldo || 0), 0)
  const totalTarget = (data ?? []).reduce((sum, t) => sum + Number(t.target || 0), 0)

  function openEdit(item) {
    setEditing(item)
    setTarget(String(item.target ?? 0))
  }

  async function handleSaveTarget(e) {
    e.preventDefault()
    try {
      await updateTarget.mutateAsync({ id: editing.id, target: Number(target) })
      toast.success('Target tabungan diperbarui')
      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui target')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Total Tabungan Seluruh Anggota</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(totalSaldo)}</p>
        </Card>
        <Card className="border-warning/30 bg-warning-100/40 dark:bg-warning/10">
          <div className="flex items-center gap-1.5 text-warning">
            <Wallet className="h-4 w-4" />
            <p className="text-sm">Total Kas (setelah pengeluaran)</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-warning">
            {loadingKas ? '—' : formatCurrency(totalKas)}
          </p>
          <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
            Total tabungan dikurangi pengeluaran operasional
          </p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Total Target Seluruh Anggota</p>
          <p className="mt-1 text-2xl font-bold text-ink dark:text-ink-dark">{formatCurrency(totalTarget)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rekening Tabungan Anggota</CardTitle>
        </CardHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : !data?.length ? (
          <EmptyState icon={Coins} title="Belum ada rekening tabungan" />
        ) : (
          <>
            <div className="mb-3 flex justify-end">
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                {isAdmin
                  ? 'Klik baris untuk lihat detail anggota, atau atur target melalui tombol di bawah.'
                  : 'Klik baris untuk lihat detail anggota.'}
              </p>
            </div>
            <TabunganTable data={data} />
            {isAdmin && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.map((t) => (
                  <Button key={t.id} variant="outline" size="sm" onClick={() => openEdit(t)}>
                    <Target className="h-4 w-4" /> Atur Target {t.anggota?.nama}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Atur Target Qurban" size="sm">
        <form onSubmit={handleSaveTarget} className="space-y-4">
          <Input
            label={`Target untuk ${editing?.anggota?.nama ?? ''}`}
            type="number"
            min={0}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button type="submit" loading={updateTarget.isPending}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
