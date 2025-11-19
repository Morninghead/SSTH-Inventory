import { useState, useEffect } from 'react'
import { Search, Calendar, Filter, FileText, Eye, Edit, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

type Supplier = Database['public']['Tables']['suppliers']['Row']

interface POListProps {
  onViewPO: (poId: string) => void
  onEditPO: (poId: string) => void
  refreshTrigger?: number
}

interface PurchaseOrderSummary {
  po_id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  po_date: string
  expected_date: string | null
  status: string
  total_amount: number
  line_count: number
  created_by_name: string
}

export default function POList({ onViewPO, onEditPO, refreshTrigger }: POListProps) {
  const [pos, setPos] = useState<PurchaseOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  useEffect(() => {
    loadSuppliers()
  }, [])

  useEffect(() => {
    loadPOs()
  }, [filterStatus, filterSupplier, startDate, endDate, searchTerm, refreshTrigger])

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('supplier_name')
    setSuppliers(data || [])
  }

  const loadPOs = async () => {
    setLoading(true)
    try {
      // Get basic PO data with supplier info
      let query = supabase
        .from('purchase_order')
        .select(`
          po_id,
          supplier_id,
          po_date,
          status,
          created_by,
          suppliers!inner(supplier_name)
        `)

      // Apply filters
      if (filterStatus !== 'ALL') {
        query = query.eq('status', filterStatus)
      }
      if (filterSupplier) {
        query = query.eq('supplier_id', filterSupplier)
      }
      if (startDate) {
        query = query.gte('po_date', new Date(startDate).toISOString())
      }
      if (endDate) {
        query = query.lte('po_date', new Date(endDate + 'T23:59:59').toISOString())
      }

      // Apply search term - search by supplier name since we don't have po_number
      if (searchTerm) {
        query = query.or(`suppliers.supplier_name.ilike.%${searchTerm}%`)
      }

      const { data: poData, error: poError } = await query
        .order('po_date', { ascending: false })
        .limit(100)

      if (poError) throw poError

      // Get line counts for each PO
      const poIds = poData?.map(po => po.po_id) || []
      const { data: lineCounts } = await supabase
        .from('purchase_order_line')
        .select('po_id')
        .in('po_id', poIds)

      // Get user profiles for created_by names
      const userIds = poData?.map(po => po.created_by).filter((id): id is string => Boolean(id)) || []
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds)

      // Transform data to match our interface
      const transformedData = poData?.map(po => {
        const lineCount = lineCounts?.filter(line => line.po_id === po.po_id).length || 0
        const userProfile = userProfiles?.find(user => user.id === po.created_by)

        return {
          po_id: po.po_id,
          po_number: `PO-${po.po_id.slice(-8)}`, // Generate PO number from ID
          supplier_id: po.supplier_id || '',
          supplier_name: po.suppliers?.supplier_name || 'Unknown',
          po_date: po.po_date,
          expected_date: null, // Not in database schema
          status: po.status || 'DRAFT',
          total_amount: 0, // Not in database schema - would need to calculate from PO lines
          line_count: lineCount,
          created_by_name: userProfile?.full_name || 'Unknown'
        }
      }) || []

      setPos(transformedData)
    } catch (error) {
      console.error('Error loading purchase orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPOs = pos

  const handleCancel = async (poId: string, poNumber: string) => {
    const reason = prompt(`Cancel Purchase Order ${poNumber}?\n\nEnter cancellation reason:`)
    if (!reason) return

    try {
      const { data, error } = await supabase
        .rpc('cancel_purchase_order' as any, {
          p_po_id: poId,
          p_reason: reason
        })

      if (error) throw error

      const result = data as any
      if (result?.[0]?.success) {
        alert('Purchase order cancelled successfully')
        loadPOs()
      } else {
        alert(result?.[0]?.message || 'Failed to cancel purchase order')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel purchase order')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      RECEIVED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <Input
              type="text"
              placeholder="PO number, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Supplier
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.supplier_name}
                </option>
              ))}
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
            Showing {filteredPOs.length} of {pos.length} purchase orders
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('ALL')
              setFilterSupplier('')
              setStartDate('')
              setEndDate('')
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* PO List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading purchase orders...</p>
        </div>
      ) : filteredPOs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Purchase Orders Found</h3>
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'ALL' || filterSupplier || startDate || endDate
              ? 'Try adjusting your filters'
              : 'No purchase orders have been created yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total (THB)
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
                {filteredPOs.map((po) => (
                  <tr key={po.po_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {po.po_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.supplier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(po.po_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.expected_date ? formatDate(po.expected_date) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {po.line_count} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ฿{po.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => onViewPO(po.po_id)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(po.status === 'DRAFT' || po.status === 'SUBMITTED') && (
                        <>
                          <button
                            onClick={() => onEditPO(po.po_id)}
                            className="inline-flex items-center text-green-600 hover:text-green-700"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(po.po_id, po.po_number)}
                            className="inline-flex items-center text-red-600 hover:text-red-700"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
