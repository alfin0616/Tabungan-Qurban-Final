-- ==============================================================================
-- MIGRATION: FASE 5 - MODUL 12 (SETTING SISTEM NASIONAL - SUPER ADMIN)
-- Deskripsi: Tabel singleton public.system_settings untuk menyimpan seluruh
--            pengaturan sistem nasional SIQURBAN (Branding, Payment, Infra,
--            Notifikasi, Backup, dan Maintenance Mode).
-- ==============================================================================

-- 1. Buat tabel public.system_settings (singleton row: id = 1)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  
  -- BRANDING & IDENTITAS APLIKASI
  app_name text NOT NULL DEFAULT 'SIQURBAN',
  logo_url text NOT NULL DEFAULT '/logo-siqurban.png',
  favicon_url text NOT NULL DEFAULT '/favicon.ico',
  primary_color text NOT NULL DEFAULT '#059669',   -- Emerald 600
  secondary_color text NOT NULL DEFAULT '#10b981', -- Emerald 500
  
  -- LOKALISASI & WAKTU
  language text NOT NULL DEFAULT 'id',             -- 'id' (Indonesia), 'en' (English), 'ar' (Arabic)
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',   -- 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'
  currency text NOT NULL DEFAULT 'IDR',            -- 'IDR', 'SAR', 'USD'
  
  -- REKENING NASIONAL / PUSAT (Untuk informasi pembayaran konvensional)
  bank_name text NOT NULL DEFAULT 'Bank Syariah Indonesia (BSI)',
  bank_account_number text NOT NULL DEFAULT '7123456789',
  bank_account_name text NOT NULL DEFAULT 'Yayasan Siqurban Indonesia',
  
  -- INTEGRASI MIDTRANS (PAYMENT GATEWAY)
  midtrans_enabled boolean NOT NULL DEFAULT true,
  midtrans_environment text NOT NULL DEFAULT 'sandbox', -- 'sandbox', 'production'
  midtrans_merchant_id text NOT NULL DEFAULT 'G991234567',
  midtrans_client_key text NOT NULL DEFAULT 'SB-Mid-client-xxx',
  midtrans_server_key text NOT NULL DEFAULT 'SB-Mid-server-xxx',
  
  -- INTEGRASI SUPABASE (INFRASTRUCTURE & STORAGE)
  supabase_url text NOT NULL DEFAULT 'https://siqurban-beta.supabase.co',
  supabase_anon_key text NOT NULL DEFAULT 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.siqurban_anon_token',
  supabase_service_role_key text NOT NULL DEFAULT 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.siqurban_service_token',
  supabase_storage_bucket text NOT NULL DEFAULT 'siqurban-assets',
  
  -- INTEGRASI EMAIL SMTP (NOTIFIKASI EMAIL)
  email_smtp_host text NOT NULL DEFAULT 'smtp.mailtrap.io',
  email_smtp_port integer NOT NULL DEFAULT 587,
  email_smtp_user text NOT NULL DEFAULT 'siqurban_smtp_user',
  email_smtp_password text NOT NULL DEFAULT '••••••••••••••••',
  email_sender_name text NOT NULL DEFAULT 'SIQURBAN Notification Center',
  email_sender_email text NOT NULL DEFAULT 'no-reply@siqurban.id',
  email_ssl_enabled boolean NOT NULL DEFAULT true,
  
  -- INTEGRASI WHATSAPP GATEWAY (FONNTE / WABLAS)
  wa_gateway_url text NOT NULL DEFAULT 'https://api.fonnte.com/send',
  wa_api_key text NOT NULL DEFAULT 'fn_token_siqurban_12345',
  wa_sender_number text NOT NULL DEFAULT '0811234567890',
  wa_notification_enabled boolean NOT NULL DEFAULT true,
  
  -- PENGATURAN BACKUP & RECOVERY OTOMATIS
  backup_schedule text NOT NULL DEFAULT 'harian',       -- 'harian', 'mingguan', 'bulanan'
  backup_retention_days integer NOT NULL DEFAULT 30,
  backup_cloud_target text NOT NULL DEFAULT 'supabase_storage', -- 'supabase_storage', 'aws_s3', 'google_drive'
  backup_last_run_at timestamptz DEFAULT now() - interval '6 hours',
  
  -- MAINTENANCE MODE (PEMELIHARAAN SISTEM)
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text NOT NULL DEFAULT 'Sistem sedang dalam pemeliharaan berkala untuk persiapan penyembelihan Idul Adha. Mohon kembali beberapa saat lagi.',
  maintenance_allowed_ips text NOT NULL DEFAULT '127.0.0.1, 192.168.1.1',
  
  -- METADATA
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Insert default singleton row jika belum ada
INSERT INTO public.system_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policy RLS untuk SELECT: Semua pengguna berautentikasi & anon bisa membaca pengaturan branding/maintenance
CREATE POLICY "Allow public read on system_settings"
  ON public.system_settings
  FOR SELECT
  USING (true);

-- 5. Policy RLS untuk UPDATE: Hanya Super Admin yang boleh memperbarui pengaturan sistem nasional
CREATE POLICY "Allow superadmin update on system_settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
        AND admin_profiles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
        AND admin_profiles.role = 'superadmin'
    )
  );

-- 6. RPC helper untuk memperbarui system_settings secara mudah & aman (Security Definer)

-- Hapus semua versi fungsi update_system_settings sebelumnya (mencegah error fungsi tidak unik akibat perubahan parameter)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'update_system_settings'
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.update_system_settings(
  p_app_name text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_favicon_url text DEFAULT NULL,
  p_primary_color text DEFAULT NULL,
  p_secondary_color text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_timezone text DEFAULT NULL,
  p_currency text DEFAULT NULL,
  p_bank_name text DEFAULT NULL,
  p_bank_account_number text DEFAULT NULL,
  p_bank_account_name text DEFAULT NULL,
  p_midtrans_enabled boolean DEFAULT NULL,
  p_midtrans_environment text DEFAULT NULL,
  p_midtrans_merchant_id text DEFAULT NULL,
  p_midtrans_client_key text DEFAULT NULL,
  p_midtrans_server_key text DEFAULT NULL,
  p_supabase_url text DEFAULT NULL,
  p_supabase_anon_key text DEFAULT NULL,
  p_supabase_service_role_key text DEFAULT NULL,
  p_supabase_storage_bucket text DEFAULT NULL,
  p_email_smtp_host text DEFAULT NULL,
  p_email_smtp_port integer DEFAULT NULL,
  p_email_smtp_user text DEFAULT NULL,
  p_email_smtp_password text DEFAULT NULL,
  p_email_sender_name text DEFAULT NULL,
  p_email_sender_email text DEFAULT NULL,
  p_email_ssl_enabled boolean DEFAULT NULL,
  p_wa_gateway_url text DEFAULT NULL,
  p_wa_api_key text DEFAULT NULL,
  p_wa_sender_number text DEFAULT NULL,
  p_wa_notification_enabled boolean DEFAULT NULL,
  p_backup_schedule text DEFAULT NULL,
  p_backup_retention_days integer DEFAULT NULL,
  p_backup_cloud_target text DEFAULT NULL,
  p_maintenance_mode boolean DEFAULT NULL,
  p_maintenance_message text DEFAULT NULL,
  p_maintenance_allowed_ips text DEFAULT NULL
)
RETURNS public.system_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
  v_updated public.system_settings;
BEGIN
  -- Cek apakah caller adalah superadmin
  SELECT role INTO v_user_role
  FROM public.admin_profiles
  WHERE id = auth.uid();

  IF v_user_role IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang dapat mengubah pengaturan sistem nasional.';
  END IF;

  UPDATE public.system_settings
  SET
    app_name = COALESCE(p_app_name, app_name),
    logo_url = COALESCE(p_logo_url, logo_url),
    favicon_url = COALESCE(p_favicon_url, favicon_url),
    primary_color = COALESCE(p_primary_color, primary_color),
    secondary_color = COALESCE(p_secondary_color, secondary_color),
    language = COALESCE(p_language, language),
    timezone = COALESCE(p_timezone, timezone),
    currency = COALESCE(p_currency, currency),
    bank_name = COALESCE(p_bank_name, bank_name),
    bank_account_number = COALESCE(p_bank_account_number, bank_account_number),
    bank_account_name = COALESCE(p_bank_account_name, bank_account_name),
    midtrans_enabled = COALESCE(p_midtrans_enabled, midtrans_enabled),
    midtrans_environment = COALESCE(p_midtrans_environment, midtrans_environment),
    midtrans_merchant_id = COALESCE(p_midtrans_merchant_id, midtrans_merchant_id),
    midtrans_client_key = COALESCE(p_midtrans_client_key, midtrans_client_key),
    midtrans_server_key = COALESCE(p_midtrans_server_key, midtrans_server_key),
    supabase_url = COALESCE(p_supabase_url, supabase_url),
    supabase_anon_key = COALESCE(p_supabase_anon_key, supabase_anon_key),
    supabase_service_role_key = COALESCE(p_supabase_service_role_key, supabase_service_role_key),
    supabase_storage_bucket = COALESCE(p_supabase_storage_bucket, supabase_storage_bucket),
    email_smtp_host = COALESCE(p_email_smtp_host, email_smtp_host),
    email_smtp_port = COALESCE(p_email_smtp_port, email_smtp_port),
    email_smtp_user = COALESCE(p_email_smtp_user, email_smtp_user),
    email_smtp_password = COALESCE(p_email_smtp_password, email_smtp_password),
    email_sender_name = COALESCE(p_email_sender_name, email_sender_name),
    email_sender_email = COALESCE(p_email_sender_email, email_sender_email),
    email_ssl_enabled = COALESCE(p_email_ssl_enabled, email_ssl_enabled),
    wa_gateway_url = COALESCE(p_wa_gateway_url, wa_gateway_url),
    wa_api_key = COALESCE(p_wa_api_key, wa_api_key),
    wa_sender_number = COALESCE(p_wa_sender_number, wa_sender_number),
    wa_notification_enabled = COALESCE(p_wa_notification_enabled, wa_notification_enabled),
    backup_schedule = COALESCE(p_backup_schedule, backup_schedule),
    backup_retention_days = COALESCE(p_backup_retention_days, backup_retention_days),
    backup_cloud_target = COALESCE(p_backup_cloud_target, backup_cloud_target),
    maintenance_mode = COALESCE(p_maintenance_mode, maintenance_mode),
    maintenance_message = COALESCE(p_maintenance_message, maintenance_message),
    maintenance_allowed_ips = COALESCE(p_maintenance_allowed_ips, maintenance_allowed_ips),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id = 1
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

-- 7. Grant permission
GRANT SELECT ON public.system_settings TO anon, authenticated;
