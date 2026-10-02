-- ========================================================================================
-- FASE 6 - MODUL 9: FILE MANAGEMENT
-- Setup Database dan konfirmasi Supabase Storage buckets untuk File Manager
-- ========================================================================================

-- (Opsional) Memastikan buckets storage dibuat (jika Supabase Storage API memperbolehkan dari SQL).
-- Sebagian besar bucket (foto-anggota, pengaturan, pengeluaran-bukti) telah dibuat dan dikonfigurasi
-- RLS-nya pada 'migration_upload_foto.sql'. 
-- Skrip ini memverifikasi akses Admin ke seluruh file melalui RLS.

-- Memastikan kembali hak akses Admin untuk mengakses, merubah, dan menghapus seluruh file 
-- untuk semua buckets File Management
drop policy if exists "file_manager_admin_all" on storage.objects;
create policy "file_manager_admin_all" on storage.objects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Catatan: Logika grid/list view, preview, dan file download telah diimplementasikan 
-- secara penuh di 'FileManagerPage.jsx' pada sisi klien.
