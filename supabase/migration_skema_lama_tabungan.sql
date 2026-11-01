-- ==============================================================================
-- MIGRATION: SKEMA SETORAN (BULANAN / MINGGUAN) & LAMA TABUNGAN FLEKSIBEL (TENOR)
-- ==============================================================================
-- Menambahkan dukungan pilihan frekuensi setoran ('bulanan' atau 'mingguan')
-- dan lama tabungan fleksibel (misal: 6, 12, 18, 24, 30, 36 bulan) tanpa batas
-- waktu hangus pada tabel anggota dan tabungan.

-- 1. Tambahkan kolom periode_setoran dan lama_tabungan pada tabel public.anggota
alter table public.anggota
  add column if not exists periode_setoran text not null default 'bulanan'
    check (periode_setoran in ('bulanan', 'mingguan')),
  add column if not exists lama_tabungan integer not null default 12
    check (lama_tabungan >= 1 and lama_tabungan <= 120);

-- 2. Tambahkan kolom periode_setoran dan lama_tabungan pada tabel public.tabungan
alter table public.tabungan
  add column if not exists periode_setoran text not null default 'bulanan'
    check (periode_setoran in ('bulanan', 'mingguan')),
  add column if not exists lama_tabungan integer not null default 12
    check (lama_tabungan >= 1 and lama_tabungan <= 120);

-- 3. RPC Grafik Setoran Mingguan (8 Minggu Terakhir)
drop function if exists public.grafik_setoran_mingguan(int);
create or replace function public.grafik_setoran_mingguan(p_jumlah_minggu int default 8)
returns table (minggu text, total numeric)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_instansi_id uuid;
begin
  if public.is_super_admin() then
    return query
      with minggu_seri as (
        select generate_series(
          date_trunc('week', current_date - ((p_jumlah_minggu - 1) * interval '1 week')),
          date_trunc('week', current_date),
          interval '1 week'
        )::date as minggu_awal
      )
      select
        to_char(ms.minggu_awal, 'DD Mon') as minggu,
        coalesce(sum(t.nominal), 0)::numeric as total
      from minggu_seri ms
      left join public.transaksi t
        on t.jenis = 'setoran'
        and date_trunc('week', t.tanggal)::date = ms.minggu_awal
      group by ms.minggu_awal
      order by ms.minggu_awal;
  else
    v_instansi_id := public.current_instansi_id();
    return query
      with minggu_seri as (
        select generate_series(
          date_trunc('week', current_date - ((p_jumlah_minggu - 1) * interval '1 week')),
          date_trunc('week', current_date),
          interval '1 week'
        )::date as minggu_awal
      )
      select
        to_char(ms.minggu_awal, 'DD Mon') as minggu,
        coalesce(sum(t.nominal), 0)::numeric as total
      from minggu_seri ms
      left join public.transaksi t
        on t.jenis = 'setoran'
        and t.instansi_id = v_instansi_id
        and date_trunc('week', t.tanggal)::date = ms.minggu_awal
      group by ms.minggu_awal
      order by ms.minggu_awal;
  end if;
end;
$$;

grant execute on function public.grafik_setoran_mingguan(int) to authenticated;

