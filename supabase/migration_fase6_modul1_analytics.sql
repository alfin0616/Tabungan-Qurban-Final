-- =============================================================================
-- FASE 6 - MODUL 1: DASHBOARD ANALYTICS (FUNCTIONS & RPC)
-- =============================================================================

-- 1. Grafik Setoran Harian (30 Hari Terakhir)
create or replace function public.get_grafik_setoran_harian()
returns table (
  tanggal text,
  total_setoran numeric
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Akses ditolak: hanya Super Admin';
  end if;

  return query
  select 
    to_char(d.tanggal::date, 'DD Mon') as tanggal,
    coalesce(sum(t.nominal), 0)::numeric as total_setoran
  from generate_series(
    current_date - interval '29 days',
    current_date,
    interval '1 day'
  ) as d(tanggal)
  left join public.transaksi t 
    on t.tanggal::date = d.tanggal::date 
   and t.jenis = 'setoran'
   and t.deleted_at is null
  group by d.tanggal
  order by d.tanggal asc;
end;
$$;

grant execute on function public.get_grafik_setoran_harian() to authenticated;


-- 2. Grafik Setoran Tahunan (Per Tahun)
create or replace function public.get_grafik_setoran_tahunan()
returns table (
  tahun text,
  total_setoran numeric
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Akses ditolak: hanya Super Admin';
  end if;

  return query
  select 
    to_char(d.tahun, 'YYYY') as tahun,
    coalesce(sum(t.nominal), 0)::numeric as total_setoran
  from generate_series(
    date_trunc('year', current_date - interval '3 years'),
    date_trunc('year', current_date),
    interval '1 year'
  ) as d(tahun)
  left join public.transaksi t 
    on date_trunc('year', t.tanggal) = d.tahun 
   and t.jenis = 'setoran'
   and t.deleted_at is null
  group by d.tahun
  order by d.tahun asc;
end;
$$;

grant execute on function public.get_grafik_setoran_tahunan() to authenticated;


-- 3. Jamaah Teraktif
create or replace function public.get_jamaah_teraktif(p_limit integer default 10)
returns table (
  id uuid,
  nama text,
  nama_instansi text,
  nama_kelompok text,
  total_transaksi bigint,
  total_setoran numeric
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Akses ditolak: hanya Super Admin';
  end if;

  return query
  select 
    a.id,
    a.nama,
    coalesce(i.nama_instansi, '-') as nama_instansi,
    coalesce(k.nama_kelompok, '-') as nama_kelompok,
    count(tr.id)::bigint as total_transaksi,
    coalesce(sum(tr.nominal), 0)::numeric as total_setoran
  from public.anggota a
  left join public.transaksi tr on tr.anggota_id = a.id and tr.jenis = 'setoran' and tr.deleted_at is null
  left join public.instansi i on a.instansi_id = i.id and i.deleted_at is null
  left join public.kelompok k on a.kelompok_id = k.id and k.deleted_at is null
  where a.status = true and a.deleted_at is null
  group by a.id, a.nama, i.nama_instansi, k.nama_kelompok
  order by total_transaksi desc, total_setoran desc
  limit p_limit;
end;
$$;

grant execute on function public.get_jamaah_teraktif(integer) to authenticated;


-- 4. Expanded Statistik Nasional dengan Growth & Best Performer
create or replace function public.get_statistik_nasional()
returns json
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_total_instansi    bigint;
  v_total_kelompok    bigint;
  v_total_jamaah      bigint;
  v_total_saldo       numeric;
  v_total_target      numeric;
  v_total_transaksi   bigint;
  
  v_setoran_bulan_ini numeric;
  v_setoran_bulan_lalu numeric;
  v_growth_bulanan    numeric := 0;

  v_setoran_tahun_ini numeric;
  v_setoran_tahun_lalu numeric;
  v_growth_tahunan    numeric := 0;
  
  v_best_instansi     json;
  v_best_kelompok     json;
  v_best_jamaah       json;
begin
  if not public.is_super_admin() then
    raise exception 'Akses ditolak: hanya Super Admin';
  end if;

  select count(*) into v_total_instansi from public.instansi where status = true and deleted_at is null;
  select count(*) into v_total_kelompok from public.kelompok where status = true and deleted_at is null;
  select count(*) into v_total_jamaah   from public.anggota  where status = true and deleted_at is null;

  select coalesce(sum(saldo), 0) into v_total_saldo from public.tabungan where deleted_at is null;
  select coalesce(sum(target_dana), 0) into v_total_target from public.kelompok where status = true and deleted_at is null;

  select count(*) into v_total_transaksi
  from public.transaksi
  where tanggal >= date_trunc('month', current_date) and deleted_at is null;

  -- Growth Bulanan
  select coalesce(sum(nominal), 0) into v_setoran_bulan_ini
  from public.transaksi
  where jenis = 'setoran' and deleted_at is null
    and tanggal >= date_trunc('month', current_date);

  select coalesce(sum(nominal), 0) into v_setoran_bulan_lalu
  from public.transaksi
  where jenis = 'setoran' and deleted_at is null
    and tanggal >= date_trunc('month', current_date - interval '1 month')
    and tanggal < date_trunc('month', current_date);

  if v_setoran_bulan_lalu > 0 then
    v_growth_bulanan := round(((v_setoran_bulan_ini - v_setoran_bulan_lalu) / v_setoran_bulan_lalu) * 100, 1);
  elsif v_setoran_bulan_ini > 0 then
    v_growth_bulanan := 100.0;
  end if;

  -- Growth Tahunan
  select coalesce(sum(nominal), 0) into v_setoran_tahun_ini
  from public.transaksi
  where jenis = 'setoran' and deleted_at is null
    and tanggal >= date_trunc('year', current_date);

  select coalesce(sum(nominal), 0) into v_setoran_tahun_lalu
  from public.transaksi
  where jenis = 'setoran' and deleted_at is null
    and tanggal >= date_trunc('year', current_date - interval '1 year')
    and tanggal < date_trunc('year', current_date);

  if v_setoran_tahun_lalu > 0 then
    v_growth_tahunan := round(((v_setoran_tahun_ini - v_setoran_tahun_lalu) / v_setoran_tahun_lalu) * 100, 1);
  elsif v_setoran_tahun_ini > 0 then
    v_growth_tahunan := 100.0;
  end if;

  -- Instansi Terbaik
  select row_to_json(t) into v_best_instansi from (
    select i.nama_instansi, coalesce(sum(tb.saldo), 0) as total_saldo
    from public.instansi i
    join public.kelompok k on k.instansi_id = i.id and k.deleted_at is null
    join public.tabungan tb on tb.kelompok_id = k.id and tb.deleted_at is null
    where i.status = true and i.deleted_at is null
    group by i.id, i.nama_instansi
    order by total_saldo desc
    limit 1
  ) t;

  -- Kelompok Terbaik
  select row_to_json(t) into v_best_kelompok from (
    select k.nama_kelompok, i.nama_instansi, coalesce(sum(tb.saldo), 0) as total_saldo
    from public.kelompok k
    join public.instansi i on k.instansi_id = i.id and i.deleted_at is null
    join public.tabungan tb on tb.kelompok_id = k.id and tb.deleted_at is null
    where k.status = true and k.deleted_at is null
    group by k.id, k.nama_kelompok, i.nama_instansi
    order by total_saldo desc
    limit 1
  ) t;

  -- Jamaah Teraktif
  select row_to_json(t) into v_best_jamaah from (
    select a.nama, count(tr.id) as total_transaksi, coalesce(sum(tr.nominal), 0) as total_setoran
    from public.anggota a
    join public.transaksi tr on tr.anggota_id = a.id and tr.jenis = 'setoran' and tr.deleted_at is null
    where a.status = true and a.deleted_at is null
    group by a.id, a.nama
    order by total_transaksi desc, total_setoran desc
    limit 1
  ) t;

  return json_build_object(
    'total_instansi',     v_total_instansi,
    'total_kelompok',     v_total_kelompok,
    'total_jamaah',       v_total_jamaah,
    'total_saldo',        v_total_saldo,
    'total_target',       v_total_target,
    'total_transaksi',    v_total_transaksi,
    'growth_bulanan',     v_growth_bulanan,
    'growth_tahunan',     v_growth_tahunan,
    'instansi_terbaik',   v_best_instansi,
    'kelompok_terbaik',   v_best_kelompok,
    'jamaah_teraktif',    v_best_jamaah
  );
end;
$$;

grant execute on function public.get_statistik_nasional() to authenticated;
