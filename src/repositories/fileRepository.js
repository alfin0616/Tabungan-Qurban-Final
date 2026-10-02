import { saveAs } from 'file-saver'
import { supabase } from '../api/supabaseClient'

export const BUCKET_CONFIG = [
  {
    id: 'pengaturan',
    label: 'Logo Instansi',
    description: 'Logo dan ikon instansi/masjid',
    color: 'emerald',
  },
  {
    id: 'foto-anggota',
    label: 'Foto Jamaah',
    description: 'Foto profil anggota/jamaah qurban',
    color: 'blue',
  },
  {
    id: 'pengeluaran-bukti',
    label: 'Dokumen Pengeluaran',
    description: 'Bukti nota & kuitansi operasional',
    color: 'amber',
  },
  {
    id: 'bukti-transaksi',
    label: 'Bukti Pembayaran',
    description: 'Bukti transfer setoran & penarikan',
    color: 'indigo',
  },
  {
    id: 'avatars',
    label: 'Foto Profil',
    description: 'Avatar admin dan pengguna sistem',
    color: 'purple',
  },
]

/**
 * Memformat byte menjadi string ukuran yang mudah dibaca (KB, MB, GB).
 */
export function formatFileSize(bytes = 0) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Rekursif mengambil daftar file dalam suatu bucket (mendukung subfolder).
 */
async function listFilesInBucket(bucketId, prefix = '') {
  try {
    const { data, error } = await supabase.storage.from(bucketId).list(prefix, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (error) {
      console.warn(`[fileRepository] Gagal memuat bucket ${bucketId} (${prefix}):`, error.message)
      return []
    }

    let allFiles = []
    for (const item of data || []) {
      // Dalam Supabase Storage list, direktori tidak memiliki id
      if (!item.id && item.name) {
        const subFiles = await listFilesInBucket(bucketId, `${prefix}${item.name}/`)
        allFiles = allFiles.concat(subFiles)
      } else if (item.name && item.name !== '.emptyFolderPlaceholder') {
        const fullPath = prefix ? `${prefix}${item.name}` : item.name
        const { data: urlData } = supabase.storage.from(bucketId).getPublicUrl(fullPath)
        const bucketInfo = BUCKET_CONFIG.find((b) => b.id === bucketId)

        allFiles.push({
          id: item.id || `${bucketId}-${fullPath}`,
          name: item.name,
          path: fullPath,
          bucketId,
          bucketLabel: bucketInfo?.label ?? bucketId,
          bucketColor: bucketInfo?.color ?? 'slate',
          size: item.metadata?.size || 0,
          mimetype: item.metadata?.mimetype || 'application/octet-stream',
          createdAt: item.created_at || new Date().toISOString(),
          url: urlData.publicUrl,
        })
      }
    }
    return allFiles
  } catch (err) {
    console.error(`[fileRepository] Error saat memuat berkas dari ${bucketId}:`, err)
    return []
  }
}

/**
 * Ambil daftar file hanya dari satu bucket tertentu.
 */
export async function getBucketFiles(bucketId) {
  return listFilesInBucket(bucketId)
}

/**
 * Ambil daftar semua file dari ke-5 bucket secara paralel.
 */
export async function getAllFiles() {
  const results = await Promise.all(
    BUCKET_CONFIG.map((b) => listFilesInBucket(b.id)),
  )
  // Gabungkan dan urutkan berdasarkan tanggal terbaru
  const combined = results.flat()
  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return combined
}

/**
 * Unduh file dari bucket dan simpan di perangkat pengguna.
 */
export async function downloadFile(bucketId, path, fileName) {
  const { data, error } = await supabase.storage.from(bucketId).download(path)
  if (error) throw error
  saveAs(data, fileName || path.split('/').pop())
}

/**
 * Hapus file dari bucket.
 */
export async function deleteFile(bucketId, path) {
  const { error } = await supabase.storage.from(bucketId).remove([path])
  if (error) throw error
}
