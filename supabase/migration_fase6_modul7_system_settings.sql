-- =============================================================================
-- FASE 6 - MODUL 7: SYSTEM SETTINGS (PENGATURAN SISTEM NASIONAL LENGKAP)
-- =============================================================================

-- 1. Buat / Perbarui Tabel System Settings
create table if not exists public.system_settings (
  id integer primary key default 1 check (id = 1),
  app_name text not null default 'SIQURBAN',
  logo_url text default '/logo-siqurban.png',
  favicon_url text default '/favicon.ico',
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  primary_color text default '#059669',
  secondary_color text default '#10b981',
  language text default 'id' check (language in ('id', 'en')),
  timezone text default 'Asia/Jakarta',
  currency text default 'IDR',
  bank_name text default 'Bank Syariah Indonesia (BSI)',
  bank_account_number text default '7123456789',
  bank_account_name text default 'Yayasan Siqurban Indonesia',
  midtrans_enabled boolean default true,
  midtrans_environment text default 'sandbox' check (midtrans_environment in ('sandbox', 'production')),
  midtrans_merchant_id text default '',
  midtrans_client_key text default '',
  midtrans_server_key text default '',
  supabase_url text default '',
  supabase_anon_key text default '',
  supabase_service_role_key text default '',
  supabase_storage_bucket text default 'siqurban-assets',
  email_smtp_host text default 'smtp.mailtrap.io',
  email_smtp_port integer default 587,
  email_smtp_user text default '',
  email_smtp_password text default '',
  email_sender_name text default 'SIQURBAN Notification Center',
  email_sender_email text default 'no-reply@siqurban.id',
  email_ssl_enabled boolean default true,
  wa_gateway_url text default 'https://api.fonnte.com/send',
  wa_api_key text default '',
  wa_sender_number text default '',
  wa_notification_enabled boolean default true,
  backup_schedule text default 'harian',
  backup_retention_days integer default 30,
  backup_cloud_target text default 'supabase_storage',
  maintenance_mode boolean default false,
  maintenance_message text default 'Sistem sedang dalam pemeliharaan berkala. Silakan coba beberapa saat lagi.',
  maintenance_allowed_ips text default '127.0.0.1',
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- Inisialisasi baris default (ID = 1) jika belum ada
insert into public.system_settings (id)
values (1)
on conflict (id) do nothing;

-- Enable RLS
alter table public.system_settings enable row level security;

-- Policy Read: Dapat dibaca oleh semua pengguna terautentikasi (atau publik untuk branding/maintenance)
drop policy if exists "system_settings_select_policy" on public.system_settings;
create policy "system_settings_select_policy" on public.system_settings
  for select using (true);

-- Policy Write: Hanya Super Admin yang dapat mengubah/meng-update
drop policy if exists "system_settings_write_policy" on public.system_settings;
create policy "system_settings_write_policy" on public.system_settings
  for all using (public.is_super_admin());


-- 2. Fungsi RPC Ambil Pengaturan Sistem (get_system_settings)
create or replace function public.get_system_settings()
returns json
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_result json;
begin
  select row_to_json(s) into v_result
  from public.system_settings s
  where s.id = 1;

  if v_result is null then
    return json_build_object(
      'app_name', 'SIQURBAN',
      'logo_url', '/logo-siqurban.png',
      'favicon_url', '/favicon.ico',
      'theme', 'system',
      'primary_color', '#059669',
      'language', 'id',
      'timezone', 'Asia/Jakarta',
      'currency', 'IDR',
      'maintenance_mode', false
    );
  end if;

  return v_result;
end;
$$;


-- 3. Fungsi RPC Update Pengaturan Sistem (update_system_settings)
create or replace function public.update_system_settings(p_settings jsonb)
returns json
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Akses ditolak: hanya Super Admin yang dapat meng-update pengaturan sistem nasional';
  end if;

  update public.system_settings
  set
    app_name = coalesce((p_settings->>'app_name'), app_name),
    logo_url = coalesce((p_settings->>'logo_url'), logo_url),
    favicon_url = coalesce((p_settings->>'favicon_url'), favicon_url),
    theme = coalesce((p_settings->>'theme'), theme),
    primary_color = coalesce((p_settings->>'primary_color'), primary_color),
    secondary_color = coalesce((p_settings->>'secondary_color'), secondary_color),
    language = coalesce((p_settings->>'language'), language),
    timezone = coalesce((p_settings->>'timezone'), timezone),
    currency = coalesce((p_settings->>'currency'), currency),
    bank_name = coalesce((p_settings->>'bank_name'), bank_name),
    bank_account_number = coalesce((p_settings->>'bank_account_number'), bank_account_number),
    bank_account_name = coalesce((p_settings->>'bank_account_name'), bank_account_name),
    midtrans_enabled = coalesce((p_settings->>'midtrans_enabled')::boolean, midtrans_enabled),
    midtrans_environment = coalesce((p_settings->>'midtrans_environment'), midtrans_environment),
    midtrans_merchant_id = coalesce((p_settings->>'midtrans_merchant_id'), midtrans_merchant_id),
    midtrans_client_key = coalesce((p_settings->>'midtrans_client_key'), midtrans_client_key),
    midtrans_server_key = coalesce((p_settings->>'midtrans_server_key'), midtrans_server_key),
    supabase_url = coalesce((p_settings->>'supabase_url'), supabase_url),
    supabase_anon_key = coalesce((p_settings->>'supabase_anon_key'), supabase_anon_key),
    supabase_service_role_key = coalesce((p_settings->>'supabase_service_role_key'), supabase_service_role_key),
    supabase_storage_bucket = coalesce((p_settings->>'supabase_storage_bucket'), supabase_storage_bucket),
    email_smtp_host = coalesce((p_settings->>'email_smtp_host'), email_smtp_host),
    email_smtp_port = coalesce((p_settings->>'email_smtp_port')::integer, email_smtp_port),
    email_smtp_user = coalesce((p_settings->>'email_smtp_user'), email_smtp_user),
    email_smtp_password = coalesce((p_settings->>'email_smtp_password'), email_smtp_password),
    email_sender_name = coalesce((p_settings->>'email_sender_name'), email_sender_name),
    email_sender_email = coalesce((p_settings->>'email_sender_email'), email_sender_email),
    email_ssl_enabled = coalesce((p_settings->>'email_ssl_enabled')::boolean, email_ssl_enabled),
    wa_gateway_url = coalesce((p_settings->>'wa_gateway_url'), wa_gateway_url),
    wa_api_key = coalesce((p_settings->>'wa_api_key'), wa_api_key),
    wa_sender_number = coalesce((p_settings->>'wa_sender_number'), wa_sender_number),
    wa_notification_enabled = coalesce((p_settings->>'wa_notification_enabled')::boolean, wa_notification_enabled),
    backup_schedule = coalesce((p_settings->>'backup_schedule'), backup_schedule),
    backup_retention_days = coalesce((p_settings->>'backup_retention_days')::integer, backup_retention_days),
    backup_cloud_target = coalesce((p_settings->>'backup_cloud_target'), backup_cloud_target),
    maintenance_mode = coalesce((p_settings->>'maintenance_mode')::boolean, maintenance_mode),
    maintenance_message = coalesce((p_settings->>'maintenance_message'), maintenance_message),
    maintenance_allowed_ips = coalesce((p_settings->>'maintenance_allowed_ips'), maintenance_allowed_ips),
    updated_at = now(),
    updated_by = auth.uid()
  where id = 1;

  -- Catat ke system_logs
  insert into public.system_logs (level, source, message, context_data)
  values (
    'info',
    'system_settings',
    'Pengaturan sistem nasional berhasil diperbarui oleh Super Admin',
    p_settings
  );

  return json_build_object('status', 'success', 'message', 'Pengaturan sistem berhasil disimpan');
end;
$$;

grant execute on function public.get_system_settings() to authenticated, anon;
grant execute on function public.update_system_settings(jsonb) to authenticated;
