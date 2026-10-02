import { useState } from 'react'
import { Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCreatePenarikan } from '../../hooks/useTransaksi'
import { useAnggotaSelect } from '../../hooks/useAnggota'
import { useSettings } from '../../hooks/useSettings'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PenarikanForm from '../../components/forms/PenarikanForm'
import { cetakBuktiTransaksi } from '../../utils/exportBuktiTransaksi'

export default function PenarikanPage() {
  const createPenarikan = useCreatePenarikan()
  const { data: anggotaList } = useAnggotaSelect()
  const { data: settings } = useSettings()
  const [lastTransaksi, setLastTransaksi] = useState(null)

  async function handleSubmit(values) {
    try {
      await createPenarikan.mutateAsync(values)
      toast.success('Penarikan berhasil dicatat')

      const anggota = (anggotaList ?? []).find((a) => a.id === values.anggota_id)
      setLastTransaksi({ ...values, anggotaNama: anggota?.nama, kodeAnggota: anggota?.kode_anggota })
    } catch (err) {
      toast.error(err.message || 'Gagal mencatat penarikan')
    }
  }

  function handlePrint() {
    if (!lastTransaksi) return
    cetakBuktiTransaksi({
      jenis: 'penarikan',
      anggotaNama: lastTransaksi.anggotaNama,
      kodeAnggota: lastTransaksi.kodeAnggota,
      tanggal: lastTransaksi.tanggal,
      nominal: lastTransaksi.nominal,
      keterangan: lastTransaksi.keterangan,
      namaInstansi: settings?.nama_instansi,
    })
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Penarikan Tabungan Qurban</CardTitle>
        </CardHeader>
        <PenarikanForm onSubmit={handleSubmit} loading={createPenarikan.isPending} />
      </Card>

      {lastTransaksi && (
        <Card className="border-danger/20 bg-danger-100/40 dark:bg-danger/10">
          <p className="mb-3 text-sm text-danger">
            Penarikan terakhir untuk <strong>{lastTransaksi.anggotaNama}</strong> berhasil disimpan.
          </p>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Cetak Bukti Penarikan
          </Button>
        </Card>
      )}
    </div>
  )
}
