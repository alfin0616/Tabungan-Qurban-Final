import LoginForm from '../../components/forms/LoginForm'

export default function LoginPage() {
  return (
    <div>
      <div className="mb-4">
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Autentikasi Akun
        </span>
        <h1 className="mt-1.5 text-xl sm:text-2xl font-extrabold tracking-tight text-ink dark:text-ink-dark">
          Masuk ke Akun Anda
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted dark:text-ink-muted-dark">
          Masuk menggunakan <strong className="font-semibold text-ink dark:text-ink-dark">Email</strong> atau{' '}
          <strong className="font-semibold text-ink dark:text-ink-dark">Nomor Telepon (WA)</strong> untuk mengelola tabungan qurban Anda.
        </p>
      </div>

      <LoginForm />
    </div>
  )
}
