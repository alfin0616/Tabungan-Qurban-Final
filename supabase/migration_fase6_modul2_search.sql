-- =============================================================================
-- FASE 6 - MODUL 2: SMART SEARCH (GLOBAL SEARCH RPC WITH AUTOCOMPLETE & PAGINATION)
-- =============================================================================

create or replace function public.global_smart_search(
  p_query text,
  p_category text default 'all', -- 'all', 'instansi', 'kelompok', 'jamaah', 'transaksi', 'laporan', 'notifikasi'
  p_page integer default 1,
  p_limit integer default 10
)
returns json
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_role text;
  v_instansi_id uuid;
  v_kelompok_id uuid;
  v_offset integer;
  v_query text;
  
  v_instansi_results json := '[]'::json;
  v_kelompok_results json := '[]'::json;
  v_jamaah_results json := '[]'::json;
  v_transaksi_results json := '[]'::json;
  v_laporan_results json := '[]'::json;
  v_notifikasi_results json := '[]'::json;
  
  v_total_count integer := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Akses ditolak: pengguna belum terautentikasi';
  end if;

  -- Ambil role & scope pengguna
  select role, instansi_id, kelompok_id into v_role, v_instansi_id, v_kelompok_id
  from public.admin_profiles
  where id = v_user_id;

  v_query := trim(p_query);
  if length(v_query) = 0 then
    return json_build_object(
      'instansi', '[]'::json,
      'kelompok', '[]'::json,
      'jamaah', '[]'::json,
      'transaksi', '[]'::json,
      'laporan', '[]'::json,
      'notifikasi', '[]'::json,
      'total_count', 0,
      'page', p_page,
      'limit', p_limit
    );
  end if;

  v_offset := (p_page - 1) * p_limit;

  -- 1. CARI INSTANSI (Super Admin & Admin Instansi)
  if (p_category = 'all' or p_category = 'instansi') then
    select coalesce(json_agg(t), '[]'::json) into v_instansi_results
    from (
      select id, nama_instansi as title, coalesce(alamat, '') as description, 'instansi' as category, '/superadmin/instansi' as link
      from public.instansi
      where deleted_at is null
        and (v_role = 'superadmin' or id = v_instansi_id)
        and (nama_instansi ilike '%' || v_query || '%' or alamat ilike '%' || v_query || '%')
      order by nama_instansi asc
      limit p_limit offset v_offset
    ) t;
  end if;

  -- 2. CARI KELOMPOK
  if (p_category = 'all' or p_category = 'kelompok') then
    select coalesce(json_agg(t), '[]'::json) into v_kelompok_results
    from (
      select 
        k.id, 
        k.nama_kelompok as title, 
        coalesce(i.nama_instansi, 'Instansi') as description, 
        'kelompok' as category, 
        case when v_role = 'superadmin' then '/superadmin/kelompok' else '/anggota' end as link
      from public.kelompok k
      left join public.instansi i on k.instansi_id = i.id
      where k.deleted_at is null
        and (v_role = 'superadmin' or k.instansi_id = v_instansi_id)
        and (v_role != 'jamaah' or k.id = v_kelompok_id)
        and (k.nama_kelompok ilike '%' || v_query || '%' or i.nama_instansi ilike '%' || v_query || '%')
      order by k.nama_kelompok asc
      limit p_limit offset v_offset
    ) t;
  end if;

  -- 3. CARI JAMAAH / ANGGOTA
  if (p_category = 'all' or p_category = 'jamaah') then
    select coalesce(json_agg(t), '[]'::json) into v_jamaah_results
    from (
      select 
        a.id, 
        a.nama as title, 
        concat('Kelompok: ', coalesce(k.nama_kelompok, '-'), ' | ', coalesce(a.phone, a.email, '')) as description, 
        'jamaah' as category, 
        concat('/anggota/', a.id) as link
      from public.anggota a
      left join public.kelompok k on a.kelompok_id = k.id
      where a.deleted_at is null
        and (v_role = 'superadmin' or a.instansi_id = v_instansi_id)
        and (v_role != 'jamaah' or a.kelompok_id = v_kelompok_id)
        and (a.nama ilike '%' || v_query || '%' or a.phone ilike '%' || v_query || '%' or a.email ilike '%' || v_query || '%')
      order by a.nama asc
      limit p_limit offset v_offset
    ) t;
  end if;

  -- 4. CARI TRANSAKSI
  if (p_category = 'all' or p_category = 'transaksi') then
    select coalesce(json_agg(t), '[]'::json) into v_transaksi_results
    from (
      select 
        tr.id, 
        concat(upper(tr.jenis), ' - Rp ', to_char(tr.nominal, 'FM999,999,999,999')) as title, 
        concat(coalesce(a.nama, 'Jamaah'), ' (', to_char(tr.tanggal, 'DD/MM/YYYY'), ')') as description, 
        'transaksi' as category, 
        '/transaksi/riwayat' as link
      from public.transaksi tr
      left join public.anggota a on tr.anggota_id = a.id
      where tr.deleted_at is null
        and (v_role = 'superadmin' or a.instansi_id = v_instansi_id)
        and (v_role != 'jamaah' or a.kelompok_id = v_kelompok_id)
        and (
          tr.jenis ilike '%' || v_query || '%' 
          or tr.keterangan ilike '%' || v_query || '%' 
          or a.nama ilike '%' || v_query || '%'
        )
      order by tr.tanggal desc
      limit p_limit offset v_offset
    ) t;
  end if;

  -- 5. CARI LAPORAN
  if (p_category = 'all' or p_category = 'laporan') then
    select coalesce(json_agg(t), '[]'::json) into v_laporan_results
    from (
      select 
        id, 
        concat('Laporan Qurban: ', nama_kelompok) as title, 
        concat('Target: Rp ', to_char(target_dana, 'FM999,999,999,999')) as description, 
        'laporan' as category, 
        '/laporan' as link
      from public.kelompok
      where deleted_at is null
        and (v_role = 'superadmin' or instansi_id = v_instansi_id)
        and (v_role != 'jamaah' or id = v_kelompok_id)
        and ('laporan' ilike '%' || v_query || '%' or nama_kelompok ilike '%' || v_query || '%')
      order by nama_kelompok asc
      limit p_limit offset v_offset
    ) t;
  end if;

  -- 6. CARI NOTIFIKASI
  if (p_category = 'all' or p_category = 'notifikasi') then
    select coalesce(json_agg(t), '[]'::json) into v_notifikasi_results
    from (
      select 
        id, 
        judul as title, 
        pesan as description, 
        'notifikasi' as category, 
        coalesce(link, '/dashboard') as link
      from public.notifications
      where user_id = v_user_id
        and (judul ilike '%' || v_query || '%' or pesan ilike '%' || v_query || '%')
      order by created_at desc
      limit p_limit offset v_offset
    ) t;
  end if;

  v_total_count := json_array_length(v_instansi_results) + 
                   json_array_length(v_kelompok_results) + 
                   json_array_length(v_jamaah_results) + 
                   json_array_length(v_transaksi_results) + 
                   json_array_length(v_laporan_results) + 
                   json_array_length(v_notifikasi_results);

  return json_build_object(
    'instansi', v_instansi_results,
    'kelompok', v_kelompok_results,
    'jamaah', v_jamaah_results,
    'transaksi', v_transaksi_results,
    'laporan', v_laporan_results,
    'notifikasi', v_notifikasi_results,
    'total_count', v_total_count,
    'page', p_page,
    'limit', p_limit
  );
end;
$$;

grant execute on function public.global_smart_search(text, text, integer, integer) to authenticated;
