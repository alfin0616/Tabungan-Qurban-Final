-- ==================================================
-- MODUL 9: MONITORING & SYSTEM HEALTH METRICS (RPC)
-- ==================================================

-- RPC: Mengambil statistik & metrik kesehatan sistem lintas semua instansi
CREATE OR REPLACE FUNCTION public.get_system_health_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_instansi_count int;
  v_anggota_count int;
  v_transaksi_count int;
  v_total_saldo numeric;
  v_active_24h int;
  v_result json;
BEGIN
  -- Keamanan: Hanya superadmin yang boleh mengakses
  SELECT role INTO v_role FROM public.admin_profiles WHERE id = auth.uid();
  IF v_role IS NULL OR v_role != 'superadmin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang dapat mengakses metrik monitoring.';
  END IF;

  SELECT COUNT(*) INTO v_instansi_count FROM public.instansi WHERE status = true;
  SELECT COUNT(*) INTO v_anggota_count FROM public.anggota WHERE status = true;
  SELECT COUNT(*) INTO v_transaksi_count FROM public.transaksi;
  SELECT COALESCE(SUM(saldo), 0) INTO v_total_saldo FROM public.tabungan;

  -- Hitung pengguna aktif 24 jam terakhir dari audit_logs
  SELECT COUNT(DISTINCT user_id) INTO v_active_24h
  FROM public.audit_logs
  WHERE created_at >= NOW() - INTERVAL '24 hours';

  v_result := json_build_object(
    'status', 'healthy',
    'total_instansi', v_instansi_count,
    'total_anggota', v_anggota_count,
    'total_transaksi', v_transaksi_count,
    'total_saldo', v_total_saldo,
    'active_users_24h', v_active_24h,
    'server_time', NOW()
  );

  RETURN v_result;
END;
$$;

-- Grant izin execute ke authenticated users
GRANT EXECUTE ON FUNCTION public.get_system_health_metrics() TO authenticated;
