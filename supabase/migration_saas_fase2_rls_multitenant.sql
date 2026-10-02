-- =========================================================
-- FASE 2 — SIQURBAN SaaS Multi-Instansi: Isolasi Data (RLS) + RPC
-- Jalankan SETELAH migration_saas_fase1_instansi_kelompok.sql.
--
-- SIFAT MIGRASI INI: SEMI-BREAKING.
-- Setelah ini jalan, admin/jamaah HANYA akan bisa melihat data milik
-- instansi mereka sendiri (bukan lagi lihat semua data seperti sekarang).
-- Karena saat ini baru ada 1 instansi (hasil migrasi Fase 1), efeknya
-- TIDAK TERASA untuk pengguna yang sudah ada — mereka otomatis
-- ter-assign ke instansi itu dan tetap melihat semua data seperti
-- biasa. Baru terasa bedanya begitu ada instansi ke-2.
--
-- CATATAN PENTING soal role: Fase 2 ini BELUM mengganti nilai role
-- ('admin'/'superadmin'/'jamaah') di database — masih sama seperti
-- sekarang supaya aplikasi lama tidak mendadak salah baca izin.
-- Tapi maknanya mulai diperjelas di lapisan RLS ini:
--   - role 'superadmin' -> setara SUPER ADMIN (lihat & kelola SEMUA instansi)
--   - role 'admin'      -> setara ADMIN INSTANSI (hanya instansi miliknya)
--   - role 'jamaah'     -> read-only, di-scope ke instansi miliknya
-- Penggantian nama role & UI Super Admin baru menyusul di Fase 3-4.
-- =========================================================

-- =========================================================
-- 1. HELPER FUNCTIONS
-- =========================================================

-- Setara Super Admin: boleh lihat & kelola LINTAS instansi
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

-- Instansi milik user yang sedang login — dicek dari 2 sumber:
-- 1) admin_profiles.instansi_id (untuk admin/superadmin)
-- 2) anggota.instansi_id lewat anggota.user_id (untuk jamaah yang
--    login sebagai dirinya sendiri, bukan lewat akun admin)
-- HARUS security definer supaya query internalnya tidak memicu
-- rekursi RLS (karena nanti dipakai DI DALAM policy RLS tabel lain).
create or replace function public.current_instansi_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select instansi_id from public.admin_profiles where id = auth.uid()),
    (select instansi_id from public.anggota where user_id = auth.uid())
  );
$$;

-- =========================================================
-- 2. RLS: INSTANSI
-- Super Admin lihat & kelola semua. Admin Instansi hanya boleh lihat
-- & UPDATE (bukan insert/delete) profil instansinya sendiri — sesuai
-- hak akses "Profil Instansi" di dokumen. Bikin/hapus instansi baru
-- tetap eksklusif Super Admin.
-- =========================================================
drop policy if exists "instansi_select_authenticated" on public.instansi;
drop policy if exists "instansi_write_admin_only" on public.instansi;
drop policy if exists "instansi_select_scoped" on public.instansi;
drop policy if exists "instansi_update_own_or_super" on public.instansi;
drop policy if exists "instansi_insert_super_admin" on public.instansi;
drop policy if exists "instansi_delete_super_admin" on public.instansi;

create policy "instansi_select_scoped" on public.instansi
  for select using (public.is_super_admin() or id = public.current_instansi_id());

create policy "instansi_update_own_or_super" on public.instansi
  for update
  using (public.is_super_admin() or (public.is_admin() and id = public.current_instansi_id()))
  with check (public.is_super_admin() or (public.is_admin() and id = public.current_instansi_id()));

create policy "instansi_insert_super_admin" on public.instansi
  for insert with check (public.is_super_admin());

create policy "instansi_delete_super_admin" on public.instansi
  for delete using (public.is_super_admin());

-- =========================================================
-- 3. RLS: KELOMPOK, ANGGOTA, TABUNGAN, TRANSAKSI, PENGELUARAN
-- Pola sama untuk kelimanya: SELECT boleh kalau super admin ATAU
-- baris itu milik instansi sendiri. Tulis (insert/update/delete)
-- boleh kalau admin (bukan jamaah) DAN (super admin ATAU instansi
-- sendiri).
-- =========================================================

-- KELOMPOK
drop policy if exists "kelompok_select_authenticated" on public.kelompok;
drop policy if exists "kelompok_write_admin_only" on public.kelompok;
create policy "kelompok_select_scoped" on public.kelompok
  for select using (public.is_super_admin() or instansi_id = public.current_instansi_id());
create policy "kelompok_write_scoped" on public.kelompok
  for all
  using (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()))
  with check (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()));

-- ANGGOTA
drop policy if exists "anggota_select_authenticated" on public.anggota;
drop policy if exists "anggota_write_admin_only" on public.anggota;
create policy "anggota_select_scoped" on public.anggota
  for select using (public.is_super_admin() or instansi_id = public.current_instansi_id());
create policy "anggota_write_scoped" on public.anggota
  for all
  using (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()))
  with check (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()));

-- TABUNGAN
drop policy if exists "tabungan_select_authenticated" on public.tabungan;
drop policy if exists "tabungan_write_admin_only" on public.tabungan;
create policy "tabungan_select_scoped" on public.tabungan
  for select using (public.is_super_admin() or instansi_id = public.current_instansi_id());
create policy "tabungan_write_scoped" on public.tabungan
  for all
  using (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()))
  with check (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()));

-- TRANSAKSI
drop policy if exists "transaksi_select_authenticated" on public.transaksi;
drop policy if exists "transaksi_write_admin_only" on public.transaksi;
create policy "transaksi_select_scoped" on public.transaksi
  for select using (public.is_super_admin() or instansi_id = public.current_instansi_id());
create policy "transaksi_write_scoped" on public.transaksi
  for all
  using (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()))
  with check (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()));

-- PENGELUARAN
drop policy if exists "pengeluaran_select_authenticated" on public.pengeluaran;
drop policy if exists "pengeluaran_write_admin_only" on public.pengeluaran;
create policy "pengeluaran_select_scoped" on public.pengeluaran
  for select using (public.is_super_admin() or instansi_id = public.current_instansi_id());
create policy "pengeluaran_write_scoped" on public.pengeluaran
  for all
  using (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()))
  with check (public.is_admin() and (public.is_super_admin() or instansi_id = public.current_instansi_id()));

-- =========================================================
-- 4. REVISI RPC — WAJIB, karena fungsi SECURITY DEFINER MELEWATI
-- RLS di atas sepenuhnya. Tanpa revisi ini, admin instansi A bisa
-- mencatat setoran/penarikan/hapus transaksi untuk anggota instansi
-- B lewat RPC walau RLS tabelnya sudah benar. Ini celah keamanan
-- paling kritis di Fase 2 — WAJIB dijalankan bersamaan dengan bagian
-- di atas, jangan dipisah.
--
-- Fungsi yang TIDAK perlu direvisi (otomatis ikut RLS di atas karena
-- BUKAN security definer): anggota_belum_setor_bulan_ini(),
-- grafik_setoran_periode(), total_kas_masjid().
-- =========================================================

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

  if not public.is_super_admin() and v_transaksi.instansi_id <> public.current_instansi_id() then
    raise exception 'Transaksi tersebut bukan milik instansi Anda';
  end if;

  if v_transaksi.jenis = 'setoran' then
    update public.tabungan set saldo = saldo - v_transaksi.nominal where anggota_id = v_transaksi.anggota_id;
  else
    update public.tabungan set saldo = saldo + v_transaksi.nominal where anggota_id = v_transaksi.anggota_id;
  end if;

  delete from public.transaksi where id = p_transaksi_id;
end;
$$;

-- =========================================================
-- 5. ATURAN KAPASITAS KELOMPOK
-- Sapi maksimal 7 anggota, Kambing maksimal 1 anggota (mengikuti
-- kelompok.maksimal_anggota yang sudah di-set otomatis di Fase 1).
-- "1 anggota hanya boleh aktif di 1 kelompok per tahun yang sama"
-- otomatis terjamin oleh struktur tabel (anggota.kelompok_id cuma
-- 1 kolom, tidak bisa dobel), jadi tidak perlu trigger tambahan
-- untuk aturan itu.
-- =========================================================
create or replace function public.cek_kapasitas_kelompok()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_jumlah_sekarang int;
  v_maksimal int;
  v_nama_kelompok text;
begin
  if new.kelompok_id is null then
    return new;
  end if;

  -- Anggota nonaktif tidak menempati kuota, jadi tidak perlu dicek
  if new.status = false then
    return new;
  end if;

  -- Lewati pengecekan kalau kelompok tidak berubah (update field lain saja)
  if tg_op = 'UPDATE' and old.kelompok_id is not distinct from new.kelompok_id and old.status = new.status then
    return new;
  end if;

  select maksimal_anggota, nama_kelompok into v_maksimal, v_nama_kelompok
  from public.kelompok where id = new.kelompok_id;

  select count(*) into v_jumlah_sekarang
  from public.anggota
  where kelompok_id = new.kelompok_id
    and status = true
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_jumlah_sekarang >= v_maksimal then
    raise exception 'Kelompok "%" sudah penuh (maksimal % anggota)', v_nama_kelompok, v_maksimal;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cek_kapasitas_kelompok on public.anggota;
create trigger trg_cek_kapasitas_kelompok
  before insert or update on public.anggota
  for each row execute procedure public.cek_kapasitas_kelompok();

-- =========================================================
-- SELESAI FASE 2.
--
-- CARA TEST setelah dijalankan (pakai akun admin yang sudah ada):
--   1. Buka aplikasi seperti biasa, pastikan SEMUA fitur masih
--      jalan normal (karena masih 1 instansi, tidak ada yang
--      kelihatan berubah dari sisi pengguna).
--   2. Coba tambah anggota ke-8 di kelompok jenis "sapi" yang sudah
--      berisi 7 anggota aktif -> harus GAGAL dengan pesan
--      "Kelompok ... sudah penuh".
--   3. (Opsional, butuh 2 instansi) buat instansi ke-2 manual lewat
--      SQL, pindahkan 1 admin ke instansi itu, cek admin itu TIDAK
--      bisa lihat anggota instansi pertama lagi.
-- =========================================================
