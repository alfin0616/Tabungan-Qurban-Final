-- ==============================================================================
-- MIGRATION LENGKAP: AUTH JAMAAH WAJIB PILIH MASJID (INSTANSI) & KELOMPOK
-- SERTA DUKUNGAN LOGIN/DAFTAR DENGAN NOMOR WA ATAU EMAIL
-- ==============================================================================

-- 1. Tambahkan kolom phone, email, dan kelompok_id pada tabel profil admin_profiles (jika belum ada)
alter table public.admin_profiles add column if not exists phone text;
alter table public.admin_profiles add column if not exists email text;
alter table public.admin_profiles add column if not exists kelompok_id uuid references public.kelompok(id);

-- 2. Fungsi pencarian email berdasarkan Email ATAU Nomor Telepon/WA (untuk fitur Login)
create or replace function public.resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_email text;
  v_clean_phone text;
begin
  -- Kalau sudah berupa email yang ada karakter '@', langsung kembalikan
  if p_identifier like '%@%' then
    return trim(p_identifier);
  end if;

  -- Bersihkan karakter selain angka
  v_clean_phone := regexp_replace(p_identifier, '[^0-9]', '', 'g');

  -- 1) Cari di tabel admin_profiles berdasarkan phone
  select email into v_email
  from public.admin_profiles
  where regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = v_clean_phone
     or regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = '62' || ltrim(v_clean_phone, '0')
     or '62' || ltrim(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), '0') = '62' || ltrim(v_clean_phone, '0')
  limit 1;

  if v_email is not null and v_email != '' then
    return v_email;
  end if;

  -- 2) Cari di tabel anggota jika sudah terhubung (user_id is not null)
  select u.email into v_email
  from public.anggota a
  join auth.users u on u.id = a.user_id
  where (regexp_replace(coalesce(a.no_hp, ''), '[^0-9]', '', 'g') = v_clean_phone
         or '62' || ltrim(regexp_replace(coalesce(a.no_hp, ''), '[^0-9]', '', 'g'), '0') = '62' || ltrim(v_clean_phone, '0'))
    and a.user_id is not null
  limit 1;

  if v_email is not null and v_email != '' then
    return v_email;
  end if;

  -- 3) Fallback: format email virtual WA SIQURBAN agar tetap konsisten
  return trim(p_identifier) || '@wa.siqurban.id';
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- 3. Fungsi publik untuk mengambil daftar Masjid/Instansi aktif (untuk dropdown Login & Daftar)
create or replace function public.get_public_instansi_list()
returns table (
  id uuid,
  nama_instansi text,
  alamat text
)
language sql
security definer set search_path = public
as $$
  select id, nama_instansi, coalesce(alamat, '') as alamat
  from public.instansi
  where status = true
  order by nama_instansi asc;
$$;

grant execute on function public.get_public_instansi_list() to anon, authenticated;

-- 4. Fungsi publik untuk mengambil daftar Kelompok Qurban berdasarkan Masjid/Instansi (untuk dropdown Login & Daftar)
create or replace function public.get_public_kelompok_list(p_instansi_id uuid)
returns table (
  id uuid,
  instansi_id uuid,
  nama_kelompok text,
  jenis_qurban text,
  target_dana numeric
)
language sql
security definer set search_path = public
as $$
  select id, instansi_id, nama_kelompok, jenis_qurban, coalesce(target_dana, 0) as target_dana
  from public.kelompok
  where status = true
    and instansi_id = p_instansi_id
  order by nama_kelompok asc;
$$;

grant execute on function public.get_public_kelompok_list(uuid) to anon, authenticated;

-- 5. Fungsi untuk mengatur Masjid (Instansi) dan Kelompok aktif bagi Jamaah
--    Sekaligus menghubungkan atau membuat data anggota & rekening tabungan jika belum ada
create or replace function public.set_active_jamaah_group(p_instansi_id uuid, p_kelompok_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.admin_profiles;
  v_existing_anggota_id uuid;
  v_new_anggota_id uuid;
  v_target_dana numeric;
begin
  if v_user_id is null then
    raise exception 'Anda harus login terlebih dahulu';
  end if;

  -- Update instansi_id dan kelompok_id pada admin_profiles
  update public.admin_profiles
  set instansi_id = p_instansi_id,
      kelompok_id = p_kelompok_id
  where id = v_user_id
  returning * into v_profile;

  if v_profile.role = 'jamaah' then
    -- 1) Cek apakah sudah ada anggota untuk user ini di masjid & kelompok tersebut
    select id into v_existing_anggota_id
    from public.anggota
    where user_id = v_user_id
      and instansi_id = p_instansi_id
      and kelompok_id = p_kelompok_id
    limit 1;

    if v_existing_anggota_id is not null then
      return; -- Sudah terhubung ke kelompok ini
    end if;

    -- 2) Cek apakah ada data anggota dengan nomor telepon (no_hp/phone) yang cocok tapi belum diklaim
    if v_profile.phone is not null and v_profile.phone != '' then
      select id into v_existing_anggota_id
      from public.anggota
      where instansi_id = p_instansi_id
        and kelompok_id = p_kelompok_id
        and user_id is null
        and (
          regexp_replace(coalesce(no_hp, ''), '[^0-9]', '', 'g') = regexp_replace(v_profile.phone, '[^0-9]', '', 'g')
          or '62' || ltrim(regexp_replace(coalesce(no_hp, ''), '[^0-9]', '', 'g'), '0') = '62' || ltrim(regexp_replace(v_profile.phone, '[^0-9]', '', 'g'), '0')
        )
      limit 1;

      if v_existing_anggota_id is not null then
        update public.anggota
        set user_id = v_user_id
        where id = v_existing_anggota_id;
        return;
      end if;
    end if;

    -- 3) Jika belum ada sama sekali, buatkan data anggota & rekening tabungan baru untuk jamaah ini
    select target_dana into v_target_dana
    from public.kelompok
    where id = p_kelompok_id;

    insert into public.anggota (
      nama,
      no_hp,
      alamat,
      jenis_kelamin,
      instansi_id,
      kelompok_id,
      user_id,
      status
    ) values (
      coalesce(v_profile.full_name, 'Jamaah Qurban'),
      coalesce(v_profile.phone, '-'),
      '-',
      'L',
      p_instansi_id,
      p_kelompok_id,
      v_user_id,
      true
    ) returning id into v_new_anggota_id;

    insert into public.tabungan (
      anggota_id,
      instansi_id,
      kelompok_id,
      saldo,
      target
    ) values (
      v_new_anggota_id,
      p_instansi_id,
      p_kelompok_id,
      0,
      coalesce(v_target_dana, 3500000)
    );
  end if;
end;
$$;

grant execute on function public.set_active_jamaah_group(uuid, uuid) to authenticated;

-- 6. Perbarui trigger handle_new_user agar merekam phone, email, instansi_id, dan kelompok_id
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_instansi_id uuid;
  v_kelompok_id uuid;
begin
  begin
    v_instansi_id := (new.raw_user_meta_data ->> 'instansi_id')::uuid;
  exception when others then
    v_instansi_id := null;
  end;

  begin
    v_kelompok_id := (new.raw_user_meta_data ->> 'kelompok_id')::uuid;
  exception when others then
    v_kelompok_id := null;
  end;

  insert into public.admin_profiles (id, full_name, role, phone, email, instansi_id, kelompok_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'jamaah'),
    coalesce(new.raw_user_meta_data ->> 'phone', new.phone),
    new.email,
    v_instansi_id,
    v_kelompok_id
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, admin_profiles.full_name),
    role = coalesce(excluded.role, admin_profiles.role),
    phone = coalesce(excluded.phone, admin_profiles.phone),
    email = coalesce(excluded.email, admin_profiles.email),
    instansi_id = coalesce(excluded.instansi_id, admin_profiles.instansi_id),
    kelompok_id = coalesce(excluded.kelompok_id, admin_profiles.kelompok_id);

  return new;
end;
$$;
