# DOKUMENTASI TEKNIS SISTEM SIQURBAN (TABUNGAN QURBAN META)

Aplikasi **SIQURBAN** adalah platform manajemen tabungan qurban berbasis cloud yang mendukung arsitektur *multi-tenant* (Super Admin ➔ Instansi/Masjid ➔ Kelompok Qurban ➔ Jamaah/Anggota). Dokumentasi ini mencakup arsitektur teknis, aliran data, keamanan RLS, integrasi pembayaran, PWA, panduan deployment, serta manajemen backup & recovery.

---

## 1. FOLDER STRUCTURE (STRUKTUR DIREKTORI)

```
tabungan-qurban-beta/
├── docs/                           # Dokumentasi teknis & arsitektur proyek
│   └── DOCUMENTATION.md            # Dokumentasi lengkap sistem
├── public/                         # Aset publik, manifest PWA, dan ikon
│   ├── favicon.ico, logo.png
│   ├── manifest.webmanifest        # Konfigurasi PWA (App Icon, Theme Color)
│   └── sw.js                       # Service Worker PWA (Offline Caching)
├── src/                            # Kode sumber utama aplikasi React
│   ├── components/                 # Komponen UI modular
│   │   ├── cards/                  # Komponen kartu statistik & ringkasan
│   │   ├── forms/                  # Form input (LoginForm, RegisterForm, dll)
│   │   ├── layout/                 # Layout (DashboardLayout, Navbar, Sidebar)
│   │   ├── modal/                  # Dialog & modal konfirmasi
│   │   ├── tables/                 # Tabel data dengan pagination & filter
│   │   └── ui/                     # UI Primitif (Button, Input, Avatar, Badge)
│   ├── context/                    # State global React (AuthContext, ThemeContext)
│   ├── hooks/                      # Custom React Hooks (useAnggota, useTransaksi, dll)
│   ├── lib/                        # Utilitas & klien (supabase.js, cn.js, formatters)
│   ├── pages/                      # Halaman aplikasi berdasarkan modul & role
│   │   ├── anggota/                # Manajemen Data Anggota
│   │   ├── auth/                   # Login, Register, Reset Password, Claim Akun
│   │   ├── dashboard/              # Dashboard Jamaah & Admin
│   │   ├── laporan/                # Laporan Keuangan & Cetak Rekap
│   │   ├── pengeluaran/            # Pengeluaran Operasional Qurban
│   │   ├── profile/                # Pengaturan Profil Pengguna
│   │   ├── settings/               # Pengaturan Sistem, Audit Log, Backup
│   │   ├── superadmin/             # Modul Khusus Super Admin (Monitoring, Logs)
│   │   ├── tabungan/               # Manajemen Rekening Tabungan
│   │   └── transaksi/              # Setoran, Penarikan, & Riwayat Transaksi
│   ├── routes/                     # Manajemen Rute & Protector (ProtectedRoute, AdminRoute)
│   ├── services/                   # Layer Layanan / API Call ke Supabase RPC & SQL
│   ├── App.jsx                     # Komponen Root & Provider Setup
│   ├── main.jsx                    # Entry point React Vite
│   └── index.css                   # Desain Tailwind CSS & variabel tema
├── supabase/                       # File Migrasi SQL & Fungsi Backend Supabase
│   ├── migration_auth_jamaah_instansi_kelompok.sql # Migrasi Utama Auth & Group Sync
│   └── migration_role_jamaah.sql   # Pengaturan Role & Security Definer
├── .env.example                    # Contoh variabel lingkungan
├── package.json                    # Dependensi & skrip proyek
└── vite.config.js                  # Konfigurasi PWA & Vite Bundler
```

---

## 2. ARCHITECTURE (ARSITEKTUR SISTEM)

SIQURBAN menggunakan arsitektur **Modern Decoupled Jamstack (Frontend Framework + BaaS + Payment Gateway)**:

- **Frontend Tier**: React 19 + Vite + Tailwind CSS (SPA / PWA). Responsive untuk Mobile & Desktop.
- **Backend Tier (BaaS)**: Supabase PostgreSQL Database + Supabase Auth + Supabase Storage + PostgREST API.
- **Payment Tier**: Midtrans Snap Payment Gateway API untuk pembayaran setoran online.
- **Security & Authorization**: Row Level Security (RLS) di tingkat Database PostgreSQL & Role-Based Access Control (RBAC) di tingkat Frontend Route Guards.

### Hierarki Multi-Tenant:
1. **Super Admin**: Mengelola seluruh Masjid/Instansi, mengawasi seluruh kas nasional, audit log, dan backup sistem.
2. **Admin Instansi**: Mengelola data kelompok, anggota, tabungan, transaksi setoran/penarikan, dan pengeluaran pada masjid/instansinya sendiri.
3. **Jamaah Qurban**: Melihat perkembangan tabungan pribadi, riwayat transaksi, laporan keuangan kelompok, dan melakukan setoran.

---

## 3. FLOW AUTHENTICATION (ALUR AUTENTIKASI)

```
[Pengguna] ──► Pilihan: Email / No. WhatsApp
    │
    ├── DAFTAR (/register)
    │     ├── 1. Pilih Masjid/Instansi (Mandatory)
    │     ├── 2. Pilih Kelompok Qurban (Mandatory)
    │     ├── 3. Masukkan Nama, WhatsApp / Email, & Kata Sandi
    │     └── 4. Supabase Auth trigger 'handle_new_user' menyimpan metadata profil
    │
    └── LOGIN (/login)
          ├── 1. Pilih Mode (Admin / Jamaah Qurban)
          ├── 2. Masukkan Identifier (Email atau Nomor WA)
          ├── 3. RPC 'resolve_login_email' mengubah No WA -> Auth Email internal
          ├── 4. Supabase Auth memverifikasi password & mengembalikan JWT Session
          └── 5. RPC 'set_active_jamaah_group' mensinkronkan profil & keanggotaan kelompok
```

### Poin Penting:
- **Kewajiban Memilih Masjid & Kelompok**: Setiap Jamaah wajib terikat pada `instansi_id` dan `kelompok_id` untuk mencegah percampuran data kas antar masjid.
- **Claim Akun (`/hubungkan-akun`)**: Untuk anggota yang didaftarkan manual oleh Admin, Jamaah dapat melakukan verifikasi nomor WA saat pertama kali login untuk menghubungkan akun ke data keanggotaan.

---

## 4. FLOW PAYMENT (ALUR SETORAN & PENARIKAN TABUNGAN)

### A. Setoran Tunai / Manual (Oleh Admin)
1. Admin memilih Anggota & Kelompok Qurban.
2. Admin menginput nominal setoran & tanggal transaksi.
3. Database menjalankan transaksi SQL atomic:
   - Menambahkan catatan ke tabel `transaksi` (tipe: `setoran`, status: `berhasil`).
   - Memperbarui total saldo di tabel `tabungan`.
4. Sistem membuat Kupon / Bukti Setoran Digital (Kuitansi PDF/Cetak).

### B. Penarikan Tabungan Qurban
1. Admin menginput permohonan penarikan dana tabungan untuk pembelian hewan qurban.
2. Sistem mengecek kecukupan saldo tabungan anggota/kelompok.
3. Jika saldo cukup, kredit dikurangi dari tabel `tabungan` dan dicatat pada `transaksi` (tipe: `penarikan`).

---

## 5. FLOW DATABASE (SKEMA DATABASE POSTGRESQL)

Daftar tabel utama di Supabase PostgreSQL:
- **`instansi`**: Data Masjid / Lembaga Pengelola Qurban.
- **`kelompok`**: Data Kelompok Qurban per tahun ajaran/musim qurban (`instansi_id`).
- **`admin_profiles`**: Profil pengguna (`id` terhubung ke `auth.users`), mencakup `role`, `phone`, `instansi_id`, `kelompok_id`.
- **`anggota`**: Data profil anggota jamaah yang menabung (`instansi_id`, `kelompok_id`).
- **`tabungan`**: Catatan akun tabungan anggota (`anggota_id`, `total_terkumpul`, `target_nominal`).
- **`transaksi`**: Ledger histori mutasi setoran & penarikan (`tabungan_id`, `jenis_transaksi`, `jumlah`, `status`).
- **`pengeluaran`**: Catatan pengeluaran operasional qurban (`instansi_id`, `kelompok_id`, `kategori`, `jumlah`, `bukti_foto_url`).
- **`audit_logs`**: Catatan jejak audit aktivitas pengguna (IP, User Agent, Aksi).
- **`system_logs`**: Log eror & event sistem backend.
- **`backups`**: Metadata berkas backup snapshot database.

---

## 6. FLOW RLS (ROW LEVEL SECURITY & IZIN AKSES)

Keamanan data diisolasi penuh pada layer PostgreSQL menggunakan **Row Level Security (RLS)**:

### Kebijakan RLS Utama:
1. **Super Admin Policy**:
   `is_super_admin()` memberikan akses membaca/menulis ke seluruh baris tabel di semua instansi.
2. **Admin Instansi Policy**:
   `instansi_id = get_user_instansi_id()` memastikan Admin Instansi hanya dapat melihat & mengedit data milik masjidnya sendiri.
3. **Jamaah Qurban Policy**:
   `instansi_id = get_user_instansi_id() AND kelompok_id = get_user_kelompok_id()` memastikan Jamaah hanya dapat melihat data kelompok tempat ia terdaftar.

---

## 7. FLOW MIDTRANS (INTEGRASI PAYMENT GATEWAY ONLINE)

```
[Jamaah] ──► Pilih Nominal Setoran Online
    │
    ├── 1. Frontend memanggil Endpoint Backend / Supabase Edge Function
    ├── 2. Sistem membuat Snap Transaction Token dari Server Key Midtrans
    ├── 3. Popup Midtrans Snap terbuka di browser (QRIS, Transfer Bank, E-Wallet)
    │
    ├── 4. Jamaah menyelesaikan pembayaran
    └── 5. Midtrans HTTP Notification Webhook (/webhook/midtrans) menerima payload status:
          ├── 'settlement' / 'capture' ──► Status transaksi -> 'berhasil', Saldo tabungan bertambah.
          └── 'expire' / 'cancel'    ──► Status transaksi -> 'gagal'.
```

---

## 8. FLOW PWA (PROGRESSIVE WEB APP & OFFLINE MODE)

1. **Web App Manifest (`public/manifest.webmanifest`)**:
   Menyediakan konfigurasi nama aplikasi (*SIQURBAN*), tema warna (`#059669`), ikon (*192x192* dan *512x512*), serta opsi *display: standalone*.
2. **Service Worker (`public/sw.js`)**:
   - Memasukkan aset statis JS/CSS/Images ke dalam *Cache Storage*.
   - Menyediakan kemampuan *Offline First* untuk membuka aplikasi tanpa jaringan internet.
3. **Offline Detection (`useOnlineStatus.js` & `OfflineBanner.jsx`)**:
   - Mendeteksi hilangnya koneksi internet pengguna secara real-time dan menampilkan banner penanda offline tanpa memblokir penggunaan UI.

---

## 9. DEPLOYMENT GUIDE (PANDUAN DEPLOYMENT PRODUKSI)

### Prasyarat:
- Node.js >= 18.x
- Akun Supabase Project
- Akun Hosting (Vercel / Netlify / Hostinger)

### Langkah Deployment:

1. **Persiapan Variabel Lingkungan (`.env`)**:
   ```env
   VITE_SUPABASE_URL=https://<project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   VITE_MIDTRANS_CLIENT_KEY=<your-midtrans-client-key>
   ```

2. **Jalankan Migrasi Database di Supabase SQL Editor**:
   Eksekusi berkas `supabase/migration_auth_jamaah_instansi_kelompok.sql`.

3. **Konfigurasi Supabase Auth**:
   - Buka *Authentication ➔ Settings ➔ Providers ➔ Email*.
   - Matikan opsi **Confirm Email** (OFF) agar pendaftaran No WhatsApp Jamaah langsung aktif.

4. **Build Aplikasi**:
   ```bash
   npm run build
   ```
   Hasil build berupa berkas statis teroptimasi di dalam folder `dist/`.

5. **Deploy ke Vercel**:
   - Hubungkan repository GitHub ke Vercel.
   - Masukkan `Environment Variables` yang dibutuhkan.
   - Set Build Command: `npm run build` dan Output Directory: `dist`.

---

## 10. BACKUP GUIDE (PANDUAN CADANGAN DATA)

### A. Automatic & Manual Snapshot via Aplikasi (Super Admin)
1. Masuk sebagai **Super Admin**.
2. Buka menu **Pengaturan Sistem ➔ Backup & Recovery** (`/backup`).
3. Klik tombol **Buat Cadangan Baru**.
4. Sistem akan mengekspor snapshot tabel ke berkas JSON/SQL bersandikan timestamp dan menyimpannya di Supabase Storage / mengunduhnya secara lokal.

### B. Manual Backup via Supabase CLI
```bash
supabase db dump -f backup_siqurban_production.sql --linked
```

---

## 11. RECOVERY GUIDE (PANDUAN PEMULIHAN DATA)

### A. Pemulihan via Menu Admin (`/backup`)
1. Masuk ke menu **Backup & Recovery**.
2. Pada daftar riwayat cadangan, pilih berkas backup yang ingin dipulihkan.
3. Klik tombol **Restore / Pulihkan Data**.
4. Konfirmasikan kata sandi keamanan Super Admin.

### B. Pemulihan Manual via Supabase SQL Editor
1. Buka Supabase Dashboard ➔ **SQL Editor**.
2. Buka berkas `.sql` cadangan yang dimiliki.
3. Jalankan skrip SQL untuk mengembalikan data tabel ke kondisi semula (*rollback/restore*).

---
*Dokumentasi ini diperbarui secara otomatis dan diverifikasi untuk SIQURBAN Meta Production Version.*
