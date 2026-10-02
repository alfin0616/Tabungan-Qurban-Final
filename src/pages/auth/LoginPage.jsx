import LoginForm from '../../components/forms/LoginForm'

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Masuk ke akun Anda</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted dark:text-ink-muted-dark">
        Masuk menggunakan <strong>Email</strong> atau <strong>Nomor Telepon (WA)</strong> untuk mengelola tabungan qurban Anda.
      </p>

      <LoginForm />
    </div>
  )
}
