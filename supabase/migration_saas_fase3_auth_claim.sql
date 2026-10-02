
create or replace function public.klaim_akun_anggota(p_kode_anggota text, p_no_hp text)
returns public.anggota
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.anggota;
begin
  if auth.uid() is null then
    raise exception 'Anda harus login terlebih dahulu';
  end if;

  -- Cegah 1 akun login menghubungkan diri ke lebih dari 1 baris anggota
  if exists (select 1 from public.anggota where user_id = auth.uid()) then
    raise exception 'Akun Anda sudah terhubung ke data anggota lain';
  end if;

  select * into v_row
  from public.anggota
  where kode_anggota = p_kode_anggota
    and no_hp = p_no_hp
    and user_id is null
  for update;

  if v_row.id is null then
    raise exception 'Kode Anggota atau No. HP tidak cocok, atau data ini sudah terhubung ke akun lain. Hubungi admin instansi Anda.';
  end if;

  update public.anggota set user_id = auth.uid() where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

-- =========================================================
-- SELESAI FASE 3 (bagian database). Lanjut ke perubahan frontend
-- (AuthContext, route guard, halaman klaim akun) — tidak perlu SQL
-- tambahan untuk itu.
-- =========================================================
