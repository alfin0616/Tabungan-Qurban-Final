import { Outlet } from 'react-router-dom'
import { Building2, Users, ShieldCheck } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'
import logoSQNn from '../../assets/siqurban-logo-v4.png'

export default function AuthLayout() {
  const { data: settings } = useSettings()
  const isDefaultLogo =
    !settings?.logo_url ||
    settings.logo_url.startsWith('/')
  const logoUrl = isDefaultLogo ? logoSQNn : settings.logo_url
  const appName = settings?.app_name || 'SIQURBAN'

  return (
    <div className="grid min-h-dvh w-full max-w-full overflow-x-hidden bg-bg dark:bg-bg-dark lg:grid-cols-12">
      {/* Panel Kiri: Hero Argon Deep Emerald (Tampil di Desktop) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-700 p-10 xl:p-12 text-white lg:col-span-5 lg:flex xl:col-span-6">
        {/* Dekorasi Cahaya Argon */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />

        {/* Brand Header */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt={appName}
              className="h-11 w-11 rounded-2xl bg-white/10 p-1 object-contain ring-2 ring-white/20 shadow-lg"
              onError={(e) => {
                e.target.src = logoSQNn
              }}
            />
            <div>
              <span className="block text-lg font-extrabold tracking-wide text-white">
                {appName}
              </span>
              <span className="block text-[11px] font-medium text-emerald-200">
                Sistem Manajemen Tabungan Qurban
              </span>
            </div>
          </div>
        </div>

        {/* Konten Utama Hero */}
        <div className="relative my-auto space-y-6 py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-900/50 px-3.5 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Platform Qurban Terpadu &amp; Transparan
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
            Kelola tabungan qurban jamaah dengan tenang &amp; tertata.
          </h2>

          <p className="max-w-md text-sm leading-relaxed text-emerald-100/90">
            Satu tempat terintegrasi untuk mencatat setoran, memantau kuota anggota kelompok,
            dan menyajikan laporan keuangan qurban secara transparan.
          </p>

          {/* Highlight Fitur Argon */}
          <div className="grid grid-cols-1 gap-3 pt-2 max-w-md">
            <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/25 text-emerald-200">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Multi-Masjid &amp; Instansi Resmi</p>
                <p className="text-[11px] text-emerald-100/80">
                  Setiap instansi memiliki nomor rekening dan manajemen kelompok mandiri.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/25 text-emerald-200">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Kelompok Qurban Transparan</p>
                <p className="text-[11px] text-emerald-100/80">
                  Jamaah dapat melihat daftar rekan satu kelompok dan progres tabungan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-emerald-200/80">
          © {new Date().getFullYear()} {appName}. Dibuat untuk kemudahan jamaah &amp; pengurus qurban.
        </p>
      </div>

      {/* Sisi Kanan: Area Form Card Argon */}
      <div className="relative flex min-h-dvh min-w-0 flex-col justify-between overflow-y-auto w-full lg:col-span-7 xl:col-span-6">
        {/* Banner Header Mobile */}
        <div className="safe-top relative flex flex-col items-center gap-2.5 bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-700 px-6 pb-14 pt-8 text-center text-white lg:hidden">
          <img
            src={logoUrl}
            alt={appName}
            className="h-14 w-14 rounded-2xl bg-white/10 p-1 object-contain ring-2 ring-white/20 shadow-lg"
            onError={(e) => {
              e.target.src = logoSQNn
            }}
          />
          <div>
            <p className="text-lg font-extrabold tracking-wide">{appName}</p>
            <p className="mt-0.5 text-xs text-emerald-100">
              Kelola tabungan qurban jamaah dengan tenang &amp; tertata
            </p>
          </div>
        </div>

        {/* Container Kartu Form */}
        <div className="safe-bottom relative -mt-8 flex flex-1 items-start justify-center px-4 pb-10 sm:px-6 lg:mt-0 lg:items-center lg:py-10">
          <div className="w-full max-w-[460px] rounded-3xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-6 sm:p-8 shadow-argon">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
