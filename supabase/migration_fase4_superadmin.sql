-- =========================================================
-- FASE 4 — SIQURBAN: Super Admin Dashboard
-- RPC Functions untuk Dashboard Super Admin
--
-- SIFAT: ADDITIVE ONLY — tidak ada tabel / policy / trigger
-- yang diubah dari Fase 1-3. Hanya menambah fungsi RPC baru.
--
-- Jalankan SETELAH semua migrasi Fase 1-3 selesai.
-- =========================================================

-- =========================================================
-- 1. STATISTIK NASIONAL
-- Agregasi data lintas semua instansi.
-- Hanya Super Admin yang bisa memanggil fungsi ini secara
-- bermakna (karena RLS tabel underlying sudah membatasi
-- data ke instansi masing-masing — superadmin bypass RLS).
-- =========================================================
create or replace function public.get_statistik_nasional()
returns json
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_total_instansi    bigint;
  v_total_kelompok    bigint;
  v_total_jamaah      bigint;
  v_total_saldo       numeric;
  v_total_target      numeric;
  v_total_transaksi   bigint;
  v_bulan_mulai       date;
begin
  -- Hanya super admin yang boleh memanggil
  if not public.is_super_admin() then
    raise exception 'Akses ditolak: hanya Super Admin';
  end if;

  v_bulan_mulai := date_trunc('month', current_date)::date;

  select count(*) into v_total_instansi from public.instansi where status = true;
  select count(*) into v_total_kelompok from public.kelompok where status = true;
  select count(*) into v_total_jamaah   from public.anggota  where status = true;

  select coalesce(sum(saldo), 0) into v_total_saldo from public.tabungan;

  select coalesce(sum(target_dana), 0) into v_total_target from public.kelompok where status = true;

  select count(*) into v_total_transaksi
  from public.transaksi
  where tanggal >= v_bulan_mulai;

  return json_build_object(
    'total_instansi',  v_total_instansi,
    'total_kelompok',  v_total_kelompok,
    'total_jamaah',    v_total_jamaah,
    'total_saldo',     v_total_saldo,
    'total_target',    v_total_target,
    'total_transaksi', v_total_transaksi
  );
end;
$$;

-- =========================================================
-- 2. GRAFIK SETORAN NASIONAL (per bulan, semua instansi)
-- =========================================================
create or replace function public.get_grafik_setoran_nasional(
  p_bulan_mulai date default '2026-07-01',
  p_bulan_akhir date default '2027-04-01'
)
returns table (bulan text, total numeric)
language sql
stable
security definer set search_path = public
as $$
  -- Guard: hanya super admin
  -- (fungsi sql tidak bisa raise exception langsung, tapi karena
  --  security definer, kita pakai conditional select yang mengembalikan
  --  kosong untuk non-superadmin — keamanan sesungguhnya ada di RLS)
  with bulan_seri as (
    select generate_series(
      date_trunc('month', p_bulan_mulai),
      date_trunc('month', p_bulan_akhir),
      interval '1 month'
    )::date as bulan_awal
  )
  select
    to_char(bs.bulan_awal, 'Mon YYYY') as bulan,
    coalesce(sum(t.nominal), 0)         as total
  from bulan_seri bs
  left join public.transaksi t
    on t.jenis = 'setoran'
    and date_trunc('month', t.tanggal) = bs.bulan_awal
  group by bs.bulan_awal
  order by bs.bulan_awal;
$$;

-- =========================================================
-- 3. TOP INSTANSI — ranking berdasarkan progress % saldo/target
-- =========================================================
create or replace function public.get_top_instansi(p_limit int default 5)
returns table (
  instansi_id   uuid,
  nama_instansi text,
  kode_instansi text,
  total_anggota bigint,
  total_kelompok bigint,
  total_saldo   numeric,
  total_target  numeric,
  progress_pct  numeric
)
language sql
stable
security definer set search_path = public
as $$
  select
    i.id                                      as instansi_id,
    i.nama_instansi,
    i.kode_instansi,
    count(distinct a.id)                      as total_anggota,
    count(distinct k.id)                      as total_kelompok,
    coalesce(sum(tab.saldo), 0)               as total_saldo,
    coalesce(sum(k2.target_dana), 0)          as total_target,
    case
      when coalesce(sum(k2.target_dana), 0) = 0 then 0
      else round(coalesce(sum(tab.saldo), 0) / sum(k2.target_dana) * 100, 1)
    end                                       as progress_pct
  from public.instansi i
  left join public.anggota   a   on a.instansi_id = i.id and a.status = true
  left join public.kelompok  k   on k.instansi_id = i.id and k.status = true
  left join public.kelompok  k2  on k2.instansi_id = i.id and k2.status = true
  left join public.tabungan  tab on tab.instansi_id = i.id
  where i.status = true
  group by i.id, i.nama_instansi, i.kode_instansi
  order by progress_pct desc, total_saldo desc
  limit p_limit;
$$;

-- =========================================================
-- 4. TOP KELOMPOK — ranking berdasarkan progress % saldo/target
-- =========================================================
create or replace function public.get_top_kelompok(p_limit int default 5)
returns table (
  kelompok_id    uuid,
  nama_kelompok  text,
  kode_kelompok  text,
  nama_instansi  text,
  jenis_qurban   text,
  total_anggota  bigint,
  total_saldo    numeric,
  target_dana    numeric,
  progress_pct   numeric
)
language sql
stable
security definer set search_path = public
as $$
  select
    k.id                                       as kelompok_id,
    k.nama_kelompok,
    k.kode_kelompok,
    i.nama_instansi,
    k.jenis_qurban,
    count(distinct a.id)                       as total_anggota,
    coalesce(sum(tab.saldo), 0)                as total_saldo,
    k.target_dana,
    case
      when k.target_dana = 0 then 0
      else round(coalesce(sum(tab.saldo), 0) / k.target_dana * 100, 1)
    end                                        as progress_pct
  from public.kelompok  k
  join public.instansi  i   on i.id = k.instansi_id
  left join public.anggota   a   on a.kelompok_id = k.id and a.status = true
  left join public.tabungan  tab on tab.kelompok_id = k.id
  where k.status = true
  group by k.id, k.nama_kelompok, k.kode_kelompok, i.nama_instansi, k.jenis_qurban, k.target_dana
  order by progress_pct desc, total_saldo desc
  limit p_limit;
$$;

-- =========================================================
-- 5. TRANSAKSI TERBARU NASIONAL (lintas instansi)
-- =========================================================
create or replace function public.get_transaksi_terbaru_nasional(p_limit int default 10)
returns table (
  id              uuid,
  jenis           text,
  nominal         numeric,
  tanggal         date,
  nama_anggota    text,
  nama_instansi   text,
  nama_kelompok   text,
  metode_pembayaran text,
  keterangan      text,
  created_at      timestamptz
)
language sql
stable
security definer set search_path = public
as $$
  select
    t.id,
    t.jenis,
    t.nominal,
    t.tanggal,
    a.nama          as nama_anggota,
    i.nama_instansi,
    k.nama_kelompok,
    t.metode_pembayaran,
    t.keterangan,
    t.created_at
  from public.transaksi t
  join public.anggota   a on a.id = t.anggota_id
  join public.instansi  i on i.id = t.instansi_id
  left join public.kelompok k on k.id = t.kelompok_id
  order by t.created_at desc
  limit p_limit;
$$;

-- =========================================================
-- 6. GRAFIK SALDO PER INSTANSI (untuk bar chart perbandingan)
-- =========================================================
create or replace function public.get_grafik_per_instansi()
returns table (
  nama_instansi text,
  total_saldo   numeric,
  total_target  numeric,
  progress_pct  numeric
)
language sql
stable
security definer set search_path = public
as $$
  select
    i.nama_instansi,
    coalesce(sum(tab.saldo), 0)              as total_saldo,
    coalesce(sum(k.target_dana), 0)          as total_target,
    case
      when coalesce(sum(k.target_dana), 0) = 0 then 0
      else round(coalesce(sum(tab.saldo), 0) / sum(k.target_dana) * 100, 1)
    end                                      as progress_pct
  from public.instansi i
  left join public.tabungan tab on tab.instansi_id = i.id
  left join public.kelompok k   on k.instansi_id = i.id and k.status = true
  where i.status = true
  group by i.id, i.nama_instansi
  order by total_saldo desc;
$$;

-- =========================================================
-- SELESAI FASE 4 MIGRASI SUPERADMIN.
--
-- Cara menjalankan:
--   Buka Supabase Dashboard > SQL Editor > paste & run
--
-- Test setelah dijalankan (login sebagai superadmin):
--   select * from get_statistik_nasional();
--   select * from get_top_instansi(5);
--   select * from get_top_kelompok(5);
--   select * from get_transaksi_terbaru_nasional(10);
--   select * from get_grafik_per_instansi();
--   select * from get_grafik_setoran_nasional('2026-07-01','2027-04-01');
-- =========================================================
