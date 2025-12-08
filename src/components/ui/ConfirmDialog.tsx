import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { useI18n } from '../../i18n/I18nProvider'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useI18n()

  const confirmButtonText = confirmText || t('common.confirm')
  const cancelButtonText = cancelText || t('common.cancel')
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${variant === 'danger' ? 'text-red-600' : 'text-blue-600'}`}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {cancelButtonText}
          </Button>
          <Button type="button" variant={variant} onClick={onConfirm} disabled={loading}>
            {loading ? t('common.loading') : confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
