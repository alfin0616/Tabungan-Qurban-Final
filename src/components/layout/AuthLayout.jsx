import { Outlet } from 'react-router-dom'
import { useSettings } from '../../hooks/useSettings'
import logoSiqurban from '../../assets/logo-siqurban.png'

export default function AuthLayout() {
  const { data: settings } = useSettings()
  const logoUrl = settings?.logo_url || logoSiqurban
  const appName = settings?.app_name || 'SIQURBAN'

  return (
    <div className="grid min-h-dvh w-full max-w-full overflow-x-hidden lg:grid-cols-2">
      {/* Panel kiri: hanya tampil di layar besar (desktop) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-emerald-700 p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-600/50 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-warning/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <img
            src={logoUrl}
            alt={appName}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-white/20"
            onError={(e) => { e.target.src = logoSiqurban }}
          />
          <span className="text-lg font-bold">{appName}</span>
        </div>

        <div className="relative space-y-4">
          <p className="text-4xl font-semibold leading-tight">
            Kelola tabungan qurban jamaah dengan tenang &amp; tertata.
          </p>
          <p className="max-w-sm text-sm text-emerald-100">
            Satu tempat untuk mencatat setoran, memantau target, dan menyiapkan laporan setiap
            musim qurban tiba.
          </p>
        </div>

        <p className="relative text-xs text-emerald-200">
          © {new Date().getFullYear()} {appName}. Dibuat untuk kemudahan pengurus masjid.
        </p>
      </div>

      {/* Sisi kanan (desktop) / seluruh layar (mobile) */}
      <div className="relative flex min-h-dvh min-w-0 flex-col overflow-hidden w-full max-w-full bg-gradient-to-b from-emerald-700 via-emerald-600 to-bg dark:to-bg-dark lg:bg-none lg:bg-bg lg:dark:bg-bg-dark">
        {/* Dekorasi blur, hanya relevan di mobile */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/30 blur-3xl lg:hidden" />
        <div className="pointer-events-none absolute left-1/2 top-40 h-56 w-56 -translate-x-1/2 rounded-full bg-warning/20 blur-3xl lg:hidden" />

        {/* Header bermerek — mobile only */}
        <div className="safe-top relative flex flex-col items-center gap-3 px-6 pb-10 pt-12 text-center text-white lg:hidden">
          <img
            src={logoUrl}
            alt={appName}
            className="h-16 w-16 rounded-full object-cover ring-4 ring-white/20 shadow-lg"
            onError={(e) => { e.target.src = logoSiqurban }}
          />
          <div>
            <p className="text-xl font-bold">{appName}</p>
            <p className="mt-1 text-sm text-emerald-50">
              Kelola tabungan qurban jamaah dengan tenang &amp; tertata
            </p>
          </div>
        </div>

        {/* Kartu form — mengambang di atas gradient (mobile), polos di desktop */}
        <div className="safe-bottom relative flex flex-1 items-start justify-center px-5 pb-10 lg:items-center lg:px-6 lg:py-12">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl shadow-emerald-900/10 dark:bg-surface-dark dark:shadow-none sm:p-8 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
