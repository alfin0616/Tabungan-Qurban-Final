-- =============================================================================
-- MIGRASI: PENAMBAHAN KOLOM REKENING BANK PADA SETIAP INSTANSI
-- Nomor rekening tabungan qurban melekat pada masing-masing instansi/masjid
-- =============================================================================

alter table public.instansi
  add column if not exists nama_bank text,
  add column if not exists nomor_rekening text,
  add column if not exists atas_nama_rekening text,
  add column if not exists rekening text;

-- Perbarui fungsi publik get_public_instansi_list agar ikut mengembalikan info rekening
drop function if exists public.get_public_instansi_list();
create or replace function public.get_public_instansi_list()
returns table (
  id uuid,
  nama_instansi text,
  alamat text,
  nama_bank text,
  nomor_rekening text,
  atas_nama_rekening text,
  rekening text
)
language sql
security definer set search_path = public
as $$
  select
    id,
    nama_instansi,
    coalesce(alamat, '') as alamat,
    coalesce(nama_bank, '') as nama_bank,
    coalesce(nomor_rekening, '') as nomor_rekening,
    coalesce(atas_nama_rekening, '') as atas_nama_rekening,
    coalesce(rekening, '') as rekening
  from public.instansi
  where status = true
  order by nama_instansi asc;
$$;

grant execute on function public.get_public_instansi_list() to anon, authenticated;

