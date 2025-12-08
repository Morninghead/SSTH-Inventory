import { AlertTriangle, Package, Clock, Check } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface BackorderItem {
  item_code: string
  description: string
  requested_qty: number
  available_qty: number
  backorder_qty: number
}

interface BackorderAlertModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  backorderItems: BackorderItem[]
  language: 'en' | 'th'
}

const translations = {
  en: {
    title: 'Items Going to Backorder (ค้างจ่าย)',
    subtitle: 'The following items have insufficient stock and will be placed on backorder:',
    itemCode: 'Item Code',
    description: 'Description',
    requested: 'Requested',
    available: 'Available',
    backorder: 'Backorder',
    note: 'Note: These items will be issued when stock becomes available.',
    confirm: 'Continue with Backorder',
    cancel: 'Cancel Transaction'
  },
  th: {
    title: 'รายการที่จะค้างจ่าย',
    subtitle: 'รายการต่อไปนี้มีสต็อกไม่เพียงพอและจะถูกจดทะเบียนเป็นการค้างจ่าย:',
    itemCode: 'รหัสสินค้า',
    description: 'รายละเอียด',
    requested: 'ต้องการ',
    available: 'มีอยู่',
    backorder: 'ค้างจ่าย',
    note: 'หมายเหตุ: รายการเหล่านี้จะได้รับการจ่ายเมื่อมีสต็อกเพียงพอ',
    confirm: 'ดำเนินการค้างจ่าย',
    cancel: 'ยกเลิกการทำรายการ'
  }
}

export default function BackorderAlertModal({
  isOpen,
  onClose,
  onConfirm,
  backorderItems,
  language
}: BackorderAlertModalProps) {
  const t = translations[language]

  console.log('🔍 BackorderAlertModal render - isOpen:', isOpen, 'backorderItems:', backorderItems)

  if (!isOpen) {
    console.log('🔍 BackorderAlertModal - isOpen is false, not rendering')
    return null
  }

  console.log('🔍 BackorderAlertModal - rendering modal')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title}>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.itemCode}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.description}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.requested}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.available}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.backorder}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backorderItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.item_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {item.requested_qty}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.available_qty > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.available_qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {item.backorder_qty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                {t.note}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
            >
              <Check className="w-4 h-4 mr-2" />
              {t.confirm}
            </Button>
          </div>
        </div>
          </div>
    </Modal>
  )
}