-- =========================================================
-- FASE 5 MODUL 2 — SIQURBAN: Pengetatan RLS Jamaah & RPC
--
-- SIFAT MIGRASI INI: BREAKING UNTUK JAMAAH.
-- Setelah ini jalan, Jamaah HANYA akan bisa melihat:
--   1. Profil anggotanya sendiri
--   2. Tabungannya sendiri
--   3. Transaksinya sendiri
-- Jamaah TIDAK BISA melihat pengeluaran masjid atau data jamaah lain.
-- =========================================================

-- =========================================================
-- 1. HELPER FUNCTION BARU
-- Fungsi aman untuk mengambil `anggota_id` milik user yang
-- sedang login (khusus jamaah).
-- =========================================================
create or replace function public.my_anggota_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select id from public.anggota where user_id = auth.uid() limit 1;
$$;


-- =========================================================
-- 2. PENGETATAN RLS: ANGGOTA, TABUNGAN, TRANSAKSI, PENGELUARAN
-- =========================================================

-- A. ANGGOTA
drop policy if exists "anggota_select_scoped" on public.anggota;
create policy "anggota_select_scoped" on public.anggota
  for select using (
    public.is_super_admin() 
    or (public.is_admin() and instansi_id = public.current_instansi_id())
    or (user_id = auth.uid()) -- Jamaah hanya lihat data dirinya sendiri
  );

-- B. TABUNGAN
drop policy if exists "tabungan_select_scoped" on public.tabungan;
create policy "tabungan_select_scoped" on public.tabungan
  for select using (
    public.is_super_admin() 
    or (public.is_admin() and instansi_id = public.current_instansi_id())
    or (anggota_id = public.my_anggota_id()) -- Jamaah hanya lihat tabungannya sendiri
  );

-- C. TRANSAKSI
drop policy if exists "transaksi_select_scoped" on public.transaksi;
create policy "transaksi_select_scoped" on public.transaksi
  for select using (
    public.is_super_admin() 
    or (public.is_admin() and instansi_id = public.current_instansi_id())
    or (anggota_id = public.my_anggota_id()) -- Jamaah hanya lihat transaksinya sendiri
  );

-- D. PENGELUARAN
drop policy if exists "pengeluaran_select_scoped" on public.pengeluaran;
create policy "pengeluaran_select_scoped" on public.pengeluaran
  for select using (
    public.is_super_admin() 
    or (public.is_admin() and instansi_id = public.current_instansi_id())
    -- Jamaah tidak diizinkan melihat pengeluaran
  );


-- =========================================================
-- 3. REVISI RPC AGREGASI (total_kas_masjid & grafik_setoran_periode)
-- Mengapa diubah? Karena RLS di atas diperketat. Kalau fungsi
-- ini dibiarkan "language sql stable" (tanpa security definer), 
-- saat dipanggil oleh jamaah, fungsi hanya akan menghitung data 
-- yang BISA jamaah lihat (yaitu tabungannya sendiri dan 0 pengeluaran).
-- 
-- Dengan mengubahnya menjadi SECURITY DEFINER, fungsi ini berjalan
-- menembus RLS dan mengembalikan angka agregat yang akurat
-- berdasarkan instansi.
-- =========================================================

-- REWRITE: total_kas_masjid
create or replace function public.total_kas_masjid()
returns numeric
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_instansi_id uuid;
  v_total_tabungan numeric;
  v_total_pengeluaran numeric;
begin
  if public.is_super_admin() then
    select coalesce(sum(saldo), 0) into v_total_tabungan from public.tabungan;
    select coalesce(sum(nominal), 0) into v_total_pengeluaran from public.pengeluaran;
    return v_total_tabungan - v_total_pengeluaran;
  end if;

  v_instansi_id := public.current_instansi_id();
  
  select coalesce(sum(saldo), 0) into v_total_tabungan 
  from public.tabungan 
  where instansi_id = v_instansi_id;
  
  select coalesce(sum(nominal), 0) into v_total_pengeluaran 
  from public.pengeluaran 
  where instansi_id = v_instansi_id;

  return v_total_tabungan - v_total_pengeluaran;
end;
$$;

-- REWRITE: grafik_setoran_periode
create or replace function public.grafik_setoran_periode(p_bulan_mulai date, p_bulan_akhir date)
returns table (bulan text, total numeric)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_instansi_id uuid;
begin
  if public.is_super_admin() then
    return query
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
  else
    v_instansi_id := public.current_instansi_id();
    return query
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
        and t.instansi_id = v_instansi_id
        and date_trunc('month', t.tanggal) = bs.bulan_awal
      group by bs.bulan_awal
      order by bs.bulan_awal;
  end if;
end;
$$;

-- =========================================================
-- 4. REVISI RPC TRANSAKSI (MENGEMBALIKAN PROTEKSI MULTI-TENANT)
-- Menggabungkan parameter 'bukti' (dari migrasi upload foto) dengan
-- proteksi isolasi data 'instansi_id' (dari Fase 2) yang sempat tertimpa.
-- =========================================================

-- REWRITE: catat_setoran
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
  v_anggota_instansi uuid;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mencatat setoran';
  end if;

  if p_nominal <= 0 then
    raise exception 'Nominal setoran harus lebih dari 0';
  end if;

  select instansi_id into v_anggota_instansi from public.anggota where id = p_anggota_id;

  if v_anggota_instansi is null then
    raise exception 'Anggota tidak ditemukan';
  end if;

  if not public.is_super_admin() and v_anggota_instansi <> public.current_instansi_id() then
    raise exception 'Anggota tersebut bukan milik instansi Anda';
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

-- REWRITE: catat_penarikan
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
  v_anggota_instansi uuid;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mencatat penarikan';
  end if;

  if p_nominal <= 0 then
    raise exception 'Nominal penarikan harus lebih dari 0';
  end if;

  select instansi_id into v_anggota_instansi from public.anggota where id = p_anggota_id;

  if v_anggota_instansi is null then
    raise exception 'Anggota tidak ditemukan';
  end if;

  if not public.is_super_admin() and v_anggota_instansi <> public.current_instansi_id() then
    raise exception 'Anggota tersebut bukan milik instansi Anda';
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

-- SELESAI FASE 5 MODUL 2
