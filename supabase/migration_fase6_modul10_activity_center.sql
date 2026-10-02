-- ========================================================================================
-- FASE 6 - MODUL 10: ACTIVITY CENTER
-- Mengoptimalkan Audit Logs untuk pencarian dan pemfilteran Activity Center
-- ========================================================================================

-- Pastikan tabel audit_logs sudah terbuat (sebelumnya di Fase 5 Modul 4)
-- Modul 10 ini fokus kepada performa read dan filter pada Activity Center di sisi Klien.

-- 1. Tambahkan index untuk mempercepat filter pencarian berdasarkan aksi (action)
create index if not exists idx_audit_logs_action on public.audit_logs (action);

-- 2. Tambahkan index untuk mempercepat filter rentang waktu (created_at)
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- 3. Tambahkan index untuk mempercepat filter user (user_id)
create index if not exists idx_audit_logs_user_id on public.audit_logs (user_id);

-- Catatan: Fungsi RPC untuk membersihkan log lama (retensi data) sudah tersedia 
-- pada skrip Fase 5 Modul 11 (Logging & Audit).
