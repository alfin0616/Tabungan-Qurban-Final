-- =========================================================
-- FASE 5 MODUL 4 — AUDIT LOG
-- Tabel dan RPC untuk mencatat aktivitas pengguna (IP & Browser).
-- =========================================================

-- 1. TABEL AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references public.admin_profiles(id),
  instansi_id uuid references public.instansi(id) on delete cascade,
  role text,
  ip_address text,
  user_agent text,
  action text not null,
  description text
);

create index if not exists idx_audit_logs_instansi on public.audit_logs(instansi_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- Pastikan FK user_id mengarah ke admin_profiles agar bisa di-JOIN oleh PostgREST
do $$
begin
  alter table public.audit_logs drop constraint if exists audit_logs_user_id_fkey;
  alter table public.audit_logs add constraint audit_logs_user_id_fkey foreign key (user_id) references public.admin_profiles(id) on delete set null;
exception when others then
  -- abaikan jika constraint sudah benar atau tabel baru dibuat
end $$;

-- 2. RLS UNTUK AUDIT LOGS
alter table public.audit_logs enable row level security;

-- Super Admin bisa melihat semua log, Admin Instansi hanya melihat log instansinya
drop policy if exists "audit_logs_select" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs
  for select using (
    public.is_super_admin() 
    or (public.is_admin() and instansi_id = public.current_instansi_id())
  );

-- 3. RPC LOG AUDIT EVENT
create or replace function public.log_audit_event(
  p_action text,
  p_description text
) returns void as $$
declare
  v_ip text;
  v_user_agent text;
  v_role text;
  v_instansi_id uuid;
begin
  -- Tangkap IP Address
  begin
    v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    -- x-forwarded-for bisa berupa daftar IP dipisahkan koma, ambil yang pertama
    if v_ip like '%,%' then
      v_ip := split_part(v_ip, ',', 1);
    end if;
  exception when others then
    v_ip := 'unknown';
  end;
  
  -- Tangkap User Agent (Browser)
  begin
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  exception when others then
    v_user_agent := 'unknown';
  end;

  -- Ambil data profil user saat ini
  select role, instansi_id into v_role, v_instansi_id
  from public.admin_profiles where id = auth.uid();

  -- Jika dipanggil oleh jamaah secara tidak terduga, periksa di tabel anggota
  if v_role is null then
    select 'jamaah', instansi_id into v_role, v_instansi_id
    from public.anggota where user_id = auth.uid() limit 1;
  end if;

  -- Insert ke tabel audit_logs
  insert into public.audit_logs (
    user_id, instansi_id, role, ip_address, user_agent, action, description
  ) values (
    auth.uid(), v_instansi_id, coalesce(v_role, 'unknown'), coalesce(v_ip, 'unknown'), coalesce(v_user_agent, 'unknown'), p_action, p_description
  );
end;
$$ language plpgsql security definer set search_path = public;
