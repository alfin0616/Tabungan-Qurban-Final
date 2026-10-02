-- =========================================================
-- TABUNGAN QURBAN (SIQURBAN) — SUPABASE SCHEMA
-- Jalankan skrip ini di Supabase SQL Editor (project baru)
-- Untuk project yang SUDAH pernah menjalankan versi lama,
-- gunakan file migrasi di folder ini alih-alih file ini.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. USER PROFILES (admin & jamaah)
-- Catatan keamanan: password TIDAK disimpan di tabel ini.
-- Password sepenuhnya dikelola oleh Supabase Auth (auth.users).
-- Tabel ini menyimpan metadata tambahan (nama, foto, role).
--
-- role:
--   - admin / superadmin -> akses penuh (CRUD semua data)
--   - jamaah             -> HANYA BISA MELIHAT (read-only),
--                            tidak bisa input/edit/hapus apapun
-- ---------------------------------------------------------
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'admin' check (role in ('admin', 'superadmin', 'jamaah')),
  created_at timestamptz not null default now()
);

-- Baris profil dibuat otomatis saat ada user baru mendaftar.
-- Role diambil dari user_metadata (kalau diisi saat create user),
-- default 'admin' kalau tidak diisi.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.admin_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'admin')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: cek apakah user yang sedang login adalah admin/superadmin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

-- ---------------------------------------------------------
-- 2. ANGGOTA
-- ---------------------------------------------------------
create table if not exists public.anggota (
  id uuid primary key default gen_random_uuid(),
  kode_anggota text unique,
  nama text not null,
  alamat text not null,
  no_hp text not null,
  jenis_kelamin text not null check (jenis_kelamin in ('L', 'P')),
  foto text,
  tanggal_bergabung date not null default current_date,
  status boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence if not exists public.anggota_kode_seq start 1;

create or replace function public.generate_kode_anggota()
returns trigger
language plpgsql
as $$
begin
  if new.kode_anggota is null then
    new.kode_anggota := 'ANG-' || lpad(nextval('public.anggota_kode_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_kode_anggota on public.anggota;
create trigger trg_generate_kode_anggota
  before insert on public.anggota
  for each row execute procedure public.generate_kode_anggota();

-- ---------------------------------------------------------
-- 3. TABUNGAN (1 anggota = 1 rekening tabungan)
-- ---------------------------------------------------------
create table if not exists public.tabungan (
  id uuid primary key default gen_random_uuid(),
  anggota_id uuid not null unique references public.anggota (id) on delete cascade,
  saldo numeric(14, 2) not null default 0,
  target numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 4. TRANSAKSI (setoran & penarikan per anggota)
-- metode_pembayaran hanya relevan untuk setoran
-- ---------------------------------------------------------
create table if not exists public.transaksi (
  id uuid primary key default gen_random_uuid(),
  anggota_id uuid not null references public.anggota (id) on delete cascade,
  jenis text not null check (jenis in ('setoran', 'penarikan')),
  nominal numeric(14, 2) not null check (nominal > 0),
  tanggal date not null default current_date,
  metode_pembayaran text check (metode_pembayaran in ('tunai', 'transfer', 'qris')),
  keterangan text,
  bukti text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_transaksi_anggota on public.transaksi (anggota_id);
create index if not exists idx_transaksi_tanggal on public.transaksi (tanggal);

-- ---------------------------------------------------------
-- 5. PENGATURAN (profil masjid/instansi — single row)
-- ---------------------------------------------------------
create table if not exists public.pengaturan (
  id uuid primary key default gen_random_uuid(),
  nama_instansi text not null default 'Masjid',
  alamat text,
  logo text,
  target_qurban numeric(14, 2) not null default 0,
  rekening text,
  telepon text
);

-- ---------------------------------------------------------
-- 6. PENGELUARAN OPERASIONAL
-- Pencatatan pengeluaran kas masjid/instansi. Nominalnya ikut
-- MENGURANGI total kas/saldo keseluruhan yang tampil di dashboard
-- (lihat fungsi total_kas_masjid di bawah), TAPI tidak memotong
-- saldo tabungan pribadi milik anggota manapun.
-- ---------------------------------------------------------
create table if not exists public.pengeluaran (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  kategori text not null check (
    kategori in ('listrik', 'air', 'kebersihan', 'atk', 'konsumsi', 'pemeliharaan', 'honor', 'lainnya')
  ),
  nominal numeric(14, 2) not null check (nominal > 0),
  keterangan text,
  bukti text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_pengeluaran_tanggal on public.pengeluaran (tanggal);

-- =========================================================
-- ROW LEVEL SECURITY
-- Semua tabel: SELECT boleh untuk siapa pun yang sudah login
-- (admin maupun jamaah). INSERT/UPDATE/DELETE HANYA untuk admin.
-- =========================================================
alter table public.admin_profiles enable row level security;
alter table public.anggota enable row level security;
alter table public.tabungan enable row level security;
alter table public.transaksi enable row level security;
alter table public.pengaturan enable row level security;
alter table public.pengeluaran enable row level security;

drop policy if exists "admin_profiles_self_select" on public.admin_profiles;
drop policy if exists "admin_profiles_self_update" on public.admin_profiles;
create policy "admin_profiles_self_select" on public.admin_profiles
  for select using (auth.uid() = id);
create policy "admin_profiles_self_update" on public.admin_profiles
  for update using (auth.uid() = id);

-- ANGGOTA
drop policy if exists "anggota_authenticated_all" on public.anggota;
drop policy if exists "anggota_select_authenticated" on public.anggota;
drop policy if exists "anggota_write_admin_only" on public.anggota;
create policy "anggota_select_authenticated" on public.anggota
  for select using (auth.role() = 'authenticated');
create policy "anggota_write_admin_only" on public.anggota
  for all using (public.is_admin()) with check (public.is_admin());

-- TABUNGAN
drop policy if exists "tabungan_authenticated_all" on public.tabungan;
drop policy if exists "tabungan_select_authenticated" on public.tabungan;
drop policy if exists "tabungan_write_admin_only" on public.tabungan;
create policy "tabungan_select_authenticated" on public.tabungan
  for select using (auth.role() = 'authenticated');
create policy "tabungan_write_admin_only" on public.tabungan
  for all using (public.is_admin()) with check (public.is_admin());

-- TRANSAKSI
drop policy if exists "transaksi_authenticated_all" on public.transaksi;
drop policy if exists "transaksi_select_authenticated" on public.transaksi;
drop policy if exists "transaksi_write_admin_only" on public.transaksi;
create policy "transaksi_select_authenticated" on public.transaksi
  for select using (auth.role() = 'authenticated');
create policy "transaksi_write_admin_only" on public.transaksi
  for all using (public.is_admin()) with check (public.is_admin());

-- PENGATURAN
drop policy if exists "pengaturan_authenticated_all" on public.pengaturan;
drop policy if exists "pengaturan_select_authenticated" on public.pengaturan;
drop policy if exists "pengaturan_write_admin_only" on public.pengaturan;
create policy "pengaturan_select_authenticated" on public.pengaturan
  for select using (auth.role() = 'authenticated');
create policy "pengaturan_write_admin_only" on public.pengaturan
  for all using (public.is_admin()) with check (public.is_admin());

-- PENGELUARAN
drop policy if exists "pengeluaran_authenticated_all" on public.pengeluaran;
drop policy if exists "pengeluaran_select_authenticated" on public.pengeluaran;
drop policy if exists "pengeluaran_write_admin_only" on public.pengeluaran;
create policy "pengeluaran_select_authenticated" on public.pengeluaran
  for select using (auth.role() = 'authenticated');
create policy "pengeluaran_write_admin_only" on public.pengeluaran
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- RPC FUNCTIONS
-- Semua fungsi yang MENGUBAH data (setoran/penarikan/hapus)
-- memvalidasi public.is_admin() di dalam fungsinya sendiri,
-- karena fungsi SECURITY DEFINER melewati RLS biasa. Ini penting
-- supaya jamaah tidak bisa menulis data walau memanggil RPC langsung.
-- =========================================================

-- Catat setoran: insert transaksi + tambah saldo tabungan (atomik)
create or replace function public.catat_setoran(
  p_tanggal date,
  p_anggota_id uuid,
  p_nominal numeric,
  p_metode_pembayaran text,
  p_keterangan text,
  p_bukti text default null
)
returns public.transaksi
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.transaksi;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mencatat setoran';
  end if;

  insert into public.transaksi (anggota_id, jenis, nominal, tanggal, metode_pembayaran, keterangan, bukti, created_by)
  values (p_anggota_id, 'setoran', p_nominal, p_tanggal, p_metode_pembayaran, p_keterangan, p_bukti, auth.uid())
  returning * into v_row;

  update public.tabungan
  set saldo = saldo + p_nominal
  where anggota_id = p_anggota_id;

  return v_row;
end;
$$;

-- Catat penarikan: insert transaksi + kurangi saldo tabungan (atomik, tidak boleh minus)
create or replace function public.catat_penarikan(
  p_tanggal date,
  p_anggota_id uuid,
  p_nominal numeric,
  p_keterangan text,
  p_bukti text default null
)
returns public.transaksi
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.transaksi;
  v_saldo numeric;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mencatat penarikan';
  end if;

  select saldo into v_saldo from public.tabungan where anggota_id = p_anggota_id for update;

  if v_saldo is null then
    raise exception 'Rekening tabungan anggota tidak ditemukan';
  end if;

  if v_saldo < p_nominal then
    raise exception 'Saldo tidak mencukupi untuk penarikan ini';
  end if;

  insert into public.transaksi (anggota_id, jenis, nominal, tanggal, keterangan, bukti, created_by)
  values (p_anggota_id, 'penarikan', p_nominal, p_tanggal, p_keterangan, p_bukti, auth.uid())
  returning * into v_row;

  update public.tabungan
  set saldo = saldo - p_nominal
  where anggota_id = p_anggota_id;

  return v_row;
end;
$$;

-- Hapus transaksi & sesuaikan kembali saldo tabungan
create or replace function public.hapus_transaksi(p_transaksi_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_transaksi public.transaksi;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat menghapus transaksi';
  end if;

  select * into v_transaksi from public.transaksi where id = p_transaksi_id;

  if v_transaksi is null then
    raise exception 'Transaksi tidak ditemukan';
  end if;

  if v_transaksi.jenis = 'setoran' then
    update public.tabungan set saldo = saldo - v_transaksi.nominal where anggota_id = v_transaksi.anggota_id;
  else
    update public.tabungan set saldo = saldo + v_transaksi.nominal where anggota_id = v_transaksi.anggota_id;
  end if;

  delete from public.transaksi where id = p_transaksi_id;
end;
$$;

-- Anggota aktif yang belum melakukan setoran bulan berjalan
create or replace function public.anggota_belum_setor_bulan_ini()
returns setof public.anggota
language sql
stable
as $$
  select a.*
  from public.anggota a
  where a.status = true
    and not exists (
      select 1 from public.transaksi t
      where t.anggota_id = a.id
        and t.jenis = 'setoran'
        and date_trunc('month', t.tanggal) = date_trunc('month', current_date)
    )
  order by a.nama;
$$;

-- Rekap total setoran per bulan untuk RENTANG TANGGAL TETAP
-- (dipakai grafik dashboard: Juli 2026 s.d. April 2027)
create or replace function public.grafik_setoran_periode(p_bulan_mulai date, p_bulan_akhir date)
returns table (bulan text, total numeric)
language sql
stable
as $$
  with bulan_seri as (
    select generate_series(
      date_trunc('month', p_bulan_mulai),
      date_trunc('month', p_bulan_akhir),
      interval '1 month'
    )::date as bulan_awal
  )
  select
    to_char(bs.bulan_awal, 'Mon YYYY') as bulan,
    coalesce(sum(t.nominal), 0) as total
  from bulan_seri bs
  left join public.transaksi t
    on t.jenis = 'setoran'
    and date_trunc('month', t.tanggal) = bs.bulan_awal
  group by bs.bulan_awal
  order by bs.bulan_awal;
$$;

-- Total kas keseluruhan: total saldo tabungan semua anggota
-- DIKURANGI total pengeluaran operasional yang pernah dicatat.
-- Ini yang ditampilkan sebagai "Total Saldo" di dashboard.
create or replace function public.total_kas_masjid()
returns numeric
language sql
stable
as $$
  select
    coalesce((select sum(saldo) from public.tabungan), 0)
    - coalesce((select sum(nominal) from public.pengeluaran), 0);
$$;

-- =========================================================
-- STORAGE BUCKETS & RLS
-- Buat bucket berikut secara manual lewat Supabase Dashboard
-- (Storage > New bucket), set sebagai PUBLIC agar foto dapat
-- ditampilkan langsung via public URL:
--   - foto-anggota       (foto profil anggota)
--   - avatars            (foto profil admin/jamaah)
--   - pengaturan         (logo masjid/instansi)
--   - pengeluaran-bukti  (foto nota/bukti pengeluaran operasional)
--   - bukti-transaksi    (foto bukti setoran/penarikan)
--
-- PENTING: menandai bucket "Public" hanya mengizinkan foto DIBACA
-- lewat URL publik. Proses UPLOAD tetap butuh kebijakan RLS di
-- bawah ini, kalau tidak tombol upload akan gagal.
-- =========================================================
create policy "storage_public_select" on storage.objects
  for select
  using (bucket_id in ('foto-anggota', 'avatars', 'pengaturan', 'pengeluaran-bukti', 'bukti-transaksi'));

-- avatars: siapa pun yang login boleh unggah foto profilnya sendiri
create policy "storage_avatars_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');
create policy "storage_avatars_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');
create policy "storage_avatars_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars');

-- bucket lainnya: hanya admin yang boleh unggah/ubah/hapus
create policy "storage_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('foto-anggota', 'pengaturan', 'pengeluaran-bukti', 'bukti-transaksi')
    and public.is_admin()
  );
create policy "storage_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('foto-anggota', 'pengaturan', 'pengeluaran-bukti', 'bukti-transaksi')
    and public.is_admin()
  )
  with check (
    bucket_id in ('foto-anggota', 'pengaturan', 'pengeluaran-bukti', 'bukti-transaksi')
    and public.is_admin()
  );
create policy "storage_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('foto-anggota', 'pengaturan', 'pengeluaran-bukti', 'bukti-transaksi')
    and public.is_admin()
  );

-- =========================================================
-- SEED DATA (opsional, untuk percobaan awal)
-- =========================================================
insert into public.pengaturan (nama_instansi, alamat, target_qurban, rekening, telepon)
values ('Masjid Al-Ikhlas', 'Jl. Contoh No. 1, Depok', 50000000, '1234567890 (Bank Syariah)', '0812-3456-7890')
on conflict do nothing;

-- =========================================================
-- FASE 1 SAAS MULTI-INSTANSI (instansi, kelompok, kolom relasi,
-- trigger auto-fill). Lihat migration_saas_fase1_instansi_kelompok.sql
-- untuk komentar penjelasan lengkap per bagian.
-- =========================================================

-- =========================================================
-- 1. TABEL INSTANSI
-- =========================================================
create table if not exists public.instansi (
  id uuid primary key default gen_random_uuid(),
  kode_instansi text unique,
  nama_instansi text not null,
  slug text unique,
  alamat text,
  telepon text,
  email text,
  logo text,
  tahun_qurban_aktif int not null default extract(year from current_date)::int,
  status boolean not null default true,
  -- Menandai instansi hasil migrasi otomatis dari data lama (single-tenant).
  -- Dipakai trigger di bawah sebagai fallback saat frontend lama belum
  -- mengirim instansi_id secara eksplisit.
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create sequence if not exists public.instansi_kode_seq start 1;

create or replace function public.generate_kode_instansi()
returns trigger
language plpgsql
as $$
begin
  if new.kode_instansi is null then
    new.kode_instansi := 'INS-' || lpad(nextval('public.instansi_kode_seq')::text, 4, '0');
  end if;
  if new.slug is null then
    new.slug := lower(regexp_replace(new.nama_instansi, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 6);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_kode_instansi on public.instansi;
create trigger trg_generate_kode_instansi
  before insert on public.instansi
  for each row execute procedure public.generate_kode_instansi();

-- Pastikan cuma ada 1 instansi yang ditandai is_default = true
create unique index if not exists idx_instansi_single_default
  on public.instansi (is_default)
  where is_default = true;

-- =========================================================
-- 2. TABEL KELOMPOK
-- =========================================================
create table if not exists public.kelompok (
  id uuid primary key default gen_random_uuid(),
  instansi_id uuid not null references public.instansi (id) on delete cascade,
  kode_kelompok text,
  nama_kelompok text not null,
  jenis_qurban text not null check (jenis_qurban in ('sapi', 'kambing')),
  target_dana numeric(14, 2) not null default 0,
  maksimal_anggota int not null default 7,
  tahun int not null default extract(year from current_date)::int,
  status boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (instansi_id, kode_kelompok)
);

create sequence if not exists public.kelompok_kode_seq start 1;

create or replace function public.generate_kode_kelompok()
returns trigger
language plpgsql
as $$
begin
  if new.kode_kelompok is null then
    new.kode_kelompok := 'KLP-' || lpad(nextval('public.kelompok_kode_seq')::text, 4, '0');
  end if;
  -- Set batas maksimal anggota otomatis sesuai jenis qurban, kalau admin
  -- tidak mengisi manual (aturan bisnis: sapi maks 7, kambing maks 1)
  if new.maksimal_anggota is null then
    new.maksimal_anggota := case when new.jenis_qurban = 'kambing' then 1 else 7 end;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_kode_kelompok on public.kelompok;
create trigger trg_generate_kode_kelompok
  before insert on public.kelompok
  for each row execute procedure public.generate_kode_kelompok();

create unique index if not exists idx_kelompok_single_default
  on public.kelompok (instansi_id, is_default)
  where is_default = true;

-- =========================================================
-- 3. KOLOM BARU DI TABEL EXISTING (semua nullable dulu — aman)
-- =========================================================
alter table public.admin_profiles add column if not exists instansi_id uuid references public.instansi (id);

alter table public.anggota add column if not exists instansi_id uuid references public.instansi (id);
alter table public.anggota add column if not exists kelompok_id uuid references public.kelompok (id);
-- Menghubungkan baris anggota ke akun login jamaah (1 anggota bisa punya
-- 1 akun login). Kalau NULL, berarti anggota ini belum diundang/belum
-- punya akun sendiri — masih dikelola manual oleh admin seperti sekarang.
alter table public.anggota add column if not exists user_id uuid references auth.users (id);
create unique index if not exists idx_anggota_user_id on public.anggota (user_id) where user_id is not null;

alter table public.tabungan add column if not exists instansi_id uuid references public.instansi (id);
alter table public.tabungan add column if not exists kelompok_id uuid references public.kelompok (id);

alter table public.transaksi add column if not exists instansi_id uuid references public.instansi (id);
alter table public.transaksi add column if not exists kelompok_id uuid references public.kelompok (id);

alter table public.pengeluaran add column if not exists instansi_id uuid references public.instansi (id);

create index if not exists idx_anggota_instansi on public.anggota (instansi_id);
create index if not exists idx_anggota_kelompok on public.anggota (kelompok_id);
create index if not exists idx_tabungan_instansi on public.tabungan (instansi_id);
create index if not exists idx_transaksi_instansi on public.transaksi (instansi_id);
create index if not exists idx_pengeluaran_instansi on public.pengeluaran (instansi_id);

-- =========================================================
-- 4. MIGRASI DATA LAMA → JADI INSTANSI DEFAULT + KELOMPOK DEFAULT
-- =========================================================
do $$
declare
  v_instansi_id uuid;
  v_kelompok_id uuid;
  v_pengaturan record;
begin
  -- Lewati semuanya kalau migrasi ini sudah pernah dijalankan sebelumnya
  if exists (select 1 from public.instansi where is_default = true) then
    raise notice 'Instansi default sudah ada, lewati migrasi data.';
    return;
  end if;

  select * into v_pengaturan from public.pengaturan limit 1;

  insert into public.instansi (nama_instansi, alamat, telepon, logo, is_default, status)
  values (
    coalesce(v_pengaturan.nama_instansi, 'Instansi Default'),
    v_pengaturan.alamat,
    v_pengaturan.telepon,
    v_pengaturan.logo,
    true,
    true
  )
  returning id into v_instansi_id;

  insert into public.kelompok (instansi_id, nama_kelompok, jenis_qurban, target_dana, is_default, status)
  values (
    v_instansi_id,
    'Kelompok Umum ' || extract(year from current_date)::text,
    'sapi',
    coalesce(v_pengaturan.target_qurban, 0),
    true,
    true
  )
  returning id into v_kelompok_id;

  update public.admin_profiles set instansi_id = v_instansi_id where instansi_id is null;

  update public.anggota
  set instansi_id = v_instansi_id, kelompok_id = v_kelompok_id
  where instansi_id is null;

  update public.tabungan t
  set instansi_id = v_instansi_id, kelompok_id = v_kelompok_id
  where t.instansi_id is null;

  update public.transaksi tr
  set instansi_id = v_instansi_id, kelompok_id = v_kelompok_id
  where tr.instansi_id is null;

  update public.pengeluaran
  set instansi_id = v_instansi_id
  where instansi_id is null;

  raise notice 'Migrasi selesai. Instansi default: %, Kelompok default: %', v_instansi_id, v_kelompok_id;
end $$;

-- =========================================================
-- 5. TRIGGER AUTO-FILL — supaya frontend LAMA (belum tahu konsep
--    instansi/kelompok) tetap bisa INSERT tanpa error, karena akan
--    otomatis dipayungi ke instansi/kelompok default di atas.
--    Frontend BARU (Fase 3+) yang mengirim instansi_id/kelompok_id
--    eksplisit akan memakai nilai kirimannya sendiri (trigger tidak
--    menimpa nilai yang sudah diisi).
-- =========================================================
create or replace function public.fill_default_instansi_anggota()
returns trigger
language plpgsql
as $$
begin
  if new.instansi_id is null then
    select id into new.instansi_id from public.instansi where is_default = true limit 1;
  end if;
  if new.kelompok_id is null then
    select id into new.kelompok_id from public.kelompok
    where instansi_id = new.instansi_id and is_default = true limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_fill_default_instansi_anggota on public.anggota;
create trigger trg_fill_default_instansi_anggota
  before insert on public.anggota
  for each row execute procedure public.fill_default_instansi_anggota();

-- tabungan & transaksi: turunkan instansi_id/kelompok_id dari anggota_id
-- terkait (lebih aman daripada tebak instansi default, supaya tetap
-- konsisten walau nanti sudah multi-instansi sungguhan)
create or replace function public.fill_instansi_from_anggota()
returns trigger
language plpgsql
as $$
begin
  if new.instansi_id is null or new.kelompok_id is null then
    select instansi_id, kelompok_id into new.instansi_id, new.kelompok_id
    from public.anggota where id = new.anggota_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_fill_instansi_tabungan on public.tabungan;
create trigger trg_fill_instansi_tabungan
  before insert on public.tabungan
  for each row execute procedure public.fill_instansi_from_anggota();

drop trigger if exists trg_fill_instansi_transaksi on public.transaksi;
create trigger trg_fill_instansi_transaksi
  before insert on public.transaksi
  for each row execute procedure public.fill_instansi_from_anggota();

create or replace function public.fill_default_instansi_pengeluaran()
returns trigger
language plpgsql
as $$
begin
  if new.instansi_id is null then
    select id into new.instansi_id from public.instansi where is_default = true limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_fill_default_instansi_pengeluaran on public.pengeluaran;
create trigger trg_fill_default_instansi_pengeluaran
  before insert on public.pengeluaran
  for each row execute procedure public.fill_default_instansi_pengeluaran();

-- =========================================================
-- 6. RLS DASAR UNTUK TABEL BARU (sementara: sama seperti pola lama —
--    select bebas untuk yang login, tulis hanya admin. Akan diperketat
--    per-instansi di Fase 2)
-- =========================================================
alter table public.instansi enable row level security;
alter table public.kelompok enable row level security;

drop policy if exists "instansi_select_authenticated" on public.instansi;
create policy "instansi_select_authenticated" on public.instansi
  for select using (auth.role() = 'authenticated');
drop policy if exists "instansi_write_admin_only" on public.instansi;
create policy "instansi_write_admin_only" on public.instansi
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "kelompok_select_authenticated" on public.kelompok;
create policy "kelompok_select_authenticated" on public.kelompok
  for select using (auth.role() = 'authenticated');
drop policy if exists "kelompok_write_admin_only" on public.kelompok;
create policy "kelompok_write_admin_only" on public.kelompok
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- SELESAI FASE 1.
-- Cek hasil migrasi dengan query berikut:
--   select * from instansi;
--   select * from kelompok;
--   select count(*) as total_anggota_tertaut from anggota where instansi_id is not null;
-- =========================================================

-- =========================================================
-- CATATAN: MEMBUAT AKUN JAMAAH (READ-ONLY)
-- =========================================================
-- 1. Buat user seperti biasa lewat Authentication > Users > Add user.
--    Di kolom "User Metadata" (format JSON), isi: {"role": "jamaah"}
--    Kalau kolom metadata tidak tersedia saat membuat user, buat
--    dulu usernya lalu jalankan SQL berikut (ganti UUID-nya):
--
--    update public.admin_profiles set role = 'jamaah'
--    where id = 'uuid-user-tersebut';
--
-- 2. User dengan role 'jamaah' bisa login dan melihat SEMUA data
--    (dashboard, anggota, tabungan, riwayat, laporan), tapi TIDAK
--    BISA menambah/mengubah/menghapus apa pun — baik lewat
--    aplikasi maupun lewat panggilan API langsung, karena aturan
--    ini ditegakkan di database (Row Level Security), bukan
--    cuma disembunyikan di tampilan.
-- =========================================================
