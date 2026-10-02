-- =========================================================
-- HOTFIX FASE 2 — Perbaikan bug "new row violates row-level
-- security policy for table anggota" saat input/simpan data.
-- Jalankan ini SETELAH migration_saas_fase2_rls_multitenant.sql.
--
-- AKAR MASALAH:
-- 1) current_instansi_id() mengembalikan NULL kalau
--    admin_profiles.instansi_id kosong (mis. akun admin dibuat
--    setelah migrasi Fase 1 dan tidak ter-backfill) -> semua
--    pengecekan "instansi_id = current_instansi_id()" gagal.
-- 2) PostgreSQL menjalankan trigger BEFORE INSERT berdasarkan
--    URUTAN ABJAD NAMA TRIGGER, bukan urutan dibuat. Trigger
--    "trg_cek_kapasitas_kelompok" (huruf c) ternyata jalan
--    SEBELUM "trg_fill_default_instansi_anggota" (huruf f),
--    padahal harus jalan SESUDAHNYA supaya kelompok_id sudah
--    terisi saat kapasitas dicek.
-- =========================================================

-- ---------------------------------------------------------
-- 1. current_instansi_id(): tambah fallback ke instansi default
--    kalau admin_profiles.instansi_id kosong. Ini juga sekaligus
--    memperbaiki data admin_profiles yang instansi_id-nya NULL
--    supaya konsisten ke depannya (bukan cuma nutup gejala).
-- ---------------------------------------------------------
create or replace function public.current_instansi_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select instansi_id from public.admin_profiles where id = auth.uid()),
    (select instansi_id from public.anggota where user_id = auth.uid()),
    (select id from public.instansi where is_default = true limit 1)
  );
$$;

-- Perbaiki data: isi instansi_id yang masih kosong di admin_profiles
-- (akun admin yang dibuat setelah Fase 1, atau kelewat ter-backfill)
-- supaya konsisten dengan instansi default.
update public.admin_profiles
set instansi_id = (select id from public.instansi where is_default = true limit 1)
where instansi_id is null
  and exists (select 1 from public.instansi where is_default = true);

-- ---------------------------------------------------------
-- 2. Perbaiki urutan trigger di tabel anggota lewat rename
--    (pakai prefix angka supaya urutan abjad = urutan eksekusi
--    yang benar): fill instansi/kelompok dulu, baru cek kapasitas,
--    baru generate kode.
-- ---------------------------------------------------------
drop trigger if exists trg_fill_default_instansi_anggota on public.anggota;
create trigger trg_10_fill_default_instansi_anggota
  before insert on public.anggota
  for each row execute procedure public.fill_default_instansi_anggota();

drop trigger if exists trg_cek_kapasitas_kelompok on public.anggota;
create trigger trg_20_cek_kapasitas_kelompok
  before insert or update on public.anggota
  for each row execute procedure public.cek_kapasitas_kelompok();

drop trigger if exists trg_generate_kode_anggota on public.anggota;
create trigger trg_30_generate_kode_anggota
  before insert on public.anggota
  for each row execute procedure public.generate_kode_anggota();

-- =========================================================
-- SELESAI HOTFIX. Cek dengan query berikut, harus TIDAK ADA baris
-- yang kembali (artinya semua admin sudah punya instansi_id):
--   select id, full_name, role from admin_profiles where instansi_id is null;
--
-- Lalu coba tambah anggota baru lewat aplikasi seperti biasa.
-- =========================================================
