-- ========================================================================================
-- FASE 6 - MODUL 11: PERFORMANCE
-- Menambahkan indeks performa untuk mendukung Virtual List dan Dynamic Loads
-- ========================================================================================

-- Penjelasan:
-- Optimasi React.memo, useCallback, Dynamic Import (React.lazy), Virtual List 
-- (menggunakan @tanstack/react-virtual pada halaman Laporan), dan pagination 
-- telah diimplementasikan pada sisi Frontend / Client.
-- 
-- File migrasi ini menambahkan Indexing Database (B-Tree) untuk mempercepat load data 
-- dari tabel-tabel utama (Transaksi, Pengeluaran, Tabungan) sebelum diproses 
-- oleh Virtual List di frontend.

-- 1. Index untuk mempercepat Query rentang tanggal laporan transaksi
create index if not exists idx_transaksi_tanggal on public.transaksi (tanggal desc);

-- 2. Index untuk mempercepat Query pengeluaran
create index if not exists idx_pengeluaran_tanggal on public.pengeluaran (tanggal desc);
create index if not exists idx_pengeluaran_kategori on public.pengeluaran (kategori);

-- 3. Index untuk mempercepat JOIN tabel transaksi dengan anggota
create index if not exists idx_transaksi_anggota_id on public.transaksi (anggota_id);
create index if not exists idx_anggota_instansi_id on public.anggota (instansi_id);
create index if not exists idx_anggota_kelompok_id on public.anggota (kelompok_id);

-- 4. Index gabungan (Composite Index) untuk filter Laporan (Contoh: mencari transaksi berdasarkan status dan metode)
create index if not exists idx_transaksi_jenis_metode on public.transaksi (jenis, metode_pembayaran);

-- Catatan: Proses "Build" Node.js juga telah di-optimasi dengan Lazy Loading 
-- sehingga mengurangi bundle size untuk library berat (exceljs, jspdf, dll).
