-- ========================================================================================
-- FASE 6 - MODUL 8: REPORT CENTER
-- Menambahkan View (Tampilan) database untuk mempermudah ekspor dan analisis data gabungan
-- ========================================================================================

-- View untuk merekap transaksi (Setoran & Penarikan) beserta detail Anggota, Kelompok, dan Instansi
create or replace view public.vw_report_transaksi with (security_invoker = true) as
select 
    t.id as transaksi_id,
    t.tanggal,
    t.jenis,
    t.nominal,
    t.metode_pembayaran,
    t.keterangan,
    t.bukti,
    a.nama as nama_anggota,
    a.status as status_anggota,
    k.nama_kelompok,
    i.nama_instansi
from public.transaksi t
left join public.anggota a on t.anggota_id = a.id
left join public.kelompok k on a.kelompok_id = k.id
left join public.instansi i on a.instansi_id = i.id;

-- Berikan akses baca untuk View ke authenticated users
grant select on public.vw_report_transaksi to authenticated;

-- Catatan bahwa fitur Report Center murni dijalankan pada sisi Client/React
-- menggunakan komponen LaporanPage.jsx. View ini merupakan komplemen database.
