-- ========================================================================================
-- FASE 6 - MODUL 12: PWA ADVANCED
-- Tabel untuk menyimpan langganan Push Notification Web Push
-- ========================================================================================

create table if not exists public.user_push_subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    endpoint text not null,
    p256dh text not null,
    auth text not null,
    user_agent text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(endpoint)
);

-- RLS untuk tabel langganan Push Notification
alter table public.user_push_subscriptions enable row level security;

-- Pengguna bisa mendaftarkan perangkatnya sendiri (Insert/Update)
drop policy if exists "Users can manage their own push subscriptions" on public.user_push_subscriptions;
create policy "Users can manage their own push subscriptions"
    on public.user_push_subscriptions
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Admin bisa membaca semua pendaftaran untuk mengirim notifikasi broadcast
drop policy if exists "Admins can view all push subscriptions" on public.user_push_subscriptions;
create policy "Admins can view all push subscriptions"
    on public.user_push_subscriptions
    for select
    using (public.is_admin());

-- Fungsi untuk update updated_at otomatis
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger untuk Updated At
drop trigger if exists handle_updated_at on public.user_push_subscriptions;
create trigger handle_updated_at before update on public.user_push_subscriptions
  for each row execute procedure public.handle_updated_at();
