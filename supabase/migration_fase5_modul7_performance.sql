-- ==================================================
-- MODUL 7: PERFORMANCE & OPTIMIZATION (INDEXING & QUERY TUNING)
-- ==================================================

-- 1. Indexing Tabel Transaksi (Paling sering difilter & diurutkan berdasarkan instansi & tanggal)
CREATE INDEX IF NOT EXISTS idx_transaksi_instansi_created
  ON public.transaksi(instansi_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaksi_anggota_tipe
  ON public.transaksi(anggota_id, jenis);

-- 2. Indexing Tabel Anggota (Filter instansi, nama, & kode anggota)
CREATE INDEX IF NOT EXISTS idx_anggota_instansi_nama
  ON public.anggota(instansi_id, nama);

CREATE INDEX IF NOT EXISTS idx_anggota_instansi_kode
  ON public.anggota(instansi_id, kode_anggota);

CREATE INDEX IF NOT EXISTS idx_anggota_user_id
  ON public.anggota(user_id) WHERE user_id IS NOT NULL;

-- 3. Indexing Tabel Tabungan
CREATE INDEX IF NOT EXISTS idx_tabungan_anggota_id
  ON public.tabungan(anggota_id);

-- 4. Indexing Tabel Pengeluaran
CREATE INDEX IF NOT EXISTS idx_pengeluaran_instansi_tanggal
  ON public.pengeluaran(instansi_id, tanggal DESC);

-- 5. Indexing Tabel Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_instansi_created
  ON public.audit_logs(instansi_id, created_at DESC);

-- 6. Indexing Tabel Admin Profiles & Kelompok
CREATE INDEX IF NOT EXISTS idx_admin_profiles_instansi
  ON public.admin_profiles(instansi_id);

CREATE INDEX IF NOT EXISTS idx_kelompok_instansi
  ON public.kelompok(instansi_id);
