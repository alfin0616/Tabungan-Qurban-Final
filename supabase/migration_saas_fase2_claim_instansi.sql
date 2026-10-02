-- Tambahkan kolom kode_registrasi di tabel instansi
alter table public.instansi 
add column if not exists kode_registrasi text unique;

-- Buat RPC untuk mengklaim instansi
create or replace function public.claim_instansi_account(p_kode_registrasi text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_instansi_id uuid;
begin
  -- 1. Cari instansi dengan kode tersebut
  select id into v_instansi_id
  from public.instansi
  where kode_registrasi = p_kode_registrasi and status = true;

  if v_instansi_id is null then
    raise exception 'Kode registrasi tidak valid, sudah dipakai, atau instansi tidak aktif.';
  end if;

  -- 2. Update profil user menjadi admin untuk instansi tersebut
  update public.admin_profiles
  set role = 'admin', instansi_id = v_instansi_id
  where id = auth.uid();

  -- 3. Hapus kode registrasi agar tidak bisa dipakai lagi (one-time use)
  update public.instansi
  set kode_registrasi = null
  where id = v_instansi_id;

  return true;
end;
$$;

-- Beri akses eksekusi ke authenticated user (mereka baru saja signup dan ter-login)
grant execute on function public.claim_instansi_account(text) to authenticated;
