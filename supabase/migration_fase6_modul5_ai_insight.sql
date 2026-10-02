-- =============================================================================
-- FASE 6 - MODUL 5: AI INSIGHT (HEURISTIC ANALYTICS & PREDICTIVE INSIGHTS)
-- =============================================================================

create or replace function public.get_ai_insights(
  p_instansi_id uuid default null,
  p_kelompok_id uuid default null
)
returns json
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_role text;
  v_user_instansi_id uuid;
  v_user_kelompok_id uuid;

  v_total_target numeric := 0;
  v_total_saldo numeric := 0;
  v_sisa_dana numeric := 0;
  v_total_anggota integer := 0;
  v_anggota_aktif integer := 0;
  
  v_setoran_30_hari numeric := 0;
  v_setoran_60_hari numeric := 0;
  v_rata_setoran_bulanan numeric := 0;
  
  v_rekomendasi_setoran_per_bulan numeric := 0;
  v_prediksi_bulan_selesai numeric := 0;
  v_prediksi_tanggal_selesai date;
  v_keaktifan_pct numeric := 0;
  v_trend_pct numeric := 0;
  v_status_trend text := 'stabil';
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Akses ditolak: pengguna belum terautentikasi';
  end if;

  select role, instansi_id, kelompok_id into v_role, v_user_instansi_id, v_user_kelompok_id
  from public.admin_profiles
  where id = v_user_id;

  -- Filter scope instansi & kelompok
  if v_role != 'superadmin' then
    p_instansi_id := v_user_instansi_id;
    if v_role = 'jamaah' then
      p_kelompok_id := v_user_kelompok_id;
    end if;
  end if;

  -- 1. Hitung total target, saldo, dan anggota
  select 
    coalesce(sum(k.target_dana), 0),
    coalesce(sum(tb.saldo), 0)
  into v_total_target, v_total_saldo
  from public.kelompok k
  left join public.tabungan tb on k.id = tb.kelompok_id and tb.deleted_at is null
  where k.deleted_at is null
    and (p_instansi_id is null or k.instansi_id = p_instansi_id)
    and (p_kelompok_id is null or k.id = p_kelompok_id);

  select 
    count(*),
    count(*) filter (where status = true)
  into v_total_anggota, v_anggota_aktif
  from public.anggota a
  where a.deleted_at is null
    and (p_instansi_id is null or a.instansi_id = p_instansi_id)
    and (p_kelompok_id is null or a.kelompok_id = p_kelompok_id);

  v_sisa_dana := greatest(0, v_total_target - v_total_saldo);

  -- 2. Hitung setoran 30 hari & 60 hari terakhir untuk velocity
  select coalesce(sum(tr.nominal), 0) into v_setoran_30_hari
  from public.transaksi tr
  join public.anggota a on tr.anggota_id = a.id
  where tr.jenis = 'setoran'
    and tr.deleted_at is null
    and tr.tanggal >= (current_date - interval '30 days')
    and (p_instansi_id is null or a.instansi_id = p_instansi_id)
    and (p_kelompok_id is null or a.kelompok_id = p_kelompok_id);

  select coalesce(sum(tr.nominal), 0) into v_setoran_60_hari
  from public.transaksi tr
  join public.anggota a on tr.anggota_id = a.id
  where tr.jenis = 'setoran'
    and tr.deleted_at is null
    and tr.tanggal >= (current_date - interval '60 days')
    and tr.tanggal < (current_date - interval '30 days')
    and (p_instansi_id is null or a.instansi_id = p_instansi_id)
    and (p_kelompok_id is null or a.kelompok_id = p_kelompok_id);

  -- 3. Kalkulasi Heuristik AI Insight
  -- Velocity bulanan rata-rata
  v_rata_setoran_bulanan := greatest(v_setoran_30_hari, 100000);

  -- Estimasi bulan selesai = Sisa dana / Velocity setoran bulanan
  if v_sisa_dana > 0 and v_rata_setoran_bulanan > 0 then
    v_prediksi_bulan_selesai := round(v_sisa_dana / v_rata_setoran_bulanan, 1);
    v_prediksi_tanggal_selesai := current_date + (v_prediksi_bulan_selesai * interval '30 days');
  else
    v_prediksi_bulan_selesai := 0;
    v_prediksi_tanggal_selesai := current_date;
  end if;

  -- Rekomendasi setoran bulanan per anggota (Asumsi target 10 bulan)
  if v_anggota_aktif > 0 then
    v_rekomendasi_setoran_per_bulan := ceil((v_sisa_dana / 10) / v_anggota_aktif);
  else
    v_rekomendasi_setoran_per_bulan := ceil(v_sisa_dana / 10);
  end if;

  -- Percentage keaktifan anggota
  if v_total_anggota > 0 then
    v_keaktifan_pct := round((v_anggota_aktif::numeric / v_total_anggota::numeric) * 100, 1);
  else
    v_keaktifan_pct := 100;
  end if;

  -- Trend setoran (perbandingan 30 hari vs 60 hari)
  if v_setoran_60_hari > 0 then
    v_trend_pct := round(((v_setoran_30_hari - v_setoran_60_hari) / v_setoran_60_hari) * 100, 1);
  else
    v_trend_pct := 0;
  end if;

  if v_trend_pct > 5 then
    v_status_trend := 'naik';
  elsif v_trend_pct < -5 then
    v_status_trend := 'turun';
  else
    v_status_trend := 'stabil';
  end if;

  return json_build_object(
    'rekomendasi_setoran_per_bulan', v_rekomendasi_setoran_per_bulan,
    'prediksi_bulan_selesai', v_prediksi_bulan_selesai,
    'prediksi_tanggal_selesai', v_prediksi_tanggal_selesai,
    'keaktifan_pct', v_keaktifan_pct,
    'total_anggota', v_total_anggota,
    'anggota_aktif', v_anggota_aktif,
    'trend_pct', v_trend_pct,
    'status_trend', v_status_trend,
    'setoran_30_hari', v_setoran_30_hari,
    'total_saldo', v_total_saldo,
    'total_target', v_total_target,
    'sisa_dana', v_sisa_dana
  );
end;
$$;

grant execute on function public.get_ai_insights(uuid, uuid) to authenticated;
