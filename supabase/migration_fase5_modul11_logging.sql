-- ==================================================
-- MODUL 11: SYSTEM & ERROR LOGGING INFRASTRUCTURE
-- ==================================================

-- 1. Tabel system_logs
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  level text NOT NULL DEFAULT 'error', -- 'error', 'warn', 'info', 'fatal'
  source text NOT NULL DEFAULT 'frontend', -- 'frontend', 'backend', 'supabase', 'edge_function', 'payment', 'pwa'
  message text NOT NULL,
  stack_trace text,
  context_data jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  instansi_id uuid REFERENCES public.instansi(id) ON DELETE SET NULL,
  user_agent text,
  url text
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_source ON public.system_logs(level, source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_instansi ON public.system_logs(instansi_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "system_logs_select_policy" ON public.system_logs;
CREATE POLICY "system_logs_select_policy" ON public.system_logs
  FOR SELECT TO authenticated
  USING (
    instansi_id IN (SELECT instansi_id FROM public.admin_profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.admin_profiles WHERE id = auth.uid()) = 'superadmin'
  );

-- RPC: SECURITY DEFINER untuk mencatat error/event secara aman dari Frontend, PWA, Payment, Edge Functions
CREATE OR REPLACE FUNCTION public.log_system_event(
  p_level text,
  p_source text,
  p_message text,
  p_stack_trace text DEFAULT NULL,
  p_context_data jsonb DEFAULT '{}'::jsonb,
  p_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_instansi_id uuid;
  v_user_agent text;
  v_log_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT instansi_id INTO v_instansi_id FROM public.admin_profiles WHERE id = v_user_id;
  END IF;

  -- BACA User-Agent dari HTTP Header request (jika dipanggil via Supabase SDK)
  BEGIN
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_user_agent := NULL;
  END;

  INSERT INTO public.system_logs (
    level,
    source,
    message,
    stack_trace,
    context_data,
    user_id,
    instansi_id,
    user_agent,
    url
  ) VALUES (
    COALESCE(p_level, 'error'),
    COALESCE(p_source, 'frontend'),
    p_message,
    p_stack_trace,
    COALESCE(p_context_data, '{}'::jsonb),
    v_user_id,
    v_instansi_id,
    v_user_agent,
    p_url
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant EXECUTE ke anon & authenticated agar error tetap bisa dicatat meskipun belum login / token expired
GRANT EXECUTE ON FUNCTION public.log_system_event(text, text, text, text, jsonb, text) TO anon, authenticated;
