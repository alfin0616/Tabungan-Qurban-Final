-- =========================================================
create table if not exists public.pengeluaran (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  kategori text not null check (
    kategori in ('listrik', 'air', 'kebersihan', 'atk', 'konsumsi', 'pemeliharaan', 'honor', 'lainnya')
  ),
  nominal numeric(14, 2) not null check (nominal > 0),
  keterangan text,
  bukti text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_pengeluaran_tanggal on public.pengeluaran (tanggal);

alter table public.pengeluaran enable row level security;

drop policy if exists "pengeluaran_authenticated_all" on public.pengeluaran;
create policy "pengeluaran_authenticated_all" on public.pengeluaran
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
