import { useState, useEffect } from 'react'
import { X, Calendar, User, Building, Package, DollarSign, FileText, Download, AlertCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'
import type { Database } from '../../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionLine = Database['public']['Tables']['transaction_lines']['Row'] & {
  items: {
    item_code: string
    description: string
    unit_cost: number
  }
}

interface TransactionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: string | null
}

export default function TransactionDetailModal({ isOpen, onClose, transactionId }: TransactionDetailModalProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [transactionLines, setTransactionLines] = useState<TransactionLine[]>([])

  useEffect(() => {
    if (isOpen && transactionId) {
      loadTransactionDetails()
    }
  }, [isOpen, transactionId])

  const loadTransactionDetails = async () => {
    if (!transactionId) return

    try {
      setLoading(true)

      // Load transaction header
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select(`
          *,
          user_profiles!transactions_created_by_fkey (full_name),
          departments!transactions_department_id_fkey (department_name)
        `)
        .eq('transaction_id', transactionId)
        .single()

      if (transError) throw transError
      setTransaction(transData)

      // Load transaction lines
      const { data: linesData, error: linesError } = await supabase
        .from('transaction_lines')
        .select(`
          *,
          items (item_code, description, unit_cost)
        `)
        .eq('transaction_id', transactionId)
        .order('line_number')

      if (linesError) throw linesError
      setTransactionLines(linesData || [])
    } catch (error) {
      console.error('Error loading transaction details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!transaction) return

    const csvContent = [
      ['Transaction Details'],
      ['Reference Number', transaction.reference_number],
      ['Type', transaction.transaction_type],
      ['Date', new Date(transaction.transaction_date).toLocaleDateString()],
      ['Status', transaction.status],
      ['Department', transaction.department_id || 'N/A'],
      ['Notes', transaction.notes || ''],
      [],
      ['Items'],
      ['Line No.', 'Item Code', 'Description', 'Quantity', 'Unit Cost', 'Total Cost', 'Notes'],
      ...transactionLines.map((line, index) => [
        index + 1,
        line.items.item_code,
        line.items.description,
        line.quantity.toString(),
        line.items.unit_cost.toFixed(2),
        (line.quantity * line.items.unit_cost).toFixed(2),
        line.notes || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transaction_${transaction.reference_number}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-gray-600 bg-gray-100'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      case 'COMPLETED': return 'text-green-600 bg-green-100'
      case 'CANCELLED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ISSUE': return <Package className="w-5 h-5" />
      case 'RECEIVE': return <Download className="w-5 h-5" />
      case 'ADJUSTMENT': return <AlertCircle className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details" size="lg">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : transaction ? (
        <div className="space-y-6">
          {/* Transaction Header */}
          <Card className="bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-500">Reference</label>
                <p className="font-semibold">{transaction.reference_number}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Type</label>
                <p className="font-semibold flex items-center gap-2">
                  {getTypeIcon(transaction.transaction_type)}
                  {transaction.transaction_type}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date</label>
                <p className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </p>
              </div>
            </div>
          </Card>

          {/* Additional Details */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Details</h3>
            <div className="space-y-3">
              {transaction.department_id && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Department:</span>
                  <span className="font-medium">
                    {(transaction as any).departments?.department_name || 'N/A'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Created By:</span>
                <span className="font-medium">
                  {(transaction as any).user_profiles?.full_name || 'N/A'}
                </span>
              </div>
              {transaction.notes && (
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-500 mt-1" />
                  <span className="text-sm text-gray-500">Notes:</span>
                  <span className="font-medium flex-1">{transaction.notes}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Transaction Lines */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Items ({transactionLines.length})</h3>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">#</th>
                    <th className="text-left py-2">Item Code</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-right py-2">Unit Cost</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionLines.map((line, index) => (
                    <tr key={line.line_id} className="border-b">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2 font-medium">{line.items.item_code}</td>
                      <td className="py-2">{line.items.description}</td>
                      <td className="text-right py-2">{line.quantity}</td>
                      <td className="text-right py-2">฿{line.items.unit_cost.toFixed(2)}</td>
                      <td className="text-right py-2 font-semibold">
                        ฿{(line.quantity * line.items.unit_cost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={5} className="text-right py-2">Total:</td>
                    <td className="text-right py-2">
                      ฿{transactionLines.reduce((sum, line) => sum + (line.quantity * line.items.unit_cost), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">Transaction not found</p>
      )}
    </Modal>
  )
}