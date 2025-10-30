import { FileText, Construction } from 'lucide-react'

export default function TransactionList() {
  return (
    <div className="text-center py-12">
      <Construction className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Transaction History - Coming Soon
      </h3>
      <p className="text-gray-600 mb-4">
        Transaction list and history view is under development
      </p>
      <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
        <FileText className="w-4 h-4" />
        <span>View, filter, and export transaction history</span>
      </div>
    </div>
  )
}
