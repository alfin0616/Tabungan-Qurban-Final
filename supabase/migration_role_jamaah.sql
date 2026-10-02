-- ---------------------------------------------------------
-- 1. Tambah role 'jamaah' ke admin_profiles
-- ---------------------------------------------------------
alter table public.admin_profiles drop constraint if exists admin_profiles_role_check;
alter table public.admin_profiles add constraint admin_profiles_role_check
  check (role in ('admin', 'superadmin', 'jamaah'));

-- Trigger user baru: ambil role dari user_metadata kalau ada
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
-- 2. Ganti kebijakan RLS: SELECT untuk semua yang login,
--    INSERT/UPDATE/DELETE hanya untuk admin
-- ---------------------------------------------------------
drop policy if exists "anggota_authenticated_all" on public.anggota;
drop policy if exists "anggota_select_authenticated" on public.anggota;
drop policy if exists "anggota_write_admin_only" on public.anggota;
create policy "anggota_select_authenticated" on public.anggota
  for select using (auth.role() = 'authenticated');
create policy "anggota_write_admin_only" on public.anggota
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tabungan_authenticated_all" on public.tabungan;
drop policy if exists "tabungan_select_authenticated" on public.tabungan;
drop policy if exists "tabungan_write_admin_only" on public.tabungan;
create policy "tabungan_select_authenticated" on public.tabungan
  for select using (auth.role() = 'authenticated');
create policy "tabungan_write_admin_only" on public.tabungan
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "transaksi_authenticated_all" on public.transaksi;
drop policy if exists "transaksi_select_authenticated" on public.transaksi;
drop policy if exists "transaksi_write_admin_only" on public.transaksi;
create policy "transaksi_select_authenticated" on public.transaksi
  for select using (auth.role() = 'authenticated');
create policy "transaksi_write_admin_only" on public.transaksi
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pengaturan_authenticated_all" on public.pengaturan;
drop policy if exists "pengaturan_select_authenticated" on public.pengaturan;
drop policy if exists "pengaturan_write_admin_only" on public.pengaturan;
create policy "pengaturan_select_authenticated" on public.pengaturan
  for select using (auth.role() = 'authenticated');
create policy "pengaturan_write_admin_only" on public.pengaturan
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pengeluaran_authenticated_all" on public.pengeluaran;
drop policy if exists "pengeluaran_select_authenticated" on public.pengeluaran;
drop policy if exists "pengeluaran_write_admin_only" on public.pengeluaran;
create policy "pengeluaran_select_authenticated" on public.pengeluaran
  for select using (auth.role() = 'authenticated');
create policy "pengeluaran_write_admin_only" on public.pengeluaran
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------
-- 3. Tambah pengecekan admin di RPC penulisan data
--    (supaya jamaah tidak bisa menulis walau panggil RPC langsung)
-- ---------------------------------------------------------
create or replace function public.catat_setoran(
  p_tanggal date,
  p_anggota_id uuid,
  p_nominal numeric,
  p_metode_pembayaran text,
  p_keterangan text
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

  insert into public.transaksi (anggota_id, jenis, nominal, tanggal, metode_pembayaran, keterangan, created_by)
  values (p_anggota_id, 'setoran', p_nominal, p_tanggal, p_metode_pembayaran, p_keterangan, auth.uid())
  returning * into v_row;

  update public.tabungan set saldo = saldo + p_nominal where anggota_id = p_anggota_id;

  return v_row;
end;
$$;

create or replace function public.catat_penarikan(
  p_tanggal date,
  p_anggota_id uuid,
  p_nominal numeric,
  p_keterangan text
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

  insert into public.transaksi (anggota_id, jenis, nominal, tanggal, keterangan, created_by)
  values (p_anggota_id, 'penarikan', p_nominal, p_tanggal, p_keterangan, auth.uid())
  returning * into v_row;

  update public.tabungan set saldo = saldo - p_nominal where anggota_id = p_anggota_id;

  return v_row;
end;
$$;

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

-- ---------------------------------------------------------
-- 4. Fungsi baru: grafik setoran periode tetap (Juli 2026 - April 2027)
-- ---------------------------------------------------------
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

-- ---------------------------------------------------------
-- 5. Fungsi baru: total kas keseluruhan (saldo tabungan - pengeluaran)
-- ---------------------------------------------------------
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
-- CATATAN: MEMBUAT AKUN JAMAAH (READ-ONLY)
-- =========================================================
-- Buat user seperti biasa lewat Authentication > Users > Add user,
-- lalu jalankan (ganti UUID sesuai user yang baru dibuat):
--
--   update public.admin_profiles set role = 'jamaah'
--   where id = 'uuid-user-tersebut';
--
-- Cara lihat UUID user: Authentication > Users, klik usernya,
-- UUID ada di bagian atas detail user.
-- =========================================================
