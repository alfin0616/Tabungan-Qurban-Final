import { Link } from 'react-router-dom'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { formatCurrency } from '../../utils/formatCurrency'

export default function TabunganTable({ data = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border dark:border-border-dark text-xs uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
            <th className="py-3 pr-4">Anggota</th>
            <th className="py-3 pr-4">Saldo</th>
            <th className="py-3 pr-4">Target</th>
            <th className="py-3 pr-4">Progres</th>
            <th className="py-3 pr-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-border-dark">
          {data.map((t) => {
            const persentase = t.target > 0 ? Math.min(100, Math.round((t.saldo / t.target) * 100)) : 0
            return (
              <tr key={t.id}>
                <td className="py-3 pr-4">
                  <Link to={`/anggota/${t.anggota?.id}`} className="flex items-center gap-3 hover:text-emerald-600">
                    <Avatar src={t.anggota?.foto} name={t.anggota?.nama} size={32} />
                    <div>
                      <p className="font-medium text-ink dark:text-ink-dark">{t.anggota?.nama}</p>
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{t.anggota?.kode_anggota}</p>
                    </div>
                  </Link>
                </td>
                <td className="py-3 pr-4 font-medium text-emerald-600">{formatCurrency(t.saldo)}</td>
                <td className="py-3 pr-4 text-ink-muted dark:text-ink-muted-dark">{formatCurrency(t.target)}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-emerald-50 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${persentase}%` }} />
                    </div>
                    <span className="text-xs text-ink-muted dark:text-ink-muted-dark">{persentase}%</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={t.anggota?.status ? 'emerald' : 'danger'}>
                    {t.anggota?.status ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
