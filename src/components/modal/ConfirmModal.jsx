import Modal from './Modal'
import Button from '../ui/Button'

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  description,
  confirmLabel = 'Ya, Lanjutkan',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
