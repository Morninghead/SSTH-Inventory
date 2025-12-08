import { useState, useEffect } from 'react'
import { FileText, X, CheckCircle, Send } from 'lucide-react'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'

interface PODetailModalProps {
  poId: string
  onClose: () => void
  onStatusChange?: () => void
}

interface PODetails {
  po_id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  po_date: string
  delivery_date: string | null
  notes: string | null
  status: string
  created_by: string
  created_by_name: string
  created_at: string
  line_items: Array<{
    line_number: number
    item_id: string
    item_code: string
    description: string
    quantity: number
    unit_cost: number
    line_total: number
    notes: string | null
  }>
}

export default function PODetailModal({ poId, onClose, onStatusChange }: PODetailModalProps) {
  const { t } = useI18n()
  const [po, setPo] = useState<PODetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadPO()
  }, [poId])

  const loadPO = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_order_details' as any, { p_po_id: poId })

      if (error) throw error

      const poData = data?.[0] as any
      if (poData) {
        setPo(poData)
      }
    } catch (error) {
      console.error('Error loading PO:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!confirm(t('purchasing.poDetailModal.statusUpdateConfirm', { status: newStatus }))) return

    setUpdating(true)
    try {
      const { data, error } = await supabase
        .rpc('update_po_status' as any, {
          p_po_id: poId,
          p_new_status: newStatus
        })

      if (error) throw error

      const result = data as any
      if (result?.[0]?.success) {
        alert(t('purchasing.poDetailModal.statusUpdated', { status: newStatus }))
        loadPO()
        if (onStatusChange) onStatusChange()
      } else {
        alert(result?.[0]?.message || t('purchasing.poDetailModal.statusUpdateFailed'))
      }
    } catch (err: any) {
      alert(err.message || t('purchasing.poDetailModal.statusUpdateFailed'))
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800' },
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800' },
      RECEIVED: { bg: 'bg-purple-100', text: 'text-purple-800' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' },
    }
    return badges[status as keyof typeof badges] || badges.DRAFT
  }

  const totalAmount = po?.line_items?.reduce((sum, item) => sum + item.line_total, 0) || 0

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">{t('purchasing.poDetailModal.loading')}</p>
        </div>
      </div>
    )
  }

  if (!po) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-red-600">{t('purchasing.poDetailModal.loadFailed')}</p>
          <Button onClick={onClose} className="mt-4">{t('purchasing.poDetailModal.close')}</Button>
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge(po.status)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{po.po_number}</h2>
                <p className="text-sm text-gray-600">{t('purchasing.poDetailModal.title')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
              {po.status}
            </span>
            {po.status === 'DRAFT' && (
              <Button
                size="sm"
                onClick={() => updateStatus('SUBMITTED')}
                disabled={updating}
              >
                <Send className="w-4 h-4 mr-1" />
                {t('purchasing.poDetailModal.submitForApproval')}
              </Button>
            )}
            {po.status === 'SUBMITTED' && (
              <Button
                size="sm"
                onClick={() => updateStatus('APPROVED')}
                disabled={updating}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {t('purchasing.poDetailModal.approve')}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* PO Information */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">{t('purchasing.poDetailModal.supplier')}</label>
              <p className="text-base font-semibold text-gray-900">{po.supplier_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('purchasing.poDetailModal.poDate')}</label>
              <p className="text-base text-gray-900">{formatDate(po.po_date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('purchasing.poDetailModal.expectedDelivery')}</label>
              <p className="text-base text-gray-900">
                {po.delivery_date ? formatDate(po.delivery_date) : t('purchasing.poDetailModal.notSpecified')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('purchasing.poDetailModal.createdBy')}</label>
              <p className="text-base text-gray-900">{po.created_by_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('purchasing.poDetailModal.createdAt')}</label>
              <p className="text-base text-gray-900">{formatDateTime(po.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('purchasing.poDetailModal.totalAmount')}</label>
              <p className="text-base font-bold text-blue-600">฿{totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {po.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">{t('purchasing.poDetailModal.notes')}</label>
              <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{po.notes}</p>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('purchasing.poDetailModal.lineItems')}</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('purchasing.poDetailModal.itemCode')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('purchasing.poDetailModal.description')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('purchasing.poDetailModal.quantity')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('purchasing.poDetailModal.unitCost')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('purchasing.poDetailModal.lineTotal')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {po.line_items?.map((line, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{line.line_number}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{line.item_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{line.description}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{line.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">฿{line.unit_cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        ฿{line.line_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50">
                    <td colSpan={5} className="px-4 py-3 text-right font-semibold text-gray-900">
                      {t('purchasing.poDetailModal.totalAmount')}:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-lg text-blue-600">
                      ฿{totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            {t('purchasing.poDetailModal.close')}
          </Button>
        </div>
      </div>
    </div>
  )
}
