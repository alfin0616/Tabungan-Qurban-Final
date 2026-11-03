import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Phone,
  Mail,
  Lock,
  Building2,
  Users,
  ShieldCheck,
  CalendarClock,
  Calculator,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { registerJamaahSchema } from '../../validations/authValidation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../api/supabaseClient'
import {
  formatCurrency,
  calculateSkemaTabungan,
  LAMA_TABUNGAN_PRESETS,
  DAFTAR_BULAN,
  hitungLamaTabunganDariBulan,
  getDaftarBulanRentang,
} from '../../utils/formatCurrency'
import { Calendar } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function RegisterForm() {
  const { registerJamaah } = useAuth()
  const navigate = useNavigate()

  const [instansiList, setInstansiList] = useState([])
  const [kelompokList, setKelompokList] = useState([])
  const [loadingInstansi, setLoadingInstansi] = useState(true)
  const [loadingKelompok, setLoadingKelompok] = useState(false)
  const [customLama, setCustomLama] = useState(false)
  const [bulanMulai, setBulanMulai] = useState(7)
  const [bulanSelesai, setBulanSelesai] = useState(4)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerJamaahSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      instansiId: '',
      kelompokId: '',
      periodeSetoran: 'bulanan',
      lamaTabungan: 12,
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const selectedInstansiId = watch('instansiId')
  const selectedKelompokId = watch('kelompokId')
  const periodeSetoran = watch('periodeSetoran')
  const lamaTabungan = watch('lamaTabungan')

  useEffect(() => {
    fetchInstansiList()
  }, [])

  useEffect(() => {
    if (selectedInstansiId) {
      fetchKelompokList(selectedInstansiId)
    } else {
      setKelompokList([])
      setValue('kelompokId', '')
    }
  }, [selectedInstansiId, setValue])

  async function fetchInstansiList() {
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
      console.warn('Gagal muat daftar masjid:', err)
    } finally {
      setLoadingInstansi(false)
    }
  }

  async function fetchKelompokList(instansiId) {
    setLoadingKelompok(true)
    try {
      const { data, error } = await supabase.rpc('get_public_kelompok_list', {
        p_instansi_id: instansiId,
      })
      if (!error && data) {
        setKelompokList(data)
      } else {
        const { data: rawData } = await supabase
          .from('kelompok')
          .select('id, nama_kelompok, jenis_qurban, target_dana')
          .eq('instansi_id', instansiId)
          .eq('status', true)
          .order('nama_kelompok')
        setKelompokList(rawData || [])
      }
    } catch (err) {
      console.warn('Gagal muat daftar kelompok:', err)
    } finally {
      setLoadingKelompok(false)
    }
  }

  const targetPerAnggota = useMemo(() => {
    const klp = kelompokList.find((k) => k.id === selectedKelompokId)
    if (!klp) return 3000000
    const total = Number(klp.target_dana || 21000000)
    const kuota = klp.jenis_qurban === 'kambing' ? 1 : 7
    return kuota > 1 && total >= 7000000 ? Math.ceil(total / kuota) : total
  }, [kelompokList, selectedKelompokId])

  const simulasi = useMemo(
    () =>
      calculateSkemaTabungan({
        target: targetPerAnggota,
        saldo: 0,
        periode: periodeSetoran,
        lamaBulan: lamaTabungan,
      }),
    [targetPerAnggota, periodeSetoran, lamaTabungan],
  )

  async function onSubmit(values) {
    try {
      await registerJamaah({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        password: values.password,
        instansiId: values.instansiId,
        kelompokId: values.kelompokId,
        periodeSetoran: values.periodeSetoran,
        lamaTabungan: Number(values.lamaTabungan) || 12,
      })
      toast.success('Pendaftaran Jamaah Berhasil! Anda terhubung ke Masjid & Kelompok Qurban.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Gagal mendaftarkan akun. Nomor telepon atau email mungkin sudah terdaftar.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Tabungan Fleksibel Tanpa Batas Waktu:</span> Pilih kelompok qurban, siklus setoran (bulanan/mingguan), serta lama tabungan sesuai kemampuan Anda (misal 12 s.d. 30 bulan).
        </div>
      </div>

      <Input
        label="Nama Lengkap"
        type="text"
        icon={User}
        placeholder="Contoh: Ahmad Zaki"
        required
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <Input
        label="Nomor Telepon / WhatsApp (Wajib)"
        type="tel"
        icon={Phone}
        placeholder="Contoh: 081234567890"
        required
        error={errors.phone?.message}
        {...register('phone')}
      />

      {/* DROPDOWN MASJID / INSTANSI */}
      <div>
        <label className="block text-sm font-semibold text-ink dark:text-ink-dark mb-1.5 flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-emerald-600" />
          Pilih Masjid / Instansi Qurban <span className="text-red-500">*</span>
        </label>
        <select
          {...register('instansiId')}
          disabled={loadingInstansi}
          className="h-11 block w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3.5 text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
        >
          <option value="">
            {loadingInstansi ? '-- Memuat daftar masjid... --' : '-- Pilih Masjid / Instansi Anda --'}
          </option>
          {instansiList.map((ins) => (
            <option key={ins.id} value={ins.id}>
              {ins.nama_instansi} {ins.alamat ? `— (${ins.alamat})` : ''}
            </option>
          ))}
        </select>
        {errors.instansiId && (
          <p className="mt-1 text-xs font-medium text-red-500">{errors.instansiId.message}</p>
        )}
      </div>

      {/* DROPDOWN KELOMPOK */}
      <div>
        <label className="block text-sm font-semibold text-ink dark:text-ink-dark mb-1.5 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-emerald-600" />
          Pilih Kelompok Qurban <span className="text-red-500">*</span>
        </label>
        <select
          {...register('kelompokId')}
          disabled={!selectedInstansiId || loadingKelompok}
          className="h-11 block w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3.5 text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
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
        {errors.kelompokId && (
          <p className="mt-1 text-xs font-medium text-red-500">{errors.kelompokId.message}</p>
        )}
      </div>

      {/* PILIHAN SETORAN BULANAN/MINGGUAN & LAMA TABUNGAN */}
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-950/25 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Rencana Setoran &amp; Lama Tabungan Anda</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1">
              Pilihan Setoran
            </label>
            <select
              {...register('periodeSetoran')}
              className="h-11 block w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3 text-xs sm:text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="bulanan">Setoran Bulanan</option>
              <option value="mingguan">Setoran Mingguan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1">
              Lama Tabungan
            </label>
            <select
              value={customLama ? 'custom' : String(lamaTabungan)}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'custom') {
                  setCustomLama(true)
                } else {
                  setCustomLama(false)
                  const numVal = Number(v)
                  setValue('lamaTabungan', numVal, { shouldValidate: true })
                  if (numVal === 10) {
                    setBulanMulai(7) // Juli -> 10 bulan
                  } else if (numVal === 12) {
                    setBulanMulai(5) // Mei -> 12 bulan
                  }
                }
              }}
              className="h-11 block w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3 text-xs sm:text-sm font-medium text-ink dark:text-ink-dark focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {LAMA_TABUNGAN_PRESETS.map((p) => (
                <option key={p.value} value={String(p.value)}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Bebas / Kustom Bulan...</option>
            </select>
          </div>
        </div>

        {/* Fitur Pilihan Bulan & Hitung Otomatis Lama Tabungan */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/25 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-xs text-ink dark:text-ink-dark flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Pilihan Bulan Mulai Menabung:
            </span>
            <span className="rounded-lg bg-emerald-600/15 px-2.5 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              Otomatis: {lamaTabungan} Bulan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-ink-muted dark:text-ink-muted-dark block mb-1">
                Mulai Bulan Tabungan:
              </label>
              <select
                value={bulanMulai}
                onChange={(e) => {
                  const b = Number(e.target.value)
                  setBulanMulai(b)
                  const durasi = hitungLamaTabunganDariBulan(b, bulanSelesai)
                  setValue('lamaTabungan', durasi, { shouldValidate: true })
                  setCustomLama(false)
                }}
                className="h-10 w-full rounded-xl border border-emerald-500/40 bg-white dark:bg-bg-dark px-3 text-xs font-bold text-ink dark:text-ink-dark focus:border-emerald-600 focus:outline-none cursor-pointer"
              >
                {DAFTAR_BULAN.map((b) => {
                  const durasi = hitungLamaTabunganDariBulan(b.value, bulanSelesai)
                  return (
                    <option key={b.value} value={b.value}>
                      Bulan {b.label} {b.value === 7 ? '⭐ (Otomatis 10 Bulan - Standar Qurban)' : `(Otomatis ${durasi} Bulan)`}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-ink-muted dark:text-ink-muted-dark block mb-1">
                Target Pelaksanaan Qurban:
              </label>
              <select
                value={bulanSelesai}
                onChange={(e) => {
                  const end = Number(e.target.value)
                  setBulanSelesai(end)
                  const durasi = hitungLamaTabunganDariBulan(bulanMulai, end)
                  setValue('lamaTabungan', durasi, { shouldValidate: true })
                }}
                className="h-10 w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-bg-dark px-3 text-xs font-medium text-ink dark:text-ink-dark focus:border-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value={4}>Bulan April (Sebelum Hari Raya Mei)</option>
                <option value={5}>Bulan Mei (Bulan Hari Raya Qurban)</option>
                <option value={6}>Bulan Juni</option>
              </select>
            </div>
          </div>

          <div className="pt-0.5 border-t border-emerald-500/20">
            <div className="text-[11px] text-ink-muted dark:text-ink-muted-dark mb-1.5 flex items-center justify-between">
              <span>Rincian {lamaTabungan} Bulan Setoran:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {DAFTAR_BULAN.find((b) => b.value === Number(bulanMulai))?.label} ➔ {DAFTAR_BULAN.find((b) => b.value === Number(bulanSelesai))?.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getDaftarBulanRentang(bulanMulai, lamaTabungan).map((bln, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-white dark:bg-bg-dark px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs"
                >
                  <span className="text-ink-muted dark:text-ink-muted-dark font-normal">#{idx + 1}</span>
                  <span>{bln}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {customLama && (
          <Input
            label="Lama Tabungan (Bulan)"
            type="number"
            min={1}
            max={120}
            placeholder="Contoh: 30 (untuk 30 bulan)"
            error={errors.lamaTabungan?.message}
            {...register('lamaTabungan')}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-xl border border-emerald-500/20 bg-white dark:bg-bg-dark p-3 text-xs">
          <div className="flex items-center gap-2 text-ink-muted dark:text-ink-muted-dark">
            <Calculator className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Target per orang {formatCurrency(targetPerAnggota)} ({simulasi.lamaBulan} bln / {simulasi.totalPeriode}x {simulasi.labelPeriode}):
            </span>
          </div>
          <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
            {formatCurrency(simulasi.nominalPerPeriode)} / {simulasi.labelPeriode}
          </span>
        </div>
      </div>

      <Input
        label="Email (Opsional)"
        type="email"
        icon={Mail}
        placeholder="ahmad@gmail.com (Opsional)"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Kata Sandi (Password)"
        type="password"
        icon={Lock}
        placeholder="Minimal 6 karakter"
        required
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Konfirmasi Kata Sandi"
        type="password"
        icon={Lock}
        placeholder="Ulangi kata sandi Anda"
        required
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" className="h-11 w-full mt-3" loading={isSubmitting}>
        Daftar &amp; Mulai Tabungan Qurban
      </Button>

      <div className="pt-4 border-t border-border dark:border-border-dark text-center">
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
          Sudah memiliki akun?{' '}
          <Link
            to="/login"
            className="font-bold text-emerald-600 hover:text-emerald-500 hover:underline dark:text-emerald-400"
          >
            Masuk Sekarang
          </Link>
        </p>
      </div>
    </form>
  )
}
