import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, UserCheck, Building2, Users, Shield, User, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../api/supabaseClient'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import logoSiqurban from '../../assets/siqurban-logo-v4.png'

export default function ClaimAkunPage() {
  const { logout, setActiveJamaahGroup, setActiveAdminInstansi, user } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('jamaah')
  const [instansiList, setInstansiList] = useState([])
  const [kelompokList, setKelompokList] = useState([])
  const [loadingInstansi, setLoadingInstansi] = useState(true)
  const [loadingKelompok, setLoadingKelompok] = useState(false)

  const [selectedInstansiId, setSelectedInstansiId] = useState('')
  const [selectedKelompokId, setSelectedKelompokId] = useState('')
  const [kodeInstansi, setKodeInstansi] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadInstansi() {
      setLoadingInstansi(true)
      try {
        const { data, error } = await supabase.rpc('get_public_instansi_list')
        if (!error && data) {
          setInstansiList(data)
        } else {
          const { data: rawData } = await supabase
            .from('instansi')
            .select('id, nama_instansi, alamat')
            .eq('status', true)
            .order('nama_instansi')
          setInstansiList(rawData || [])
        }
      } catch (err) {
        console.warn('Gagal memuat instansi:', err)
      } finally {
        setLoadingInstansi(false)
      }
    }
    loadInstansi()
  }, [])

  useEffect(() => {
    async function loadKelompok() {
      if (!selectedInstansiId) {
        setKelompokList([])
        setSelectedKelompokId('')
        return
      }
      setLoadingKelompok(true)
      try {
        const { data, error } = await supabase.rpc('get_public_kelompok_list', {
          p_instansi_id: selectedInstansiId,
        })
        if (!error && data) {
          setKelompokList(data)
        } else {
          const { data: rawData } = await supabase
            .from('kelompok')
            .select('id, nama_kelompok, jenis_qurban, target_dana')
            .eq('instansi_id', selectedInstansiId)
            .eq('status', true)
            .order('nama_kelompok')
          setKelompokList(rawData || [])
        }
      } catch (err) {
        console.warn('Gagal memuat kelompok:', err)
      } finally {
        setLoadingKelompok(false)
      }
    }
    loadKelompok()
  }, [selectedInstansiId])

  async function onSubmitJamaah(e) {
    e.preventDefault()
    if (!selectedInstansiId) {
      toast.error('Wajib memilih Masjid / Instansi Qurban Anda.')
      return
    }
    if (!selectedKelompokId) {
      toast.error('Wajib memilih Kelompok Qurban Anda.')
      return
    }
    setSubmitting(true)
    try {
      await setActiveJamaahGroup(selectedInstansiId, selectedKelompokId)
      toast.success('Akun berhasil dihubungkan ke Kelompok Qurban Anda!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Gagal menghubungkan akun ke kelompok')
    } finally {
      setSubmitting(false)
    }
  }

  async function onSubmitInstansi(e) {
    e.preventDefault()
    if (!selectedInstansiId) {
      toast.error('Wajib memilih Masjid / Instansi.')
      return
    }
    if (!kodeInstansi.trim()) {
      toast.error('Wajib mencantumkan Kode Instansi resmi dari Super Admin.')
      return
    }
    setSubmitting(true)
    try {
      await setActiveAdminInstansi(selectedInstansiId, kodeInstansi.trim())
      toast.success('Kode Instansi terverifikasi! Selamat datang di Panel Admin Instansi.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Kode Instansi tidak valid atau gagal memverifikasi.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await logout()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg dark:bg-bg-dark px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img src={logoSiqurban} alt="SIQURBAN" className="h-14 w-14 rounded-full object-cover shadow-md" />
          <p className="text-sm font-medium text-ink dark:text-ink-dark">{user?.email}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lengkapi Pengaturan Akun</CardTitle>
          </CardHeader>

          {/* Toggle Peran: Jamaah (Pilih Kelompok) vs Admin Instansi (Wajib Kode Instansi) */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 p-1.5 border border-emerald-600/20">
            <button
              type="button"
              onClick={() => setMode('jamaah')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === 'jamaah'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <User className="h-4 w-4" />
              Anggota / Jamaah
            </button>
            <button
              type="button"
              onClick={() => setMode('instansi')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === 'instansi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin Instansi
            </button>
          </div>

          {mode === 'jamaah' ? (
            <form onSubmit={onSubmitJamaah} className="space-y-4">
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                Setiap anggota baru wajib memilih <strong>Masjid / Instansi</strong> dan <strong>Kelompok Qurban</strong> tempat menabung.
              </p>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Pilih Masjid / Instansi Qurban <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedInstansiId}
                  onChange={(e) => setSelectedInstansiId(e.target.value)}
                  disabled={loadingInstansi}
                  className="block w-full rounded-xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark px-3.5 py-2.5 text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">
                    {loadingInstansi ? '-- Memuat daftar masjid... --' : '-- Pilih Masjid / Instansi --'}
                  </option>
                  {instansiList.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.nama_instansi} {ins.alamat ? `— (${ins.alamat})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1.5 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Pilih Kelompok Qurban <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedKelompokId}
                  onChange={(e) => setSelectedKelompokId(e.target.value)}
                  disabled={!selectedInstansiId || loadingKelompok}
                  className="block w-full rounded-xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark px-3.5 py-2.5 text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedInstansiId
                      ? '-- Pilih Masjid terlebih dahulu --'
                      : loadingKelompok
                        ? '-- Memuat kelompok... --'
                        : '-- Pilih Kelompok Qurban --'}
                  </option>
                  {kelompokList.map((klp) => (
                    <option key={klp.id} value={klp.id}>
                      {klp.nama_kelompok} — ({klp.jenis_qurban === 'sapi' ? 'Sapi 1/7' : 'Kambing 1/1'})
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full" loading={submitting}>
                <UserCheck className="h-4 w-4" /> Gabung ke Kelompok Qurban
              </Button>
            </form>
          ) : (
            <form onSubmit={onSubmitInstansi} className="space-y-4">
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                Pendaftaran Admin Instansi tidak dibuka untuk umum. Anda wajib memasukkan <strong>Kode Instansi</strong> resmi yang diberikan oleh Super Admin.
              </p>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Pilih Masjid / Instansi <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedInstansiId}
                  onChange={(e) => setSelectedInstansiId(e.target.value)}
                  disabled={loadingInstansi}
                  className="block w-full rounded-xl border border-border dark:border-border-dark bg-bg dark:bg-bg-dark px-3.5 py-2.5 text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Pilih Masjid / Instansi --</option>
                  {instansiList.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.nama_instansi} {ins.alamat ? `— (${ins.alamat})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Kode Instansi Resmi (Wajib)"
                icon={KeyRound}
                required
                placeholder="Contoh: INS-0001 atau QURBAN-XXXXXX"
                value={kodeInstansi}
                onChange={(e) => setKodeInstansi(e.target.value)}
              />

              <Button type="submit" className="w-full" loading={submitting}>
                <Shield className="h-4 w-4" /> Verifikasi Kode & Masuk Panel Instansi
              </Button>
            </form>
          )}
        </Card>

        <button
          onClick={handleLogout}
          className="mx-auto mt-4 flex items-center gap-1.5 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-danger"
        >
          <LogOut className="h-4 w-4" /> Keluar dan masuk dengan akun lain
        </button>
      </div>
    </div>
  )
}
