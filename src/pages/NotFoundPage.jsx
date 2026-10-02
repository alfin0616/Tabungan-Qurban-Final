import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import logoSiqurban from '../assets/logo-siqurban.png'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg dark:bg-bg-dark px-6 text-center">
      <img src={logoSiqurban} alt="SIQURBAN" className="h-16 w-16 rounded-full object-cover" />
      <h1 className="text-3xl font-bold text-ink dark:text-ink-dark">404</h1>
      <p className="text-ink-muted dark:text-ink-muted-dark">Halaman yang Anda cari tidak ditemukan.</p>
      <Link to="/dashboard">
        <Button>Kembali ke Dashboard</Button>
      </Link>
    </div>
  )
}
