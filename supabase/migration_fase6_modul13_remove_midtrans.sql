-- ========================================================================================
-- FASE 6 - MODUL 13 (REVISI): MENGHAPUS FITUR MIDTRANS
-- Menghapus kolom konfigurasi Midtrans karena fitur tidak akan digunakan
-- ========================================================================================

-- Menghapus kolom dari tabel system_settings
alter table public.system_settings 
  drop column if exists midtrans_enabled,
  drop column if exists midtrans_environment,
  drop column if exists midtrans_merchant_id,
  drop column if exists midtrans_client_key,
  drop column if exists midtrans_server_key;

-- (Opsional) Memperbarui fungsi update_system_settings dengan menghapus parameter midtrans
-- Karena Supabase RPC tidak mendukung sekadar drop argumen secara mudah, kita buat ulang fungsinya:
drop function if exists public.update_system_settings(jsonb);

create or replace function public.update_system_settings(p_settings jsonb)
returns public.system_settings
language plpgsql
security definer set search_path = public
as $$
declare
  v_result public.system_settings;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak. Hanya admin yang dapat mengubah pengaturan.';
  end if;

  update public.system_settings
  set
    theme_color = coalesce((p_settings->>'theme_color'), theme_color),
    dark_mode_default = coalesce((p_settings->>'dark_mode_default')::boolean, dark_mode_default),
    allow_registration = coalesce((p_settings->>'allow_registration')::boolean, allow_registration),
    allow_jamaah_login = coalesce((p_settings->>'allow_jamaah_login')::boolean, allow_jamaah_login),
    require_email_verification = coalesce((p_settings->>'require_email_verification')::boolean, require_email_verification),
    app_name = coalesce((p_settings->>'app_name'), app_name),
    company_name = coalesce((p_settings->>'company_name'), company_name),
    contact_email = coalesce((p_settings->>'contact_email'), contact_email),
    contact_phone = coalesce((p_settings->>'contact_phone'), contact_phone),
    maintenance_mode = coalesce((p_settings->>'maintenance_mode')::boolean, maintenance_mode),
    maintenance_message = coalesce((p_settings->>'maintenance_message'), maintenance_message),
    ai_insight_enabled = coalesce((p_settings->>'ai_insight_enabled')::boolean, ai_insight_enabled),
    ai_provider = coalesce((p_settings->>'ai_provider'), ai_provider),
    whatsapp_gateway_enabled = coalesce((p_settings->>'whatsapp_gateway_enabled')::boolean, whatsapp_gateway_enabled),
    whatsapp_provider = coalesce((p_settings->>'whatsapp_provider'), whatsapp_provider),
    updated_at = now(),
    updated_by = auth.uid()
  where id = 1
  returning * into v_result;

  return v_result;
end;
$$;
