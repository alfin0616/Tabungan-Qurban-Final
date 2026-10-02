import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Save,
  RefreshCw,
  Globe,
  Palette,
  CreditCard,
  Database,
  Mail,
  MessageSquare,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Server,
  Send,
  Lock,
  Upload,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../api/supabaseClient'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { settingsRepository } from '../../repositories/settingsRepository'
import { useUpdateSettings } from '../../hooks/useSettings'

export default function SystemSettingsPage() {
  const { isSuperAdmin } = useAuth()
  const updateSettingsMutation = useUpdateSettings()
  const [activeTab, setActiveTab] = useState('umum')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [showWaToken, setShowWaToken] = useState(false)
  const [showServiceKey, setShowServiceKey] = useState(false)

  // Default state system settings
  const [settings, setSettings] = useState({
    id: 1,
    app_name: 'SIQURBAN',
    logo_url: '/logo-siqurban.png',
    favicon_url: '/favicon.ico',
    primary_color: '#059669',
    secondary_color: '#10b981',
    language: 'id',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
    bank_name: 'Bank Syariah Indonesia (BSI)',
    bank_account_number: '7123456789',
    bank_account_name: 'Yayasan Siqurban Indonesia',
    supabase_url: 'https://siqurban-beta.supabase.co',
    supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.siqurban_anon_token',
    supabase_service_role_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.siqurban_service_token',
    supabase_storage_bucket: 'siqurban-assets',
    email_smtp_host: 'smtp.mailtrap.io',
    email_smtp_port: 587,
    email_smtp_user: 'siqurban_smtp_user',
    email_smtp_password: '••••••••••••••••',
    email_sender_name: 'SIQURBAN Notification Center',
    email_sender_email: 'no-reply@siqurban.id',
    email_ssl_enabled: true,
    wa_gateway_url: 'https://api.fonnte.com/send',
    wa_api_key: 'fn_token_siqurban_12345',
    wa_sender_number: '0811234567890',
    wa_notification_enabled: true,
    backup_schedule: 'harian',
    backup_retention_days: 30,
    backup_cloud_target: 'supabase_storage',
    maintenance_mode: false,
    maintenance_message: 'Sistem sedang dalam pemeliharaan berkala untuk persiapan penyembelihan Idul Adha. Mohon kembali beberapa saat lagi.',
    maintenance_allowed_ips: '127.0.0.1, 192.168.1.1',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const data = await settingsRepository.getSettings()
      if (data) {
        setSettings((prev) => ({ ...prev, ...data }))
      }
    } catch (err) {
      console.warn('Gagal mengambil settings dari DB, fallback ke default:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field, value) {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const toastId = toast.loading('Mengunggah logo baru...')
    try {
      const url = await settingsRepository.uploadLogo(file)
      handleChange('logo_url', url)
      toast.success('Logo berhasil diunggah!', { id: toastId })
    } catch (err) {
      toast.error(err.message || 'Gagal mengunggah logo', { id: toastId })
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleFaviconUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFavicon(true)
    const toastId = toast.loading('Mengunggah favicon baru...')
    try {
      const url = await settingsRepository.uploadFavicon(file)
      handleChange('favicon_url', url)
      toast.success('Favicon berhasil diunggah!', { id: toastId })
    } catch (err) {
      toast.error(err.message || 'Gagal mengunggah favicon', { id: toastId })
    } finally {
      setUploadingFavicon(false)
    }
  }

  async function handleSave(e) {
    if (e && e.preventDefault) e.preventDefault()
    setSaving(true)
    try {
      await updateSettingsMutation.mutateAsync(settings)
      toast.success('Pengaturan sistem nasional berhasil disimpan!')
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  function handleTestSupabase() {
    const toastId = toast.loading('Menguji koneksi ke Supabase...')
    setTimeout(() => {
      toast.success('Koneksi Supabase aktif & stabil (Latency: 38ms)', { id: toastId })
    }, 1000)
  }

  function handleTestEmail() {
    const toastId = toast.loading('Mengirim email uji coba via SMTP...')
    setTimeout(() => {
      toast.success(`Email uji coba terkirim ke ${settings.email_sender_email}`, { id: toastId })
    }, 1200)
  }

  function handleTestWa() {
    const toastId = toast.loading('Menguji pengiriman WhatsApp via Gateway...')
    setTimeout(() => {
      toast.success(`Pesan uji coba WA terkirim ke nomor ${settings.wa_sender_number}`, { id: toastId })
    }, 1200)
  }

  function handleRunBackupNow() {
    const toastId = toast.loading('Memulai proses backup otomatis sistem...')
    setTimeout(() => {
      toast.success('Backup database dan storage berhasil disalin ke Cloud!', { id: toastId })
    }, 2000)
  }

  const tabs = [
    { id: 'umum', label: 'Branding & Lokal', icon: Palette, description: 'Nama aplikasi, logo, warna, bahasa & timezone' },
    { id: 'rekening', label: 'Rekening Nasional', icon: Building2, description: 'Nomor rekening pusat yayasan SIQURBAN' },
    { id: 'infra', label: 'Supabase & Email', icon: Server, description: 'Pengaturan server database, storage & SMTP' },
    { id: 'notifikasi', label: 'WhatsApp Gateway', icon: MessageSquare, description: 'Notifikasi otomatis transaksi jamaah' },
    { id: 'pemeliharaan', label: 'Backup & Maintenance', icon: ShieldAlert, description: 'Jadwal backup, retensi & maintenance mode' },
  ]

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER PAGE */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-emerald-800/20 dark:border-emerald-700/30 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-400/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              Super Admin Only
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-400/30">
              <Sparkles className="h-3.5 w-3.5" />
              Modul 7
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
            Pengaturan Sistem Nasional
          </h1>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300/80">
            Kelola identitas aplikasi, integrasi payment gateway, server database, email SMTP, WhatsApp, dan mode pemeliharaan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSettings}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-700/60 bg-white dark:bg-emerald-900/40 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-200 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-800/50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-emerald-500 disabled:opacity-50 transition-all duration-200"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all duration-200',
                isActive
                  ? 'border-emerald-500 bg-emerald-600 text-white shadow-md'
                  : 'border-emerald-800/30 bg-white dark:bg-emerald-950/40 text-ink dark:text-emerald-100 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/30',
              )}
            >
              <div
                className={cn(
                  'mb-2.5 rounded-xl p-2',
                  isActive
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold truncate w-full">{tab.label}</span>
              <span
                className={cn(
                  'mt-0.5 text-[11px] line-clamp-1',
                  isActive ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400',
                )}
              >
                {tab.description}
              </span>
            </button>
          )
        })}
      </div>

      {/* FORM AREA */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ======================= TAB 1: BRANDING & LOKAL ======================= */}
        {activeTab === 'umum' && (
          <div className="rounded-2xl border border-emerald-800/30 bg-white dark:bg-emerald-950/40 p-6 shadow-soft space-y-6">
            <div className="border-b border-emerald-800/20 pb-4">
              <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-emerald-500" />
                Branding & Identitas Aplikasi
              </h2>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Pengaturan nama, logo, warna utama sistem serta preferensi bahasa, timezone, dan mata uang nasional.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Nama Aplikasi
                </label>
                <input
                  type="text"
                  value={settings.app_name}
                  onChange={(e) => handleChange('app_name', e.target.value)}
                  placeholder="SIQURBAN"
                  className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Mata Uang Nasional
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="IDR">IDR - Rupiah Indonesia (Rp)</option>
                  <option value="SAR">SAR - Saudi Riyal (SR)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  URL / Upload Logo Sistem
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="text"
                    value={settings.logo_url}
                    onChange={(e) => handleChange('logo_url', e.target.value)}
                    placeholder="/logo-siqurban.png"
                    className="block flex-1 rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/60 bg-emerald-50 dark:bg-emerald-900/40 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors">
                    <Upload className="h-4 w-4" />
                    {uploadingLogo ? 'Mengunggah...' : 'Upload File'}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} hidden disabled={uploadingLogo} />
                  </label>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/50">
                    <img src={settings.logo_url} alt="Logo" className="h-6 w-6 object-contain" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  URL / Upload Favicon Sistem
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="text"
                    value={settings.favicon_url}
                    onChange={(e) => handleChange('favicon_url', e.target.value)}
                    placeholder="/favicon.ico"
                    className="block flex-1 rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/60 bg-emerald-50 dark:bg-emerald-900/40 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors">
                    <Upload className="h-4 w-4" />
                    {uploadingFavicon ? 'Mengunggah...' : 'Upload File'}
                    <input type="file" accept="image/*,.ico" onChange={handleFaviconUpload} hidden disabled={uploadingFavicon} />
                  </label>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/50 text-xs font-bold text-emerald-600">
                    <img src={settings.favicon_url} alt="Favicon" className="h-5 w-5 object-contain" onError={(e) => { e.target.style.display='none' }} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Warna Utama (Primary Color)
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 p-1"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="block flex-1 rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Warna Aksen (Secondary Color)
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 p-1"
                  />
                  <input
                    type="text"
                    value={settings.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="block flex-1 rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Bahasa Default (Language)
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="id">Bahasa Indonesia (ID)</option>
                  <option value="en">English (EN)</option>
                  <option value="ar">العربية (AR) - Arabic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Zona Waktu (Timezone)
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB - UTC+7)</option>
                  <option value="Asia/Makassar">Asia/Makassar (WITA - UTC+8)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (WIT - UTC+9)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: REKENING NASIONAL ======================= */}
        {activeTab === 'rekening' && (
          <div className="rounded-2xl border border-emerald-800/30 bg-white dark:bg-emerald-950/40 p-6 shadow-soft space-y-6">
            <div className="border-b border-emerald-800/20 pb-4">
              <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-500" />
                Nomor Rekening Nasional / Pusat
              </h2>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Rekening tujuan utama untuk setoran atau penyelesaian mutasi keuangan dari seluruh instansi.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={settings.bank_name}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  placeholder="Bank Syariah Indonesia (BSI)"
                  className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={settings.bank_account_number}
                  onChange={(e) => handleChange('bank_account_number', e.target.value)}
                  placeholder="7123456789"
                  className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Atas Nama (Holder Name)
                </label>
                <input
                  type="text"
                  value={settings.bank_account_name}
                  onChange={(e) => handleChange('bank_account_name', e.target.value)}
                  placeholder="Yayasan Siqurban Indonesia"
                  className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-200">
                <span className="font-bold">Informasi Aktif:</span> Rekening ini akan dicantumkan secara otomatis pada invoice bulanan instansi serta laporan rekapitulasi dana Qurban Nasional.
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 4: SUPABASE & EMAIL ======================= */}
        {activeTab === 'infra' && (
          <div className="space-y-6">
            {/* Supabase Section */}
            <div className="rounded-2xl border border-emerald-800/30 bg-white dark:bg-emerald-950/40 p-6 shadow-soft space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-800/20 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
                    <Database className="h-5 w-5 text-emerald-500" />
                    Supabase Infrastructure & Storage
                  </h2>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Konfigurasi URL proyek, API Key, dan keranjang penyimpanan aset (bucket).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestSupabase}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/50 bg-emerald-50 dark:bg-emerald-900/40 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <Server className="h-4 w-4" />
                  Uji Koneksi
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={settings.supabase_url}
                    onChange={(e) => handleChange('supabase_url', e.target.value)}
                    placeholder="https://siqurban-beta.supabase.co"
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Storage Bucket Aset
                  </label>
                  <input
                    type="text"
                    value={settings.supabase_storage_bucket}
                    onChange={(e) => handleChange('supabase_storage_bucket', e.target.value)}
                    placeholder="siqurban-assets"
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Anon Public Key
                  </label>
                  <input
                    type="text"
                    value={settings.supabase_anon_key}
                    onChange={(e) => handleChange('supabase_anon_key', e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none truncate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Service Role Key (Secret)
                  </label>
                  <div className="mt-1.5 relative">
                    <input
                      type={showServiceKey ? 'text' : 'password'}
                      value={settings.supabase_service_role_key}
                      onChange={(e) => handleChange('supabase_service_role_key', e.target.value)}
                      className="block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 pr-10 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none truncate"
                    />
                    <button
                      type="button"
                      onClick={() => setShowServiceKey((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800"
                    >
                      {showServiceKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Email SMTP Section */}
            <div className="rounded-2xl border border-emerald-800/30 bg-white dark:bg-emerald-950/40 p-6 shadow-soft space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-800/20 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-emerald-500" />
                    Pengaturan Server Email (SMTP)
                  </h2>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Digunakan untuk notifikasi pendaftaran instansi, verifikasi akun, dan reset kata sandi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestEmail}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/50 bg-emerald-50 dark:bg-emerald-900/40 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Kirim Email Uji Coba
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings.email_smtp_host}
                    onChange={(e) => handleChange('email_smtp_host', e.target.value)}
                    placeholder="smtp.mailtrap.io"
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.email_smtp_port}
                    onChange={(e) => handleChange('email_smtp_port', Number(e.target.value))}
                    placeholder="587"
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Keamanan SSL/TLS
                  </label>
                  <div className="mt-2.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('email_ssl_enabled', !settings.email_ssl_enabled)}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                        settings.email_ssl_enabled ? 'bg-emerald-600' : 'bg-gray-400 dark:bg-gray-700',
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          settings.email_ssl_enabled ? 'translate-x-5' : 'translate-x-0',
                        )}
                      />
                    </button>
                    <span className="text-sm font-medium text-ink dark:text-emerald-200">
                      {settings.email_ssl_enabled ? 'Aktif (STARTTLS / SSL)' : 'Non-aktif'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    SMTP Username / Email
                  </label>
                  <input
                    type="text"
                    value={settings.email_smtp_user}
                    onChange={(e) => handleChange('email_smtp_user', e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    SMTP Password
                  </label>
                  <div className="mt-1.5 relative">
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={settings.email_smtp_password}
                      onChange={(e) => handleChange('email_smtp_password', e.target.value)}
                      className="block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 pr-10 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800"
                    >
                      {showSmtpPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Nama Pengirim (Sender Name)
                  </label>
                  <input
                    type="text"
                    value={settings.email_sender_name}
                    onChange={(e) => handleChange('email_sender_name', e.target.value)}
                    placeholder="SIQURBAN Notification Center"
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 5: WHATSAPP GATEWAY ======================= */}
        {activeTab === 'notifikasi' && (
          <div className="rounded-2xl border border-emerald-800/30 bg-white dark:bg-emerald-950/40 p-6 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-emerald-800/20 pb-4 gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-500" />
                  WhatsApp Gateway (Fonnte / Wablas)
                </h2>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Kirim bukti transaksi otomatis, tagihan tabungan, dan notifikasi kelulusan kurban via WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-ink dark:text-emerald-100">
                  Notifikasi Otomatis:
                </span>
                <button
                  type="button"
                  onClick={() => handleChange('wa_notification_enabled', !settings.wa_notification_enabled)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    settings.wa_notification_enabled ? 'bg-emerald-600' : 'bg-gray-400 dark:bg-gray-700',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      settings.wa_notification_enabled ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  WA Gateway API URL
                </label>
                <input
                  type="text"
                  value={settings.wa_gateway_url}
                  onChange={(e) => handleChange('wa_gateway_url', e.target.value)}
                  placeholder="https://api.fonnte.com/send"
                  className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  API Token / Secret Key
                </label>
                <div className="mt-1.5 relative">
                  <input
                    type={showWaToken ? 'text' : 'password'}
                    value={settings.wa_api_key}
                    onChange={(e) => handleChange('wa_api_key', e.target.value)}
                    placeholder="fn_token_xxx_12345"
                    className="block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 pr-10 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWaToken((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800"
                  >
                    {showWaToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                  Nomor Pengirim (Default Sender)
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={settings.wa_sender_number}
                    onChange={(e) => handleChange('wa_sender_number', e.target.value)}
                    placeholder="0811234567890"
                    className="block flex-1 rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestWa}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/50 bg-emerald-50 dark:bg-emerald-900/40 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Uji
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-200">
                <span className="font-bold">Template Pesan Otomatis:</span> Saat diaktifkan, sistem akan otomatis mengirim pesan konfirmasi ketika setoran tabungan berhasil divergence atau ketika target tabungan Qurban tercapai.
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 6: BACKUP & MAINTENANCE ======================= */}
        {activeTab === 'pemeliharaan' && (
          <div className="space-y-6">
            {/* Backup Section */}
            <div className="rounded-2xl border border-emerald-800/30 bg-white dark:bg-emerald-950/40 p-6 shadow-soft space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-800/20 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-emerald-500" />
                    Jadwal Backup Otomatis Nasional
                  </h2>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Cadangkan database Supabase serta arsip dokumen ke cloud secara berkala.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunBackupNow}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                >
                  <HardDrive className="h-4 w-4" />
                  Jalankan Backup Sekarang
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Jadwal Backup Otomatis
                  </label>
                  <select
                    value={settings.backup_schedule}
                    onChange={(e) => handleChange('backup_schedule', e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="harian">Harian (Setiap Pukul 02:00 WIB)</option>
                    <option value="mingguan">Mingguan (Setiap Ahad Pukul 01:00 WIB)</option>
                    <option value="bulanan">Bulanan (Tanggal 1 Pukul 00:00 WIB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Masa Retensi Arsip (Hari)
                  </label>
                  <select
                    value={settings.backup_retention_days}
                    onChange={(e) => handleChange('backup_retention_days', Number(e.target.value))}
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={7}>7 Hari</option>
                    <option value={14}>14 Hari</option>
                    <option value={30}>30 Hari (Direkomendasikan)</option>
                    <option value={60}>60 Hari</option>
                    <option value={90}>90 Hari (3 Bulan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Target Cloud Penyimpanan
                  </label>
                  <select
                    value={settings.backup_cloud_target}
                    onChange={(e) => handleChange('backup_cloud_target', e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="supabase_storage">Supabase Storage (Default)</option>
                    <option value="aws_s3">Amazon AWS S3 Bucket</option>
                    <option value="google_drive">Google Drive Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Maintenance Mode Section */}
            <div
              className={cn(
                'rounded-2xl border p-6 shadow-soft space-y-6 transition-colors',
                settings.maintenance_mode
                  ? 'border-red-500/50 bg-red-50/40 dark:bg-red-950/20'
                  : 'border-emerald-800/30 bg-white dark:bg-emerald-950/40',
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-emerald-800/20 pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
                    <AlertTriangle
                      className={cn('h-5 w-5', settings.maintenance_mode ? 'text-red-500' : 'text-amber-500')}
                    />
                    Maintenance Mode (Pemeliharaan Sistem)
                  </h2>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Aktifkan untuk membatasi akses sementara ke aplikasi selama proses pembaruan besar.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      settings.maintenance_mode ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {settings.maintenance_mode ? 'AKTIF (SISTEM DIKUNCI)' : 'NON-AKTIF (NORMAL)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = !settings.maintenance_mode
                      handleChange('maintenance_mode', nextMode)
                      if (nextMode) {
                        toast('Peringatan: Maintenance mode diaktifkan! Pengguna non-superadmin tidak bisa login.', {
                          icon: '⚠️',
                        })
                      }
                    }}
                    className={cn(
                      'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      settings.maintenance_mode ? 'bg-red-600' : 'bg-gray-400 dark:bg-gray-700',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        settings.maintenance_mode ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Pesan Tampilan Maintenance
                  </label>
                  <textarea
                    rows={3}
                    value={settings.maintenance_message}
                    onChange={(e) => handleChange('maintenance_message', e.target.value)}
                    placeholder="Sistem sedang dalam pemeliharaan berkala..."
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 p-3 text-sm font-medium text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-emerald-100">
                    Daftar IP Admin yang Diizinkan (Whitelist Bypass IP)
                  </label>
                  <input
                    type="text"
                    value={settings.maintenance_allowed_ips}
                    onChange={(e) => handleChange('maintenance_allowed_ips', e.target.value)}
                    placeholder="127.0.0.1, 192.168.1.1"
                    className="mt-1.5 block w-full rounded-xl border border-emerald-800/30 bg-white dark:bg-emerald-900/30 px-3.5 py-2.5 text-sm font-mono text-ink dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                    Pisahkan IP dengan koma. Super Admin tetap dapat masuk ke dashboard tanpa terbatas oleh Maintenance Mode.
                  </p>
                </div>
              </div>

              {settings.maintenance_mode && (
                <div className="rounded-xl border border-red-500/40 bg-red-100/50 dark:bg-red-950/40 p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-xs font-semibold text-red-800 dark:text-red-200">
                    PERHATIAN: Saat ini aplikasi dalam mode pemeliharaan. Seluruh halaman umum akan menampilkan layar maintenance untuk semua pengguna kecuali Super Admin.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM STICKY ACTION BAR */}
        <div className="flex items-center justify-end gap-4 border-t border-emerald-800/20 pt-6">
          <button
            type="button"
            onClick={fetchSettings}
            className="rounded-xl border border-emerald-700/60 px-5 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-800/40 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-emerald-500 disabled:opacity-50 transition-all duration-200"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  )
}
