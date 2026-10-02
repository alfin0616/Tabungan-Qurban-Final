import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCreateSetoran } from '../../hooks/useTransaksi'
import { useAnggotaSelect } from '../../hooks/useAnggota'
import { useSettings } from '../../hooks/useSettings'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SetoranForm from '../../components/forms/SetoranForm'
import { cetakBuktiTransaksi } from '../../utils/exportBuktiTransaksi'

export default function SetoranPage() {
  const location = useLocation()
  const defaultAnggotaId = location.state?.anggotaId

  const createSetoran = useCreateSetoran()
  const { data: anggotaList } = useAnggotaSelect()
  const { data: settings } = useSettings()
  const [lastTransaksi, setLastTransaksi] = useState(null)

  async function handleSubmit(values) {
    try {
      await createSetoran.mutateAsync(values)
      toast.success('Setoran berhasil dicatat')

      const anggota = (anggotaList ?? []).find((a) => a.id === values.anggota_id)
      setLastTransaksi({ ...values, anggotaNama: anggota?.nama, kodeAnggota: anggota?.kode_anggota })
    } catch (err) {
      toast.error(err.message || 'Gagal mencatat setoran')
    }
  }

  function handlePrint() {
    if (!lastTransaksi) return
    cetakBuktiTransaksi({
      jenis: 'setoran',
      anggotaNama: lastTransaksi.anggotaNama,
      kodeAnggota: lastTransaksi.kodeAnggota,
      tanggal: lastTransaksi.tanggal,
      nominal: lastTransaksi.nominal,
      metodePembayaran: lastTransaksi.metode_pembayaran,
      keterangan: lastTransaksi.keterangan,
      namaInstansi: settings?.nama_instansi,
    })
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Setoran Tabungan Qurban</CardTitle>
        </CardHeader>
        <SetoranForm
          key={defaultAnggotaId ?? 'no-default'}
          onSubmit={handleSubmit}
          defaultAnggotaId={defaultAnggotaId}
          loading={createSetoran.isPending}
        />
      </Card>

      {lastTransaksi && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-500/10">
          <p className="mb-3 text-sm text-emerald-700 dark:text-emerald-300">
            Setoran terakhir untuk <strong>{lastTransaksi.anggotaNama}</strong> berhasil disimpan.
          </p>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Cetak Bukti Setoran
          </Button>
        </Card>
      )}
    </div>
  )
}
