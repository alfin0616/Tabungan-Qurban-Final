import toast from 'react-hot-toast'
import { logger, SOURCES } from '../repositories/loggerRepository'

/**
 * Centralized API Error Handler
 * Menerjemahkan error dari Supabase/Fetch menjadi pesan yang user-friendly,
 * menampilkan toast error, dan mencatatnya ke database system_logs (Modul 11).
 */

// Peta pesan error Supabase yang umum → pesan bahasa Indonesia
const SUPABASE_ERROR_MAP = {
  // Auth errors
  'Invalid login credentials': 'Email atau password salah.',
  'Email not confirmed': 'Email belum dikonfirmasi. Cek inbox Anda.',
  'User already registered': 'Email sudah terdaftar.',
  'Password should be at least 6 characters': 'Password minimal 6 karakter.',
  'For security purposes, you can only request this once every 60 seconds': 'Demi keamanan, permintaan hanya bisa dilakukan setiap 60 detik.',
  'Auth session missing!': 'Sesi login habis, silakan login kembali.',
  'JWT expired': 'Sesi login habis, silakan login kembali.',
  'new row violates row-level security policy': 'Anda tidak memiliki izin untuk melakukan aksi ini.',

  // RPC / Database errors
  'Hanya admin yang dapat mencatat setoran': 'Hanya admin yang dapat mencatat setoran.',
  'Hanya admin yang dapat mencatat penarikan': 'Hanya admin yang dapat mencatat penarikan.',
  'Hanya admin yang dapat menghapus transaksi': 'Hanya admin yang dapat menghapus transaksi.',
  'Saldo tidak cukup untuk penarikan': 'Saldo tabungan tidak cukup untuk penarikan ini.',
  'Anggota tidak ditemukan': 'Anggota tidak ditemukan.',
  'Transaksi tidak ditemukan atau sudah dihapus': 'Transaksi tidak ditemukan atau sudah dihapus.',

  // Storage errors
  'The resource already exists': 'File dengan nama yang sama sudah ada.',
  'Payload too large': 'Ukuran file terlalu besar. Maksimal 2MB.',
}

/**
 * Mengekstrak pesan error yang user-friendly dari error object Supabase.
 * @param {object|string} error - Error dari Supabase SDK atau string biasa
 * @returns {string} Pesan error yang sudah diterjemahkan
 */
export function getErrorMessage(error) {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.'
  if (typeof error === 'string') return SUPABASE_ERROR_MAP[error] || error

  const msg = error.message || error.error_description || error.msg || ''

  // Cek mapping eksak dulu
  if (SUPABASE_ERROR_MAP[msg]) return SUPABASE_ERROR_MAP[msg]

  // Cek partial match (untuk error PostgreSQL yang lebih panjang)
  for (const [key, value] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (msg.includes(key)) return value
  }

  // HTTP status code fallback
  const status = error.status || error.statusCode
  if (status === 401 || status === 403) return 'Sesi login habis atau Anda tidak memiliki izin. Silakan login ulang.'
  if (status === 404) return 'Data tidak ditemukan.'
  if (status === 409) return 'Data sudah ada atau terjadi konflik.'
  if (status === 422) return 'Data yang dikirim tidak valid.'
  if (status === 429) return 'Terlalu banyak permintaan. Coba lagi dalam beberapa saat.'
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi nanti.'

  // Network error
  if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
    return 'Koneksi ke server gagal. Periksa koneksi internet Anda.'
  }

  return msg || 'Terjadi kesalahan yang tidak diketahui.'
}

/**
 * Menampilkan toast error dengan pesan yang sudah diterjemahkan.
 * @param {object|string} error - Error dari Supabase atau string
 * @param {string} [context] - Konteks opsional (mis. "Gagal memuat anggota")
 */
export function handleApiError(error, context) {
  const message = getErrorMessage(error)
  const fullMessage = context ? `${context}: ${message}` : message

  toast.error(fullMessage)

  // Catat error API/Supabase secara terpusat ke database system_logs (Modul 11)
  logger.error(SOURCES.SUPABASE, fullMessage, error, {
    rawError: error,
    context: context || 'General API Call',
  })
}
