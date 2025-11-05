import { useState, useEffect } from 'react'
import { Search, Calendar, Filter, FileText, Package, TrendingDown, TrendingUp, Settings } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionLine = Database['public']['Tables']['transaction_lines']['Row']

interface TransactionWithDetails extends Transaction {
  department?: { dept_name: string } | null
  supplier?: { supplier_name: string } | null
  created_by_profile?: { full_name: string } | null
  transaction_lines?: (TransactionLine & {
    item?: { item_code: string; description: string } | null
  })[]
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'ISSUE' | 'RECEIVE' | 'ADJUSTMENT'>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [filterType, startDate, endDate])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          department:departments(dept_name),
          supplier:suppliers(supplier_name),
          created_by_profile:user_profiles!transactions_created_by_fkey(full_name),
          transaction_lines(
            *,
            item:items(item_code, description)
          )
        `)
        .order('transaction_date', { ascending: false })
        .limit(100)

      if (filterType !== 'ALL') {
        query = query.eq('transaction_type', filterType)
      }

      if (startDate) {
        query = query.gte('transaction_date', new Date(startDate).toISOString())
      }

      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        query = query.lte('transaction_date', endDateTime.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setTransactions(data as any || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const txAny = tx as any
    return (
      txAny.reference_no?.toLowerCase().includes(search) ||
      (tx.department as any)?.dept_name?.toLowerCase().includes(search) ||
      (tx.supplier as any)?.supplier_name?.toLowerCase().includes(search)
    )
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ISSUE':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'RECEIVE':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'ADJUSTMENT':
        return <Settings className="w-5 h-5 text-blue-600" />
      default:
        return <Package className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      ISSUE: 'bg-red-100 text-red-800',
      RECEIVE: 'bg-green-100 text-green-800',
      ADJUSTMENT: 'bg-blue-100 text-blue-800',
    }
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <Input
              type="text"
              placeholder="Ref number, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              <option value="ISSUE">Issue</option>
              <option value="RECEIVE">Receive</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSearchTerm('')
              setFilterType('ALL')
              setStartDate('')
              setEndDate('')
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'ALL' || startDate || endDate
              ? 'Try adjusting your filters'
              : 'No transactions have been created yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department/Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(tx.transaction_type)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(tx.transaction_type)}`}>
                          {tx.transaction_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.transaction_date ? formatDate(tx.transaction_date) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(tx as any).reference_no || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.transaction_type === 'ISSUE'
                        ? (tx.department as any)?.dept_name || '-'
                        : (tx.supplier as any)?.supplier_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tx.transaction_lines?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        tx.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getTypeIcon(selectedTransaction.transaction_type)}
                  <h2 className="text-2xl font-bold text-gray-900 ml-3">
                    {selectedTransaction.transaction_type} Transaction
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-base text-gray-900">
                    {selectedTransaction.transaction_date ? formatDate(selectedTransaction.transaction_date) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference Number</label>
                  <p className="text-base text-gray-900">{(selectedTransaction as any).reference_no || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {selectedTransaction.transaction_type === 'ISSUE' ? 'Department' : 'Supplier'}
                  </label>
                  <p className="text-base text-gray-900">
                    {selectedTransaction.transaction_type === 'ISSUE'
                      ? (selectedTransaction.department as any)?.dept_name || '-'
                      : (selectedTransaction.supplier as any)?.supplier_name || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-base text-gray-900">
                    {(selectedTransaction.created_by_profile as any)?.full_name || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Line Items</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTransaction.transaction_lines?.map((line: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-gray-900">{line.item?.item_code}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{line.item?.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{line.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">฿{line.unit_cost?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">฿{line.line_total?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <Button onClick={() => setSelectedTransaction(null)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
