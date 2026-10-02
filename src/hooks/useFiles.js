import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getAllFiles, getBucketFiles, deleteFile } from '../repositories/fileRepository'

/**
 * Hook untuk memuat berkas dengan filter bucket & pencarian nama.
 */
export function useFiles(bucketFilter = 'semua', search = '') {
  const queryInfo = useQuery({
    queryKey: ['files', bucketFilter],
    queryFn: () => (bucketFilter === 'semua' ? getAllFiles() : getBucketFiles(bucketFilter)),
    staleTime: 60 * 1000,
  })

  const filteredData = useMemo(() => {
    const list = queryInfo.data || []
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.bucketLabel.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q),
    )
  }, [queryInfo.data, search])

  const stats = useMemo(() => {
    const list = queryInfo.data || []
    const totalBytes = list.reduce((sum, f) => sum + (f.size || 0), 0)
    return {
      totalFiles: list.length,
      totalBytes,
    }
  }, [queryInfo.data])

  return {
    ...queryInfo,
    data: filteredData,
    stats,
  }
}

/**
 * Hook mutation untuk menghapus berkas dari bucket.
 */
export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bucketId, path }) => deleteFile(bucketId, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}
