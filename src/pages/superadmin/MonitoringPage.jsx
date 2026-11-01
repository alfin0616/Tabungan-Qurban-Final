import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  Server,
  Zap,
  Users,
  Building2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { monitoringRepository } from '../../repositories/monitoringRepository'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import StatCard from '../../components/cards/StatCard'
import Badge from '../../components/ui/Badge'
import InstansiMonitoringModal from '../../components/modal/InstansiMonitoringModal'
import { SkeletonCard, SkeletonTableRow } from '../../components/ui/Skeleton'
import { formatCurrency } from '../../utils/formatCurrency'

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState(null)
  const [latency, setLatency] = useState(0)
  const [activities, setActivities] = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [monitoringInstansi, setMonitoringInstansi] = useState(null)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [pingMs, healthData, activityList, instansis] = await Promise.all([
        monitoringRepository.pingDatabase(),
        monitoringRepository.getHealthMetrics(),
        monitoringRepository.getRecentActivities(10),
        monitoringRepository.getInstansiHealthList(),
      ])

      setLatency(pingMs)
      setMetrics(healthData)
      setActivities(activityList)
      setInstansiList(instansis)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[Monitoring] Fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  function getLatencyBadge(ms) {
    if (ms < 0) return <Badge variant="danger">Offline / Error</Badge>
    if (ms <= 150) return <Badge variant="success">{ms} ms — Sangat Cepat</Badge>
    if (ms <= 350) return <Badge variant="warning">{ms} ms — Normal</Badge>
    return <Badge variant="danger">{ms} ms — Lambat</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header & Refresh Controls inside Argon Card */}
      <div className="rounded-2xl border border-border/80 dark:border-border-dark bg-surface dark:bg-surface-dark p-5 shadow-argon flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tl from-emerald-800 to-emerald-600 text-white shadow-md shadow-emerald-900/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-ink dark:text-ink-dark">System & Multi-Tenant Monitoring</h1>
            <p className="text-xs sm:text-sm text-ink-muted dark:text-ink-muted-dark">
              Pemantauan kesehatan database, seluruh instansi, kelompok, hingga anggota secara real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-ink-muted dark:text-ink-muted-dark">
            <Clock className="h-3.5 w-3.5" />
            Update: {format(lastUpdated, 'HH:mm:ss')}
          </span>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg px-4 py-2 text-xs font-semibold text-ink shadow-2xs transition-colors hover:bg-emerald-50 dark:border-border-dark dark:bg-slate-800 dark:text-ink-dark dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Latency & Server Status Banner */}
      <Card className="bg-slate-900 text-white dark:bg-slate-950">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Server className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Supabase PostgreSQL Engine</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-tenant Database Engine • Regional AWS Singapore (ap-southeast-1)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-800 pt-3 sm:border-t-0 sm:pt-0">
            <div className="text-right">
              <p className="text-xs text-slate-400">Latensi Respon API</p>
              <div className="mt-0.5">{getLatencyBadge(latency)}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Building2}
            tone="emerald"
            label="Instansi Aktif"
            value={metrics?.total_instansi || 0}
            hint="Masjid / Lembaga terdaftar"
            to="/superadmin/instansi"
          />
          <StatCard
            icon={Users}
            tone="warning"
            label="Total Jamaah (Anggota)"
            value={metrics?.total_anggota || 0}
            hint="Terhubung di seluruh instansi"
            to="/anggota"
          />
          <StatCard
            icon={Zap}
            tone="emerald"
            label="Total Transaksi"
            value={metrics?.total_transaksi || 0}
            hint="Setoran & penarikan"
            to="/transaksi/riwayat"
          />
          <StatCard
            icon={ShieldCheck}
            tone="emerald"
            label="Volume Saldo Nasional"
            value={formatCurrency(metrics?.total_saldo || 0)}
            hint="Akumulasi saldo terkini"
            to="/tabungan"
          />
        </div>
      )}

      {/* Main Grid: Activity Stream + Instansi Health */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Real-time Activity Stream */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500 animate-pulse" />
              Live Activity Stream (Audit Logs)
            </CardTitle>
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">10 Aktivitas Terkini</span>
          </CardHeader>

          <div className="p-5 pt-0">
            {loading ? (
              <SkeletonTableRow rows={5} cols={3} />
            ) : !activities.length ? (
              <p className="text-center py-6 text-xs text-ink-muted dark:text-ink-muted-dark">
                Belum ada log aktivitas tercatat.
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start justify-between rounded-xl border border-border bg-slate-50 p-3 transition-colors dark:border-border-dark dark:bg-slate-800/40"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {act.action}
                        </span>
                        <span className="text-xs font-medium text-ink dark:text-ink-dark">
                          {act.description}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">
                        Role: <strong className="capitalize">{act.role || 'System'}</strong> • IP: {act.ip_address || 'localhost'}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-ink-muted dark:text-ink-muted-dark">
                      {format(new Date(act.created_at), 'HH:mm:ss')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Instansi Health Status & Drill-down Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-700" />
              Monitoring Seluruh Instansi
            </CardTitle>
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
              Klik Monitor untuk cek Kelompok & Anggota
            </span>
          </CardHeader>

          <div className="p-5 pt-0">
            {loading ? (
              <SkeletonTableRow rows={5} cols={3} />
            ) : !instansiList.length ? (
              <p className="text-center py-6 text-xs text-ink-muted dark:text-ink-muted-dark">
                Belum ada instansi terdaftar.
              </p>
            ) : (
              <div className="divide-y divide-border dark:divide-border-dark">
                {instansiList.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink dark:text-ink-dark">
                        {inst.nama_instansi || inst.nama}
                      </p>
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                        Kode: <span className="font-mono">{inst.kode_instansi || '-'}</span> • Dibuat:{' '}
                        {inst.created_at
                          ? format(new Date(inst.created_at), 'd MMM yyyy', { locale: id })
                          : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={inst.status ? 'success' : 'danger'}>
                        {inst.status ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => setMonitoringInstansi(inst)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-700 hover:text-white dark:text-emerald-300 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Monitor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <InstansiMonitoringModal
        open={!!monitoringInstansi}
        onClose={() => setMonitoringInstansi(null)}
        instansi={monitoringInstansi}
      />
    </div>
  )
}
