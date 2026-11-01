-- ==============================================================================
-- MIGRATION: AKSES JAMAAH MELIHAT DAFTAR ANGGOTA DALAM SATU KELOMPOK QURBAN
-- ==============================================================================
-- Memastikan Jamaah yang tergabung di suatu kelompok dapat melihat nama-nama
-- anggota lain yang berada di dalam kelompok qurban yang sama pada menu Anggota.

-- 1. Helper Function: Mengambil kelompok_id aktif milik user yang sedang login
create or replace function public.current_kelompok_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select kelompok_id from public.admin_profiles where id = auth.uid() limit 1),
    (select kelompok_id from public.anggota where user_id = auth.uid() limit 1)
  );
$$;

grant execute on function public.current_kelompok_id() to authenticated;

-- 2. Perbarui RLS Policy pada tabel public.anggota agar Jamaah dapat melihat
--    seluruh anggota yang berada di kelompok qurban yang sama (maupun instansi yang sama)
drop policy if exists "anggota_select_scoped" on public.anggota;
create policy "anggota_select_scoped" on public.anggota
  for select using (
    public.is_super_admin()
    or (public.is_admin() and instansi_id = public.current_instansi_id())
    or (kelompok_id is not null and kelompok_id = public.current_kelompok_id())
    or (instansi_id is not null and instansi_id = public.current_instansi_id())
    or (user_id = auth.uid())
  );

-- 3. Perbarui RLS Policy pada tabel public.tabungan agar progres kelompok akurat
drop policy if exists "tabungan_select_scoped" on public.tabungan;
create policy "tabungan_select_scoped" on public.tabungan
  for select using (
    public.is_super_admin()
    or (public.is_admin() and instansi_id = public.current_instansi_id())
    or (kelompok_id is not null and kelompok_id = public.current_kelompok_id())
    or (instansi_id is not null and instansi_id = public.current_instansi_id())
    or (anggota_id = public.my_anggota_id())
  );

-- 4. RPC Security Definer untuk mengambil daftar anggota dalam satu kelompok
drop function if exists public.get_anggota_kelompok(uuid);
create or replace function public.get_anggota_kelompok(p_kelompok_id uuid)
returns json
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_result json;
begin
  if auth.uid() is null then
    raise exception 'Anda harus login terlebih dahulu';
  end if;

  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  into v_result
  from (
    select
      a.id,
      a.kode_anggota,
      a.nama,
      a.no_hp,
      a.alamat,
      a.jenis_kelamin,
      a.tanggal_bergabung,
      a.status,
      a.foto,
      a.instansi_id,
      a.kelompok_id,
      a.user_id,
      a.created_at,
      json_build_object(
        'id', i.id,
        'nama_instansi', i.nama_instansi,
        'kode_instansi', i.kode_instansi
      ) as instansi,
      json_build_object(
        'id', k.id,
        'nama_kelompok', k.nama_kelompok,
        'kode_kelompok', k.kode_kelompok,
        'jenis_qurban', k.jenis_qurban,
        'target_dana', k.target_dana,
        'maksimal_anggota', k.maksimal_anggota
      ) as kelompok,
      coalesce(
        (
          select json_agg(json_build_object('saldo', tb.saldo, 'target', tb.target))
          from public.tabungan tb
          where tb.anggota_id = a.id
        ),
        '[]'::json
      ) as tabungan
    from public.anggota a
    left join public.instansi i on i.id = a.instansi_id
    left join public.kelompok k on k.id = a.kelompok_id
    where a.kelompok_id = p_kelompok_id
    order by a.created_at asc
  ) t;

  return v_result;
end;
$$;

grant execute on function public.get_anggota_kelompok(uuid) to authenticated;

-- 5. Perbaikan fungsi set_active_jamaah_group agar aman jika user_id sudah ada di anggota
drop function if exists public.set_active_jamaah_group(uuid, uuid);
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

  update public.admin_profiles
  set instansi_id = p_instansi_id,
      kelompok_id = p_kelompok_id
  where id = v_user_id
  returning * into v_profile;

  if v_profile.role = 'jamaah' then
    -- 1) Cek apakah user ini sudah punya baris anggota (di kelompok mana pun)
    select id into v_existing_anggota_id
    from public.anggota
    where user_id = v_user_id
    limit 1;

    if v_existing_anggota_id is not null then
      update public.anggota
      set instansi_id = p_instansi_id,
          kelompok_id = p_kelompok_id
      where id = v_existing_anggota_id;

      update public.tabungan
      set instansi_id = p_instansi_id,
          kelompok_id = p_kelompok_id
      where anggota_id = v_existing_anggota_id;
      return;
    end if;

    -- 2) Cek apakah ada data anggota dengan no_hp yang cocok di kelompok tersebut tapi belum diklaim
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

    -- 3) Buat baris anggota & tabungan baru jika belum ada
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
      coalesce(v_profile.phone, '0800000000'),
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

