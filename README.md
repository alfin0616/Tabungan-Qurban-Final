# SIQURBAN — Tabungan Qurban

Aplikasi web admin untuk mengelola tabungan qurban jamaah masjid — data anggota, rekening tabungan, setoran/penarikan, pengeluaran operasional, laporan, dan pengaturan instansi.

## Teknologi

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router DOM, React Hook Form, Zod, Axios, TanStack Query, Lucide React, React Hot Toast, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Row Level Security, RPC functions)
- **Font:** Poppins
- **Tema warna:** Emerald (primary), Slate (secondary), status Success/Warning/Danger — mendukung mode terang & gelap

## 1. Persiapan Supabase (Project Baru)

Kalau kamu baru mulai dari nol, ikuti urutan ini:

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan seluruh isi file `supabase/schema.sql`. Skrip ini membuat:
   - Tabel `admin_profiles` (role `admin`/`superadmin`/`jamaah`), `anggota`, `tabungan`, `transaksi` (termasuk kolom `bukti` foto), `pengaturan`, `pengeluaran`
   - Trigger auto-generate `kode_anggota` (format `ANG-0001`)
   - Trigger otomatis membuat `admin_profiles` saat user baru mendaftar
   - Row Level Security: **SELECT** boleh untuk siapa pun yang login (admin & jamaah), **INSERT/UPDATE/DELETE** hanya untuk admin
   - Kebijakan Storage RLS supaya tombol upload foto benar-benar berfungsi
   - RPC function: `catat_setoran`, `catat_penarikan`, `hapus_transaksi`, `anggota_belum_setor_bulan_ini`, `grafik_setoran_periode`, `total_kas_masjid`, `is_admin`
3. Buka **Storage**, buat 5 bucket berikut dan set sebagai **Public**:
   - `foto-anggota`
   - `avatars`
   - `pengaturan`
   - `pengeluaran-bukti`
   - `bukti-transaksi`
4. Buka **Authentication > Providers**, pastikan **Email** provider aktif.
5. Buat admin pertama lewat **Authentication > Users > Add user** (isi email & password). Baris `admin_profiles` akan otomatis terbuat oleh trigger dengan role `admin`.
6. Salin **Project URL** dan **anon public key** dari **Project Settings > API**.

## 2. Konfigurasi Environment

Salin `.env.example` menjadi `.env` lalu isi:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

## 3. Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`, lalu login menggunakan akun admin yang dibuat di langkah 1.5.

Build untuk produksi:

```bash
npm run build
npm run preview
```

## 4. Fitur Utama

- **Login**: email/password via Supabase Auth, "Ingat Saya", reset password via email, logout.
- **Role Admin & Jamaah**: admin punya akses penuh (CRUD); jamaah hanya bisa **melihat** — tidak bisa tambah/edit/hapus apa pun, ditegakkan di level database (RLS), bukan cuma disembunyikan di tampilan.
- **Dashboard**: total anggota, total saldo (setelah dikurangi pengeluaran operasional), setoran bulan ini, pengeluaran bulan ini, jumlah transaksi, grafik setoran periode Juli 2026 – April 2027, target qurban (progress ring), notifikasi anggota yang belum setor.
- **Data Anggota**: CRUD lengkap, upload foto, pencarian & filter status, pagination server-side, import & export Excel. *(khusus admin untuk tambah/edit/hapus/import)*
- **Tabungan**: daftar rekening per anggota (saldo, target, progres), total kas setelah pengeluaran, pengaturan target per anggota. *(atur target khusus admin)*
- **Transaksi**: form Setoran (metode pembayaran + upload bukti foto) & Penarikan (validasi saldo cukup + upload bukti foto), cetak bukti transaksi PDF, riwayat transaksi dengan filter tanggal/anggota/jenis, detail (termasuk foto bukti), dan hapus (saldo otomatis disesuaikan kembali). *(khusus admin)*
- **Pengeluaran Operasional**: pencatatan kas keluar masjid yang **mengurangi total saldo/kas** di dashboard, tapi **tidak memotong** saldo tabungan pribadi anggota manapun. Upload bukti nota, filter tanggal/kategori, export Excel. *(khusus admin)*
- **Laporan**: filter periode harian/mingguan/bulanan/tahunan, ringkasan total setoran, penarikan, **pengeluaran operasional**, dan saldo bersih periode, export ke PDF dan Excel.
- **Profil**: ubah nama, foto, dan password — bisa dilakukan admin maupun jamaah untuk akun masing-masing.
- **Pengaturan**: nama instansi, alamat, logo, target qurban keseluruhan, nomor rekening, kontak. *(khusus admin)*
- **Mode Gelap**: toggle di navbar, preferensi tersimpan di perangkat.
- **Keamanan**: Supabase Auth (password tidak disimpan manual), Row Level Security per-role, validasi form dengan Zod, protected routes, refresh token otomatis.

## 5. Update untuk Project Supabase yang Sudah Ada

Kalau kamu sudah pernah menjalankan `schema.sql` versi lama, **jangan run ulang seluruh `schema.sql`** — jalankan file migrasi berikut secara **berurutan** di SQL Editor:

1. `supabase/migration_pengeluaran.sql` — menambahkan fitur Pengeluaran Operasional
2. `supabase/migration_role_jamaah.sql` — menambahkan role Jamaah (read-only), grafik periode tetap (Juli 2026–April 2027), dan total kas terintegrasi pengeluaran
3. `supabase/migration_upload_foto.sql` — mengaktifkan kebijakan Storage RLS supaya upload foto benar-benar berfungsi, dan menambah kolom foto bukti pada transaksi
4. `supabase/migration_saas_fase1_instansi_kelompok.sql` — **(Fase 1 SaaS)** menambahkan tabel `instansi` & `kelompok`, kolom relasi multi-tenant di tabel lama, migrasi otomatis data existing jadi instansi+kelompok default. ⚠️ **Sifatnya non-breaking** — aplikasi yang sedang berjalan tetap berfungsi normal setelahnya (lihat komentar di dalam file untuk detail). Tetap disarankan **backup database dulu** (Database → Backups di dashboard Supabase) sebelum menjalankan, sebagai kebiasaan aman untuk migrasi struktural.

Kalau kamu sudah menjalankan sebagian file di atas dari sesi sebelumnya, aman untuk dijalankan ulang (semua migrasi memakai `create or replace` / `drop policy if exists`).

Setelah itu:

4. Buka **Storage**, pastikan bucket `bukti-transaksi` sudah dibuat (Public) — bucket lain seharusnya sudah ada dari sebelumnya.
5. Ganti seluruh isi folder `src/` di project lokal kamu dengan yang ada di zip terbaru.
6. Restart `npm run dev`.

### Membuat akun Jamaah (read-only)

1. **Authentication > Users > Add user**, isi email & password.
2. Kalau ada kolom **User Metadata** (JSON), isi: `{"role": "jamaah"}` — role otomatis benar sejak awal.
3. Kalau tidak ada kolom metadata saat membuat user, jalankan di SQL Editor (ganti UUID sesuai user yang baru dibuat, dilihat di halaman detail user):
   ```sql
   update public.admin_profiles set role = 'jamaah' where id = 'uuid-user-tersebut';
   ```
4. User jamaah login seperti biasa — sidebar otomatis menyesuaikan (menu Setoran, Penarikan, Pengeluaran Operasional, dan Pengaturan disembunyikan), dan tombol tambah/edit/hapus tidak muncul di halaman manapun.

## 6. Struktur Folder

Struktur mengikuti pemisahan yang diminta: `components/{ui,forms,layout,cards,tables,modal}`, `pages/{auth,dashboard,anggota,tabungan,transaksi,laporan,profile,settings,pengeluaran}`, `hooks/`, `services/`, `lib/`, `context/`, `routes/`, `utils/`.

## 7. Catatan Import Excel Anggota

Format kolom file `.xlsx` yang diimpor (baris pertama = header, boleh diberi nama bebas — yang penting urutannya):

| Nama | Alamat | No HP | Jenis Kelamin (L/P) | Tanggal Bergabung (YYYY-MM-DD) |
|------|--------|-------|----------------------|----------------------------------|

`kode_anggota` akan dibuat otomatis oleh database.

## 8. Troubleshooting: Upload Foto Gagal

Kalau tombol upload foto (anggota/avatar/logo/bukti) muncul error seperti *"new row violates row-level security policy"*, artinya kebijakan Storage RLS belum dijalankan. Jalankan `supabase/migration_upload_foto.sql` di SQL Editor (lihat bagian 5 di atas), lalu pastikan nama bucket di Supabase **persis sama** (huruf kecil semua, pakai tanda `-`) dengan: `foto-anggota`, `avatars`, `pengaturan`, `pengeluaran-bukti`, `bukti-transaksi`.

## 9. Deploy ke Vercel

1. Push project ke GitHub, lalu import repo-nya di [vercel.com](https://vercel.com).
2. Framework preset otomatis terdeteksi sebagai **Vite**.
3. Di **Environment Variables**, tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (nilai sama seperti di `.env` lokal).
4. Deploy seperti biasa.
5. File `vercel.json` di root project sudah berisi rule *rewrite* supaya route seperti `/dashboard`, `/anggota`, dll **tidak lagi 404** saat halaman di-refresh langsung atau diakses via link langsung — wajib ikut ter-deploy (jangan dihapus).

Kalau kamu deploy ulang project yang sebelumnya sudah online dan masih 404 saat refresh, pastikan `vercel.json` benar-benar ter-commit dan Vercel sudah re-deploy versi terbaru (cek tab **Deployments**).

## 10. PWA — Install sebagai Aplikasi

Aplikasi ini sudah dikonfigurasi sebagai **PWA (Progressive Web App)** lewat `vite-plugin-pwa`, jadi pengguna bisa "install" langsung dari browser tanpa App Store/Play Store:

- **Android (Chrome):** buka link app-nya, akan muncul banner "Tambahkan ke layar Utama", atau lewat menu ⋮ → **Install app**.
- **iPhone/iPad (Safari):** buka link app-nya di Safari (bukan Chrome — iOS mewajibkan Safari untuk PWA), tekan tombol **Share/Bagikan** → **Add to Home Screen**. Ikon SIQURBAN akan muncul di home screen dan terbuka tanpa address bar seperti app native.
- **Desktop (Chrome/Edge):** ikon **Install** akan muncul di address bar sebelah kanan.

Catatan teknis: manifest & ikon PWA ada di `public/` (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`). Data selalu diambil langsung dari Supabase secara real-time (tidak di-cache offline) — yang di-cache untuk kecepatan hanya file aplikasi (JS/CSS/gambar), supaya info saldo/tabungan tidak pernah basi.

## 11. Catatan Kompatibilitas iPhone/Safari

Beberapa perbaikan berikut sudah diterapkan supaya pengguna iPhone bisa login dan menggunakan aplikasi dengan lancar:

- Ukuran font input dipaksa minimal 16px di layar kecil, supaya Safari tidak otomatis *zoom-in* saat form difokus (bug umum yang bikin tombol "Masuk" terdorong keluar layar).
- Tinggi layout memakai `100dvh` (dynamic viewport height), bukan `100vh`, supaya toolbar Safari yang bisa muncul/hilang tidak memotong konten.
- Atribut `autoComplete`, `inputMode`, dan `autoCapitalize` ditambahkan di form login supaya iOS Keychain bisa menyarankan & mengisi email/password secara otomatis.
- Safe-area padding (`env(safe-area-inset-*)`) ditambahkan supaya konten tidak tertutup notch/home indicator saat dibuka sebagai PWA terinstal.

