-- =============================================================================
-- FASE 6 - MODUL 4: WHATSAPP & EMAIL MESSAGING ABSTRACTION
-- =============================================================================

-- 1. Fungsi Helper RPC untuk Email Dispatcher (Security Definer)
create or replace function public.send_email_notification(
  p_recipient text,
  p_subject text,
  p_html text
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Akses ditolak: pengguna belum terautentikasi';
  end if;

  -- Catat log pengiriman di system_logs
  insert into public.system_logs (level, source, message, context_data)
  values (
    'info',
    'email_service',
    concat('Email dikirim ke: ', p_recipient, ' (Subject: ', p_subject, ')'),
    json_build_object('recipient', p_recipient, 'subject', p_subject)
  );

  return json_build_object('status', 'dispatched', 'recipient', p_recipient);
end;
$$;

grant execute on function public.send_email_notification(text, text, text) to authenticated;
