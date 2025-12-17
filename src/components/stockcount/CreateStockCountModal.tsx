import { useState } from 'react'
import { X, Calendar, FileText, Package } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { stockCountService } from '../../services/stockCountService'
import { useAuth } from '../../contexts/AuthContext'
import type { CreateStockCountForm } from '../../types/stockCount.types'

interface CreateStockCountModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateStockCountModal({ onClose, onSuccess }: CreateStockCountModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateStockCountForm>({
    countType: 'EOM',
    countDate: new Date().toISOString().split('T')[0],
    periodMonth: new Date().toISOString().slice(0, 7),
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.countDate) {
      newErrors.countDate = 'Count date is required'
    }

    if (!formData.periodMonth) {
      newErrors.periodMonth = 'Period month is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user?.id) return

    try {
      setLoading(true)
      await stockCountService.createStockCount(formData, user.id)
      onSuccess()
    } catch (error: any) {
      console.error('Error creating stock count:', error)
      if (error.message?.includes('already exists')) {
        setErrors({ periodMonth: 'EOM stock count already exists for this period' })
      } else {
        setErrors({ submit: 'Failed to create stock count. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateStockCountForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'EOM':
        return 'Full physical count of all inventory items performed at the end of each month'
      case 'CYCLE':
        return 'Partial count of specific categories or items performed on a rotating schedule'
      case 'ADHOC':
        return 'Special count performed as needed for investigations or audits'
      default:
        return ''
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Create New Stock Count</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Count Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-1" />
              Count Type
            </label>
            <select
              value={formData.countType}
              onChange={handleInputChange('countType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="EOM">End of Month Count</option>
              <option value="CYCLE">Cycle Count</option>
              <option value="ADHOC">Ad-hoc Count</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {getTypeDescription(formData.countType)}
            </p>
          </div>

          {/* Count Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Count Date
            </label>
            <Input
              type="date"
              value={formData.countDate}
              onChange={handleInputChange('countDate')}
              error={errors.countDate}
            />
          </div>

          {/* Period Month */}
          {formData.countType === 'EOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Month
              </label>
              <Input
                type="month"
                value={formData.periodMonth}
                onChange={handleInputChange('periodMonth')}
                error={errors.periodMonth}
              />
              <p className="mt-1 text-sm text-gray-500">
                Select the month this EOM count applies to
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about this stock count..."
              value={formData.notes}
              onChange={handleInputChange('notes')}
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Stock Count Summary</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Type:</dt>
                <dd className="font-medium">{formData.countType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Date:</dt>
                <dd className="font-medium">
                  {formData.countDate ? new Date(formData.countDate).toLocaleDateString() : ''}
                </dd>
              </div>
              {formData.countType === 'EOM' && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Period:</dt>
                  <dd className="font-medium">{formData.periodMonth}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600">Items to count:</dt>
                <dd className="font-medium">All active items</dd>
              </div>
            </dl>
          </div>

          {/* Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              Create Stock Count
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}