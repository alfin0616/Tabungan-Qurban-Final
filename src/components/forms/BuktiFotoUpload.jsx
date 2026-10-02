import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Field upload foto generik untuk bukti transaksi/nota.
 * uploadFn menerima File dan harus mengembalikan public URL (string).
 */
export default function BuktiFotoUpload({ label = 'Bukti Foto (opsional)', value, onChange, uploadFn }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value ?? null)

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadFn(file)
      onChange(url)
    } catch (err) {
      toast.error(err.message || 'Gagal mengunggah foto')
      setPreview(value ?? null)
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview(null)
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink dark:text-ink-dark">{label}</label>
      <div className="flex items-center gap-3">
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Bukti"
              className="h-14 w-14 rounded-lg border border-border dark:border-border-dark object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-ink dark:text-ink-dark hover:border-emerald-500">
          <Upload className="h-4 w-4" />
          {uploading ? 'Mengunggah...' : preview ? 'Ganti Foto' : 'Unggah Foto'}
          <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
        </label>
      </div>
    </div>
  )
}
