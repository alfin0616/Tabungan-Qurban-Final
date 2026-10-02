create extension if not exists "pgcrypto";

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
