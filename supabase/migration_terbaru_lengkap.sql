-- ==============================================================================
-- MIGRATION TERBARU LENGKAP SIQURBAN:
-- 1. Nomor Rekening per Instansi
-- 2. Akses Jamaah Melihat Daftar Anggota Satu Kelompok Qurban
-- 3. Pilihan Setoran (Bulanan / Mingguan) & Lama Tabungan Fleksibel (Tenor)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BAGIAN 1: NOMOR REKENING PER INSTANSI
-- ------------------------------------------------------------------------------
alter table public.instansi
  add column if not exists nama_bank text,
  add column if not exists nomor_rekening text,
  add column if not exists atas_nama_rekening text,
  add column if not exists rekening text;

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

-- ------------------------------------------------------------------------------
-- BAGIAN 2: AKSES JAMAAH MELIHAT DAFTAR ANGGOTA DALAM SATU KELOMPOK
-- ------------------------------------------------------------------------------
create or replace function public.my_anggota_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select id from public.anggota where user_id = auth.uid() limit 1;
$$;

grant execute on function public.my_anggota_id() to authenticated;

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

drop policy if exists "anggota_select_scoped" on public.anggota;
create policy "anggota_select_scoped" on public.anggota
  for select using (
    public.is_super_admin()
    or (public.is_admin() and instansi_id = public.current_instansi_id())
    or (kelompok_id is not null and kelompok_id = public.current_kelompok_id())
    or (instansi_id is not null and instansi_id = public.current_instansi_id())
    or (user_id = auth.uid())
  );

drop policy if exists "tabungan_select_scoped" on public.tabungan;
create policy "tabungan_select_scoped" on public.tabungan
  for select using (
    public.is_super_admin()
    or (public.is_admin() and instansi_id = public.current_instansi_id())
    or (kelompok_id is not null and kelompok_id = public.current_kelompok_id())
    or (instansi_id is not null and instansi_id = public.current_instansi_id())
    or (anggota_id = public.my_anggota_id())
  );

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

-- ------------------------------------------------------------------------------
-- BAGIAN 3: PILIHAN SETORAN (BULANAN / MINGGUAN) & LAMA TABUNGAN FLEKSIBEL
-- ------------------------------------------------------------------------------
alter table public.anggota
  add column if not exists periode_setoran text not null default 'bulanan'
    check (periode_setoran in ('bulanan', 'mingguan')),
  add column if not exists lama_tabungan integer not null default 12
    check (lama_tabungan >= 1 and lama_tabungan <= 120);

alter table public.tabungan
  add column if not exists periode_setoran text not null default 'bulanan'
    check (periode_setoran in ('bulanan', 'mingguan')),
  add column if not exists lama_tabungan integer not null default 12
    check (lama_tabungan >= 1 and lama_tabungan <= 120);

drop function if exists public.grafik_setoran_mingguan(int);
create or replace function public.grafik_setoran_mingguan(p_jumlah_minggu int default 8)
returns table (minggu text, total numeric)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_instansi_id uuid;
begin
  if public.is_super_admin() then
    return query
      with minggu_seri as (
        select generate_series(
          date_trunc('week', current_date - ((p_jumlah_minggu - 1) * interval '1 week')),
          date_trunc('week', current_date),
          interval '1 week'
        )::date as minggu_awal
      )
      select
        to_char(ms.minggu_awal, 'DD Mon') as minggu,
        coalesce(sum(t.nominal), 0)::numeric as total
      from minggu_seri ms
      left join public.transaksi t
        on t.jenis = 'setoran'
        and date_trunc('week', t.tanggal)::date = ms.minggu_awal
      group by ms.minggu_awal
      order by ms.minggu_awal;
  else
    v_instansi_id := public.current_instansi_id();
    return query
      with minggu_seri as (
        select generate_series(
          date_trunc('week', current_date - ((p_jumlah_minggu - 1) * interval '1 week')),
          date_trunc('week', current_date),
          interval '1 week'
        )::date as minggu_awal
      )
      select
        to_char(ms.minggu_awal, 'DD Mon') as minggu,
        coalesce(sum(t.nominal), 0)::numeric as total
      from minggu_seri ms
      left join public.transaksi t
        on t.jenis = 'setoran'
        and t.instansi_id = v_instansi_id
        and date_trunc('week', t.tanggal)::date = ms.minggu_awal
      group by ms.minggu_awal
      order by ms.minggu_awal;
  end if;
end;
$$;

grant execute on function public.grafik_setoran_mingguan(int) to authenticated;

