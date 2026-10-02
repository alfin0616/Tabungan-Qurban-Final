-- ==================================================
-- MODUL 10: NOTIFICATION CENTER (TABLE, TRIGGERS & RLS)
-- ==================================================

-- 1. Tabel Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  instansi_id uuid REFERENCES public.instansi(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  link text
);

-- Indexing untuk query notifikasi cepat
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_instansi ON public.notifications(instansi_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy RLS
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR instansi_id IN (SELECT instansi_id FROM public.admin_profiles WHERE id = auth.uid())
    OR user_id IS NULL
  );

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR instansi_id IN (SELECT instansi_id FROM public.admin_profiles WHERE id = auth.uid())
  );

-- 2. Trigger Otomatis: Buat notifikasi saat transaksi setoran / penarikan baru dibuat
CREATE OR REPLACE FUNCTION public.notify_on_transaksi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nama_anggota text;
BEGIN
  SELECT nama INTO v_nama_anggota FROM public.anggota WHERE id = NEW.anggota_id;

  IF NEW.jenis = 'setoran' THEN
    INSERT INTO public.notifications (instansi_id, title, message, type, link)
    VALUES (
      NEW.instansi_id,
      'Setoran Baru',
      COALESCE(v_nama_anggota, 'Anggota') || ' melakukan setoran sebesar Rp ' || to_char(NEW.nominal, 'FM999,999,999,999'),
      'setoran',
      '/transaksi/riwayat'
    );
  ELSIF NEW.jenis = 'penarikan' THEN
    INSERT INTO public.notifications (instansi_id, title, message, type, link)
    VALUES (
      NEW.instansi_id,
      'Penarikan Baru',
      COALESCE(v_nama_anggota, 'Anggota') || ' melakukan penarikan sebesar Rp ' || to_char(NEW.nominal, 'FM999,999,999,999'),
      'penarikan',
      '/transaksi/riwayat'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_transaksi ON public.transaksi;
CREATE TRIGGER trg_notify_transaksi
  AFTER INSERT ON public.transaksi
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_transaksi();
