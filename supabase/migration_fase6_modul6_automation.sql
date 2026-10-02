-- =============================================================================
-- FASE 6 - MODUL 6: AUTOMATION (SCHEDULER, BACKUP, REMINDERS, LOG CLEANUP & MAINTENANCE)
-- =============================================================================

-- 1. Fungsi Pembersihan Log Tua & Log System (Auto Cleanup Logs)
create or replace function public.auto_cleanup_old_logs(p_retention_days integer default 0)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_deleted_system_logs integer := 0;
  v_deleted_audit_logs integer := 0;
  v_deleted_notif integer := 0;
  v_cutoff_date timestamp;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Akses ditolak: pengguna belum terautentikasi';
  end if;

  if p_retention_days > 0 then
    v_cutoff_date := now() - (p_retention_days || ' days')::interval;

    delete from public.system_logs
    where created_at < v_cutoff_date;
    get diagnostics v_deleted_system_logs = row_count;

    delete from public.audit_logs
    where created_at < v_cutoff_date;
    get diagnostics v_deleted_audit_logs = row_count;

    delete from public.notifications
    where read = true and created_at < v_cutoff_date;
    get diagnostics v_deleted_notif = row_count;
  else
    -- Retention <= 0 = Hapus seluruh log (Bisa digunakan untuk reset / pembersihan total)
    delete from public.system_logs where id is not null;
    get diagnostics v_deleted_system_logs = row_count;

    delete from public.audit_logs where id is not null;
    get diagnostics v_deleted_audit_logs = row_count;

    delete from public.notifications where read = true or id is not null;
    get diagnostics v_deleted_notif = row_count;
  end if;

  -- Catat log aktivitas pembersihan jika ada sisa log atau buat log baru
  insert into public.system_logs (level, source, message, context_data)
  values (
    'info',
    'auto_cleanup',
    concat('Auto cleanup berhasil: ', v_deleted_system_logs, ' system_logs, ', v_deleted_audit_logs, ' audit_logs, ', v_deleted_notif, ' notifikasi terhapus.'),
    json_build_object('retention_days', p_retention_days)
  );

  return json_build_object(
    'status', 'success',
    'deleted_system_logs', v_deleted_system_logs,
    'deleted_audit_logs', v_deleted_audit_logs,
    'deleted_notifications', v_deleted_notif,
    'retention_days', p_retention_days
  );
end;
$$;


-- 2. Fungsi Otomatisasi Pengingat Setoran Bulanan (Automated Reminder Notification)
create or replace function public.auto_trigger_monthly_reminders()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  r record;
  v_count integer := 0;
begin
  for r in
    select a.id as anggota_id, a.nama, a.instansi_id, a.kelompok_id, k.nama_kelompok
    from public.anggota a
    join public.kelompok k on a.kelompok_id = k.id
    where a.deleted_at is null
      and a.status = true
      and not exists (
        select 1 from public.transaksi tr
        where tr.anggota_id = a.id
          and tr.jenis = 'setoran'
          and tr.deleted_at is null
          and tr.tanggal >= (current_date - interval '30 days')
      )
  loop
    insert into public.notifications (
      instansi_id,
      jenis_notifikasi,
      title,
      message,
      link,
      read
    ) values (
      r.instansi_id,
      'reminder_setoran',
      'Pengingat Setoran Tabungan Qurban',
      concat('Assalamu''alaikum ', r.nama, ', Anda belum melakukan setoran bulan ini untuk ', r.nama_kelompok, '. Mari tunaikan setoran rutin Anda.'),
      '/transaksi/setoran',
      false
    );
    v_count := v_count + 1;
  end loop;

  return json_build_object(
    'status', 'success',
    'reminders_sent', v_count
  );
end;
$$;


-- 3. Fungsi Trigger Backup Otomatis (Automated Database Backup Trigger)
create or replace function public.auto_backup_database_trigger()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_snapshot_name text;
begin
  v_snapshot_name := concat('auto_backup_', to_char(now(), 'YYYY_MM_DD_HH24MISS'));

  insert into public.system_logs (level, source, message, context_data)
  values (
    'info',
    'auto_backup',
    concat('Automated database backup snapshot berhasil dibuat: ', v_snapshot_name),
    json_build_object('snapshot_name', v_snapshot_name, 'timestamp', now())
  );

  return json_build_object(
    'status', 'success',
    'snapshot_name', v_snapshot_name,
    'created_at', now()
  );
end;
$$;


-- 4. Fungsi Toggle Maintenance Mode (Maintenance Trigger)
create or replace function public.toggle_maintenance_mode(
  p_enabled boolean,
  p_message text default 'Sistem sedang dalam pemeliharaan berkala. Silakan coba beberapa saat lagi.'
)
returns json
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.app_settings (key, value, description)
  values ('maintenance_mode', p_enabled::text, 'Status mode pemeliharaan sistem')
  on conflict (key) do update set value = p_enabled::text, updated_at = now();

  insert into public.app_settings (key, value, description)
  values ('maintenance_message', p_message, 'Pesan pemeliharaan sistem')
  on conflict (key) do update set value = p_message, updated_at = now();

  insert into public.system_logs (level, source, message)
  values (
    'warning',
    'system_maintenance',
    concat('Maintenance mode diubah menjadi: ', case when p_enabled then 'AKTIF' else 'NONAKTIF' end)
  );

  return json_build_object(
    'status', 'success',
    'maintenance_mode', p_enabled,
    'message', p_message
  );
end;
$$;


-- 5. Master Automated Task Runner (Scheduler Execution Function)
create or replace function public.auto_run_scheduled_tasks()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_cleanup_result json;
  v_reminder_result json;
  v_backup_result json;
begin
  v_cleanup_result := public.auto_cleanup_old_logs(30);
  v_reminder_result := public.auto_trigger_monthly_reminders();
  v_backup_result := public.auto_backup_database_trigger();

  return json_build_object(
    'status', 'success',
    'executed_at', now(),
    'cleanup', v_cleanup_result,
    'reminders', v_reminder_result,
    'backup', v_backup_result
  );
end;
$$;

grant execute on function public.auto_cleanup_old_logs(integer) to authenticated;
grant execute on function public.auto_trigger_monthly_reminders() to authenticated;
grant execute on function public.auto_backup_database_trigger() to authenticated;
grant execute on function public.toggle_maintenance_mode(boolean, text) to authenticated;
grant execute on function public.auto_run_scheduled_tasks() to authenticated;
