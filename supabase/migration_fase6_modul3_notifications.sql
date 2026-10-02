-- =============================================================================
-- FASE 6 - MODUL 3: NOTIFICATION CENTER (SUPABASE REALTIME & NOTIFICATION TYPES)
-- =============================================================================

-- 1. Tambah kolom jenis_notifikasi jika belum ada
alter table public.notifications 
  add column if not exists jenis_notifikasi text default 'system_announcement';

-- 2. Aktifkan Supabase Realtime pada tabel notifications
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.notifications;
commit;

-- 3. Trigger Otomatis Notifikasi Kelompok Penuh / Hampir Penuh
create or replace function public.trg_notify_kelompok_capacity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer;
  v_nama_kelompok text;
  v_instansi_id uuid;
begin
  select nama_kelompok, instansi_id into v_nama_kelompok, v_instansi_id
  from public.kelompok
  where id = NEW.kelompok_id;

  select count(*) into v_count
  from public.anggota
  where kelompok_id = NEW.kelompok_id and status = true and deleted_at is null;

  if v_count = 7 then
    insert into public.notifications (instansi_id, jenis_notifikasi, title, message, link, read)
    values (
      v_instansi_id,
      'kelompok_sudah_penuh',
      'Kelompok Sudah Penuh (7/7)',
      concat('Kelompok ', v_nama_kelompok, ' telah mencapai kapasitas penuh (7 anggota).'),
      '/anggota',
      false
    );
  elsif v_count = 5 or v_count = 6 then
    insert into public.notifications (instansi_id, jenis_notifikasi, title, message, link, read)
    values (
      v_instansi_id,
      'kelompok_hampir_penuh',
      'Kelompok Hampir Penuh',
      concat('Kelompok ', v_nama_kelompok, ' saat ini terisi ', v_count, '/7 anggota.'),
      '/anggota',
      false
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_kelompok_capacity_after_insert on public.anggota;
create trigger trg_notify_kelompok_capacity_after_insert
  after insert on public.anggota
  for each row
  execute function public.trg_notify_kelompok_capacity();


-- 4. Trigger Otomatis Target Qurban Tercapai / Hampir Tercapai
create or replace function public.trg_notify_target_progress()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_target numeric;
  v_saldo numeric;
  v_nama_kelompok text;
  v_instansi_id uuid;
  v_pct numeric;
begin
  select nama_kelompok, instansi_id, target_dana into v_nama_kelompok, v_instansi_id, v_target
  from public.kelompok
  where id = NEW.kelompok_id;

  select coalesce(sum(saldo), 0) into v_saldo
  from public.tabungan
  where kelompok_id = NEW.kelompok_id and deleted_at is null;

  if v_target > 0 then
    v_pct := (v_saldo / v_target) * 100;

    if v_pct >= 100 then
      insert into public.notifications (instansi_id, jenis_notifikasi, title, message, link, read)
      values (
        v_instansi_id,
        'target_tercapai',
        'Target Qurban Tercapai (100%) 🎉',
        concat('Alhamdulillah! Tabungan Kelompok ', v_nama_kelompok, ' telah mencapai target dana qurban.'),
        '/tabungan',
        false
      );
    elsif v_pct >= 80 then
      insert into public.notifications (instansi_id, jenis_notifikasi, title, message, link, read)
      values (
        v_instansi_id,
        'target_hampir_tercapai',
        'Target Qurban Hampir Tercapai',
        concat('Kelompok ', v_nama_kelompok, ' telah mencapai ', round(v_pct, 1), '% dari target dana.'),
        '/tabungan',
        false
      );
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_target_progress_after_update on public.tabungan;
create trigger trg_notify_target_progress_after_update
  after update on public.tabungan
  for each row
  when (OLD.saldo IS DISTINCT FROM NEW.saldo)
  execute function public.trg_notify_target_progress();
