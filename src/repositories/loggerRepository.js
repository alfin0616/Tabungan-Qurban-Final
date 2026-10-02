import { supabase } from '../api/supabaseClient'

/**
 * Centralized Logging Service (Modul 11)
 * Mencatat semua error/event dari Frontend, Supabase, Payment, Edge Functions, dan PWA
 * ke tabel database `system_logs` secara otomatis & silent.
 */

export const SOURCES = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  SUPABASE: 'supabase',
  EDGE_FUNCTION: 'edge_function',
  PAYMENT: 'payment',
  PWA: 'pwa',
}

export const LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  FATAL: 'fatal',
}

async function sendLogToDatabase(level, source, message, err = null, contextData = {}) {
  try {
    const stackTrace = err?.stack || (typeof err === 'string' ? err : null)
    const currentUrl = typeof window !== 'undefined' ? window.location.href : null

    // Kirim ke RPC database (Security Definer)
    await supabase.rpc('log_system_event', {
      p_level: level,
      p_source: source,
      p_message: String(message),
      p_stack_trace: stackTrace,
      p_context_data: contextData,
      p_url: currentUrl,
    })
  } catch (loggingErr) {
    // Tangkap kegagalan logger sendiri agar tidak menghancurkan flow aplikasi utama
    console.error('[LoggerRepository Failed]', loggingErr)
  }
}

export const logger = {
  error: (source, message, err = null, contextData = {}) =>
    sendLogToDatabase(LEVELS.ERROR, source, message, err, contextData),

  warn: (source, message, contextData = {}) =>
    sendLogToDatabase(LEVELS.WARN, source, message, null, contextData),

  info: (source, message, contextData = {}) =>
    sendLogToDatabase(LEVELS.INFO, source, message, null, contextData),

  fatal: (source, message, err = null, contextData = {}) =>
    sendLogToDatabase(LEVELS.FATAL, source, message, err, contextData),

  /**
   * Mengambil log sistem dari database (untuk Halaman Log Viewer SuperAdmin)
   */
  getLogs: async ({ page = 1, pageSize = 20, level = 'semua', source = 'semua' } = {}) => {
    let query = supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (level !== 'semua') query = query.eq('level', level)
    if (source !== 'semua') query = query.eq('source', source)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data || [], count: count || 0 }
  },
}

/**
 * Inisialisasi Listener Global Unhandled Error & Promise Rejection di Browser
 */
export function initGlobalErrorLogging() {
  if (typeof window === 'undefined') return

  // Tangkap JS runtime exception yang tidak ter-catch
  window.addEventListener('error', (event) => {
    logger.error(
      SOURCES.FRONTEND,
      `Unhandled Window Error: ${event.message}`,
      event.error || { message: event.message, filename: event.filename, lineno: event.lineno },
      { filename: event.filename, lineno: event.lineno, colno: event.colno },
    )
  })

  // Tangkap unhandled promise rejections (async error yang lupa di-catch)
  window.addEventListener('unhandledrejection', (event) => {
    logger.error(
      SOURCES.FRONTEND,
      `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
      event.reason,
      { reason: event.reason },
    )
  })
}
