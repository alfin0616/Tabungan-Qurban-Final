-- ---------------------------------------------------------
-- 1. SELECT (baca) — semua orang boleh baca (foto ditampilkan publik)
-- ---------------------------------------------------------
drop policy if exists "storage_public_select" on storage.objects;
create policy "storage_public_select" on storage.objects
  for select
  using (bucket_id in ('foto-anggota', 'avatars', 'pengaturan', 'pengeluaran-bukti', 'bukti-transaksi'));

-- ---------------------------------------------------------
-- 2. AVATARS — foto profil pribadi, boleh diunggah oleh
--    siapa pun yang sudah login (admin maupun jamaah, punya
--    profil sendiri masing-masing)
-- ---------------------------------------------------------
drop policy if exists "storage_avatars_insert" on storage.objects;
drop policy if exists "storage_avatars_update" on storage.objects;
drop policy if exists "storage_avatars_delete" on storage.objects;
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

-- ---------------------------------------------------------
-- 3. FOTO ANGGOTA, LOGO MASJID, BUKTI PENGELUARAN, BUKTI TRANSAKSI
--    — hanya admin yang boleh mengunggah/mengubah/menghapus
-- ---------------------------------------------------------
drop policy if exists "storage_admin_insert" on storage.objects;
drop policy if exists "storage_admin_update" on storage.objects;
drop policy if exists "storage_admin_delete" on storage.objects;
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

-- ---------------------------------------------------------
-- 4. Tambah kolom bukti foto untuk transaksi setoran/penarikan
-- ---------------------------------------------------------
alter table public.transaksi add column if not exists bukti text;

-- Perbarui RPC agar menerima & menyimpan bukti foto
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

  update public.tabungan set saldo = saldo + p_nominal where anggota_id = p_anggota_id;

  return v_row;
end;
$$;

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

  update public.tabungan set saldo = saldo - p_nominal where anggota_id = p_anggota_id;

  return v_row;
end;
$$;

-- =========================================================
-- Kalau bucket "bukti-transaksi" belum ada, buat lewat
-- Dashboard > Storage > New bucket, set sebagai Public.
-- =========================================================
