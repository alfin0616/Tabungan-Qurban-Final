-- =========================================================
-- FASE 5 MODUL 3 — DATABASE HARDENING
-- Audit Columns, Soft Delete, CHECK Constraints, UNIQUE Constraints,
-- Foreign Key Cascade, dan Composite Indexes.
-- =========================================================

-- =========================================================
-- 1. ADD AUDIT & SOFT DELETE COLUMNS
-- =========================================================

alter table public.admin_profiles 
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_by uuid references auth.users(id);

alter table public.instansi 
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_by uuid references auth.users(id);

alter table public.kelompok 
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_by uuid references auth.users(id);

alter table public.anggota 
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_by uuid references auth.users(id);

alter table public.tabungan 
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_by uuid references auth.users(id);

alter table public.transaksi 
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_by uuid references auth.users(id);

alter table public.pengeluaran 
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_by uuid references auth.users(id);

alter table public.pengaturan 
  add column if not exists updated_at timestamptz default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_by uuid references auth.users(id);


-- =========================================================
-- 2. AUTO UPDATED_AT TRIGGER
-- =========================================================

create or replace function public.trg_set_audit_timestamps()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  if auth.uid() is not null then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_audit_admin_profiles on public.admin_profiles;
create trigger set_audit_admin_profiles before update on public.admin_profiles for each row execute procedure public.trg_set_audit_timestamps();

drop trigger if exists set_audit_instansi on public.instansi;
create trigger set_audit_instansi before update on public.instansi for each row execute procedure public.trg_set_audit_timestamps();

drop trigger if exists set_audit_kelompok on public.kelompok;
create trigger set_audit_kelompok before update on public.kelompok for each row execute procedure public.trg_set_audit_timestamps();

drop trigger if exists set_audit_anggota on public.anggota;
create trigger set_audit_anggota before update on public.anggota for each row execute procedure public.trg_set_audit_timestamps();

drop trigger if exists set_audit_tabungan on public.tabungan;
create trigger set_audit_tabungan before update on public.tabungan for each row execute procedure public.trg_set_audit_timestamps();

drop trigger if exists set_audit_transaksi on public.transaksi;
create trigger set_audit_transaksi before update on public.transaksi for each row execute procedure public.trg_set_audit_timestamps();

drop trigger if exists set_audit_pengeluaran on public.pengeluaran;
create trigger set_audit_pengeluaran before update on public.pengeluaran for each row execute procedure public.trg_set_audit_timestamps();

drop trigger if exists set_audit_pengaturan on public.pengaturan;
create trigger set_audit_pengaturan before update on public.pengaturan for each row execute procedure public.trg_set_audit_timestamps();


-- =========================================================
-- 3. CHECK & UNIQUE CONSTRAINTS
-- =========================================================

do $$
begin
  alter table public.anggota add constraint anggota_no_hp_length_check check (length(no_hp) >= 9) not valid;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.tabungan add constraint tabungan_saldo_check check (saldo >= 0) not valid;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.kelompok add constraint kelompok_target_dana_check check (target_dana >= 0) not valid;
exception when duplicate_object then null;
end $$;


-- =========================================================
-- 4. CASCADING FOREIGN KEYS
-- =========================================================

alter table public.anggota drop constraint if exists anggota_instansi_id_fkey;
alter table public.anggota add constraint anggota_instansi_id_fkey foreign key (instansi_id) references public.instansi(id) on delete cascade;

alter table public.anggota drop constraint if exists anggota_kelompok_id_fkey;
alter table public.anggota add constraint anggota_kelompok_id_fkey foreign key (kelompok_id) references public.kelompok(id) on delete set null;

alter table public.tabungan drop constraint if exists tabungan_instansi_id_fkey;
alter table public.tabungan add constraint tabungan_instansi_id_fkey foreign key (instansi_id) references public.instansi(id) on delete cascade;

alter table public.transaksi drop constraint if exists transaksi_instansi_id_fkey;
alter table public.transaksi add constraint transaksi_instansi_id_fkey foreign key (instansi_id) references public.instansi(id) on delete cascade;

alter table public.pengeluaran drop constraint if exists pengeluaran_instansi_id_fkey;
alter table public.pengeluaran add constraint pengeluaran_instansi_id_fkey foreign key (instansi_id) references public.instansi(id) on delete cascade;


-- =========================================================
-- 5. COMPOSITE INDEXES
-- =========================================================

create index if not exists idx_anggota_instansi_status_deleted on public.anggota (instansi_id, status, deleted_at);
create index if not exists idx_transaksi_instansi_tanggal_deleted on public.transaksi (instansi_id, tanggal, deleted_at);
create index if not exists idx_kelompok_instansi_deleted on public.kelompok (instansi_id, deleted_at);
create index if not exists idx_tabungan_instansi_deleted on public.tabungan (instansi_id, deleted_at);
create index if not exists idx_pengeluaran_instansi_deleted on public.pengeluaran (instansi_id, deleted_at);


-- =========================================================
-- 6. REWRITE RLS UNTUK SOFT DELETE SUPPORT
-- Memastikan baris dengan deleted_at is not null tersembunyi
-- =========================================================

-- ANGGOTA
drop policy if exists "anggota_select_scoped" on public.anggota;
create policy "anggota_select_scoped" on public.anggota
  for select using (
    deleted_at is null and (
      public.is_super_admin() 
      or (public.is_admin() and instansi_id = public.current_instansi_id())
      or (user_id = auth.uid())
    )
  );

-- TABUNGAN
drop policy if exists "tabungan_select_scoped" on public.tabungan;
create policy "tabungan_select_scoped" on public.tabungan
  for select using (
    deleted_at is null and (
      public.is_super_admin() 
      or (public.is_admin() and instansi_id = public.current_instansi_id())
      or (anggota_id = public.my_anggota_id())
    )
  );

-- TRANSAKSI
drop policy if exists "transaksi_select_scoped" on public.transaksi;
create policy "transaksi_select_scoped" on public.transaksi
  for select using (
    deleted_at is null and (
      public.is_super_admin() 
      or (public.is_admin() and instansi_id = public.current_instansi_id())
      or (anggota_id = public.my_anggota_id())
    )
  );

-- PENGELUARAN
drop policy if exists "pengeluaran_select_scoped" on public.pengeluaran;
create policy "pengeluaran_select_scoped" on public.pengeluaran
  for select using (
    deleted_at is null and (
      public.is_super_admin() 
      or (public.is_admin() and instansi_id = public.current_instansi_id())
    )
  );

-- KELOMPOK
drop policy if exists "kelompok_select_scoped" on public.kelompok;
create policy "kelompok_select_scoped" on public.kelompok
  for select using (
    deleted_at is null and (
      public.is_super_admin() 
      or instansi_id = public.current_instansi_id()
    )
  );

-- INSTANSI
drop policy if exists "instansi_select_scoped" on public.instansi;
create policy "instansi_select_scoped" on public.instansi
  for select using (
    deleted_at is null and (
      public.is_super_admin() 
      or id = public.current_instansi_id()
    )
  );


-- =========================================================
-- 7. REWRITE RPC UNTUK SOFT DELETE
-- =========================================================

create or replace function public.hapus_transaksi(p_transaksi_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_transaksi public.transaksi;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat menghapus transaksi';
  end if;

  select * into v_transaksi from public.transaksi where id = p_transaksi_id and deleted_at is null;

  if v_transaksi is null then
    raise exception 'Transaksi tidak ditemukan atau sudah dihapus';
  end if;

  if not public.is_super_admin() and v_transaksi.instansi_id <> public.current_instansi_id() then
    raise exception 'Transaksi tersebut bukan milik instansi Anda';
  end if;

  if v_transaksi.jenis = 'setoran' then
    update public.tabungan set saldo = saldo - v_transaksi.nominal where anggota_id = v_transaksi.anggota_id and deleted_at is null;
  else
    update public.tabungan set saldo = saldo + v_transaksi.nominal where anggota_id = v_transaksi.anggota_id and deleted_at is null;
  end if;

  -- Soft delete
  update public.transaksi 
  set deleted_at = now(), deleted_by = auth.uid() 
  where id = p_transaksi_id;
end;
$$;


create or replace function public.total_kas_masjid()
returns numeric
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_instansi_id uuid;
  v_total_tabungan numeric;
  v_total_pengeluaran numeric;
begin
  if public.is_super_admin() then
    select coalesce(sum(saldo), 0) into v_total_tabungan from public.tabungan where deleted_at is null;
    select coalesce(sum(nominal), 0) into v_total_pengeluaran from public.pengeluaran where deleted_at is null;
    return v_total_tabungan - v_total_pengeluaran;
  end if;

  v_instansi_id := public.current_instansi_id();
  
  select coalesce(sum(saldo), 0) into v_total_tabungan 
  from public.tabungan 
  where instansi_id = v_instansi_id and deleted_at is null;
  
  select coalesce(sum(nominal), 0) into v_total_pengeluaran 
  from public.pengeluaran 
  where instansi_id = v_instansi_id and deleted_at is null;

  return v_total_tabungan - v_total_pengeluaran;
end;
$$;


create or replace function public.grafik_setoran_periode(p_bulan_mulai date, p_bulan_akhir date)
returns table (bulan text, total numeric)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_instansi_id uuid;
begin
  if public.is_super_admin() then
    return query
      with bulan_seri as (
        select generate_series(
          date_trunc('month', p_bulan_mulai),
          date_trunc('month', p_bulan_akhir),
          interval '1 month'
        )::date as bulan_awal
      )
      select
        to_char(bs.bulan_awal, 'Mon YYYY') as bulan,
        coalesce(sum(t.nominal), 0) as total
      from bulan_seri bs
      left join public.transaksi t
        on t.jenis = 'setoran'
        and t.deleted_at is null
        and date_trunc('month', t.tanggal) = bs.bulan_awal
      group by bs.bulan_awal
      order by bs.bulan_awal;
  else
    v_instansi_id := public.current_instansi_id();
    return query
      with bulan_seri as (
        select generate_series(
          date_trunc('month', p_bulan_mulai),
          date_trunc('month', p_bulan_akhir),
          interval '1 month'
        )::date as bulan_awal
      )
      select
        to_char(bs.bulan_awal, 'Mon YYYY') as bulan,
        coalesce(sum(t.nominal), 0) as total
      from bulan_seri bs
      left join public.transaksi t
        on t.jenis = 'setoran'
        and t.instansi_id = v_instansi_id
        and t.deleted_at is null
        and date_trunc('month', t.tanggal) = bs.bulan_awal
      group by bs.bulan_awal
      order by bs.bulan_awal;
  end if;
end;
$$;


-- =========================================================
-- 8. REWRITE RPC SETORAN/PENARIKAN UNTUK SOFT DELETE
-- Melengkapi filter deleted_at is null yang belum ada di
-- Modul 2 (karena kolom deleted_at baru ditambahkan di sini).
-- Juga menambahkan validasi nominal > 0 di level RPC untuk
-- pesan error yang lebih ramah pengguna.
-- =========================================================

create or replace function public.catat_setoran(
  p_tanggal date,
  p_anggota_id uuid,
  p_nominal numeric,
  p_metode_pembayaran text,
  p_keterangan text,
  p_bukti text default null
)
returns public.transaksi
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.transaksi;
  v_anggota_instansi uuid;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mencatat setoran';
  end if;

  if p_nominal <= 0 then
    raise exception 'Nominal setoran harus lebih dari 0';
  end if;

  select instansi_id into v_anggota_instansi from public.anggota where id = p_anggota_id and deleted_at is null;

  if v_anggota_instansi is null then
    raise exception 'Anggota tidak ditemukan';
  end if;

  if not public.is_super_admin() and v_anggota_instansi <> public.current_instansi_id() then
    raise exception 'Anggota tersebut bukan milik instansi Anda';
  end if;

  insert into public.transaksi (anggota_id, jenis, nominal, tanggal, metode_pembayaran, keterangan, bukti, created_by)
  values (p_anggota_id, 'setoran', p_nominal, p_tanggal, p_metode_pembayaran, p_keterangan, p_bukti, auth.uid())
  returning * into v_row;

  update public.tabungan
  set saldo = saldo + p_nominal
  where anggota_id = p_anggota_id and deleted_at is null;

  return v_row;
end;
$$;


create or replace function public.catat_penarikan(
  p_tanggal date,
  p_anggota_id uuid,
  p_nominal numeric,
  p_keterangan text,
  p_bukti text default null
)
returns public.transaksi
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.transaksi;
  v_saldo numeric;
  v_anggota_instansi uuid;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mencatat penarikan';
  end if;

  if p_nominal <= 0 then
    raise exception 'Nominal penarikan harus lebih dari 0';
  end if;

  select instansi_id into v_anggota_instansi from public.anggota where id = p_anggota_id and deleted_at is null;

  if v_anggota_instansi is null then
    raise exception 'Anggota tidak ditemukan';
  end if;

  if not public.is_super_admin() and v_anggota_instansi <> public.current_instansi_id() then
    raise exception 'Anggota tersebut bukan milik instansi Anda';
  end if;

  select saldo into v_saldo from public.tabungan where anggota_id = p_anggota_id and deleted_at is null for update;

  if v_saldo is null then
    raise exception 'Rekening tabungan anggota tidak ditemukan';
  end if;

  if v_saldo < p_nominal then
    raise exception 'Saldo tidak mencukupi untuk penarikan ini';
  end if;

  insert into public.transaksi (anggota_id, jenis, nominal, tanggal, keterangan, bukti, created_by)
  values (p_anggota_id, 'penarikan', p_nominal, p_tanggal, p_keterangan, p_bukti, auth.uid())
  returning * into v_row;

  update public.tabungan
  set saldo = saldo - p_nominal
  where anggota_id = p_anggota_id and deleted_at is null;

  return v_row;
end;
$$;


-- =========================================================
-- 9. REWRITE RPC FASE 4 (SUPER ADMIN) UNTUK SOFT DELETE
-- Semua fungsi ini berjalan security definer (menembus RLS),
-- jadi harus eksplisit memfilter deleted_at is null agar
-- dashboard super admin tidak menghitung data yang sudah dihapus.
-- =========================================================

create or replace function public.get_statistik_nasional()
returns json
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_total_instansi    bigint;
  v_total_kelompok    bigint;
  v_total_jamaah      bigint;
  v_total_saldo       numeric;
  v_total_target      numeric;
  v_total_transaksi   bigint;
  v_bulan_mulai       date;
begin
  if not public.is_super_admin() then
    raise exception 'Akses ditolak: hanya Super Admin';
  end if;

  v_bulan_mulai := date_trunc('month', current_date)::date;

  select count(*) into v_total_instansi from public.instansi where status = true and deleted_at is null;
  select count(*) into v_total_kelompok from public.kelompok where status = true and deleted_at is null;
  select count(*) into v_total_jamaah   from public.anggota  where status = true and deleted_at is null;

  select coalesce(sum(saldo), 0) into v_total_saldo from public.tabungan where deleted_at is null;

  select coalesce(sum(target_dana), 0) into v_total_target from public.kelompok where status = true and deleted_at is null;

  select count(*) into v_total_transaksi
  from public.transaksi
  where tanggal >= v_bulan_mulai and deleted_at is null;

  return json_build_object(
    'total_instansi',  v_total_instansi,
    'total_kelompok',  v_total_kelompok,
    'total_jamaah',    v_total_jamaah,
    'total_saldo',     v_total_saldo,
    'total_target',    v_total_target,
    'total_transaksi', v_total_transaksi
  );
end;
$$;


create or replace function public.get_grafik_setoran_nasional(
  p_bulan_mulai date default '2026-07-01',
  p_bulan_akhir date default '2027-04-01'
)
returns table (bulan text, total numeric)
language sql
stable
security definer set search_path = public
as $$
  with bulan_seri as (
    select generate_series(
      date_trunc('month', p_bulan_mulai),
      date_trunc('month', p_bulan_akhir),
      interval '1 month'
    )::date as bulan_awal
  )
  select
    to_char(bs.bulan_awal, 'Mon YYYY') as bulan,
    coalesce(sum(t.nominal), 0)         as total
  from bulan_seri bs
  left join public.transaksi t
    on t.jenis = 'setoran'
    and t.deleted_at is null
    and date_trunc('month', t.tanggal) = bs.bulan_awal
  group by bs.bulan_awal
  order by bs.bulan_awal;
$$;


create or replace function public.get_top_instansi(p_limit int default 5)
returns table (
  instansi_id   uuid,
  nama_instansi text,
  kode_instansi text,
  total_anggota bigint,
  total_kelompok bigint,
  total_saldo   numeric,
  total_target  numeric,
  progress_pct  numeric
)
language sql
stable
security definer set search_path = public
as $$
  select
    i.id                                      as instansi_id,
    i.nama_instansi,
    i.kode_instansi,
    count(distinct a.id)                      as total_anggota,
    count(distinct k.id)                      as total_kelompok,
    coalesce(sum(tab.saldo), 0)               as total_saldo,
    coalesce(sum(k2.target_dana), 0)          as total_target,
    case
      when coalesce(sum(k2.target_dana), 0) = 0 then 0
      else round(coalesce(sum(tab.saldo), 0) / sum(k2.target_dana) * 100, 1)
    end                                       as progress_pct
  from public.instansi i
  left join public.anggota   a   on a.instansi_id = i.id and a.status = true and a.deleted_at is null
  left join public.kelompok  k   on k.instansi_id = i.id and k.status = true and k.deleted_at is null
  left join public.kelompok  k2  on k2.instansi_id = i.id and k2.status = true and k2.deleted_at is null
  left join public.tabungan  tab on tab.instansi_id = i.id and tab.deleted_at is null
  where i.status = true and i.deleted_at is null
  group by i.id, i.nama_instansi, i.kode_instansi
  order by progress_pct desc, total_saldo desc
  limit p_limit;
$$;


create or replace function public.get_top_kelompok(p_limit int default 5)
returns table (
  kelompok_id    uuid,
  nama_kelompok  text,
  kode_kelompok  text,
  nama_instansi  text,
  jenis_qurban   text,
  total_anggota  bigint,
  total_saldo    numeric,
  target_dana    numeric,
  progress_pct   numeric
)
language sql
stable
security definer set search_path = public
as $$
  select
    k.id                                       as kelompok_id,
    k.nama_kelompok,
    k.kode_kelompok,
    i.nama_instansi,
    k.jenis_qurban,
    count(distinct a.id)                       as total_anggota,
    coalesce(sum(tab.saldo), 0)                as total_saldo,
    k.target_dana,
    case
      when k.target_dana = 0 then 0
      else round(coalesce(sum(tab.saldo), 0) / k.target_dana * 100, 1)
    end                                        as progress_pct
  from public.kelompok  k
  join public.instansi  i   on i.id = k.instansi_id and i.deleted_at is null
  left join public.anggota   a   on a.kelompok_id = k.id and a.status = true and a.deleted_at is null
  left join public.tabungan  tab on tab.kelompok_id = k.id and tab.deleted_at is null
  where k.status = true and k.deleted_at is null
  group by k.id, k.nama_kelompok, k.kode_kelompok, i.nama_instansi, k.jenis_qurban, k.target_dana
  order by progress_pct desc, total_saldo desc
  limit p_limit;
$$;


create or replace function public.get_transaksi_terbaru_nasional(p_limit int default 10)
returns table (
  id              uuid,
  jenis           text,
  nominal         numeric,
  tanggal         date,
  nama_anggota    text,
  nama_instansi   text,
  nama_kelompok   text,
  metode_pembayaran text,
  keterangan      text,
  created_at      timestamptz
)
language sql
stable
security definer set search_path = public
as $$
  select
    t.id,
    t.jenis,
    t.nominal,
    t.tanggal,
    a.nama          as nama_anggota,
    i.nama_instansi,
    k.nama_kelompok,
    t.metode_pembayaran,
    t.keterangan,
    t.created_at
  from public.transaksi t
  join public.anggota   a on a.id = t.anggota_id
  join public.instansi  i on i.id = t.instansi_id
  left join public.kelompok k on k.id = t.kelompok_id
  where t.deleted_at is null
  order by t.created_at desc
  limit p_limit;
$$;


create or replace function public.get_grafik_per_instansi()
returns table (
  nama_instansi text,
  total_saldo   numeric,
  total_target  numeric,
  progress_pct  numeric
)
language sql
stable
security definer set search_path = public
as $$
  select
    i.nama_instansi,
    coalesce(sum(tab.saldo), 0)              as total_saldo,
    coalesce(sum(k.target_dana), 0)          as total_target,
    case
      when coalesce(sum(k.target_dana), 0) = 0 then 0
      else round(coalesce(sum(tab.saldo), 0) / sum(k.target_dana) * 100, 1)
    end                                      as progress_pct
  from public.instansi i
  left join public.tabungan tab on tab.instansi_id = i.id and tab.deleted_at is null
  left join public.kelompok k   on k.instansi_id = i.id and k.status = true and k.deleted_at is null
  where i.status = true and i.deleted_at is null
  group by i.id, i.nama_instansi
  order by total_saldo desc;
$$;
