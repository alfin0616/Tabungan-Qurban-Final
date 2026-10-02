import RegisterForm from '../../components/forms/RegisterForm'

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Daftar Akun Jamaah</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted dark:text-ink-muted-dark">
        Daftarkan akun menggunakan <strong>Nomor Telepon (WA)</strong> atau <strong>Email</strong> untuk mulai mengelola dan memantau tabungan qurban Anda.
      </p>

      <RegisterForm />
    </div>
  )
}
