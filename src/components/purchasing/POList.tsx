import { useState, useEffect } from 'react'
import { Search, Calendar, Filter, FileText, Eye, Power, PowerOff } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { useI18n } from '../../i18n'
import { useAuth } from '../../contexts/AuthContext'

type Supplier = Database['public']['Tables']['suppliers']['Row']

interface POListProps {
  onViewPO: (poId: string) => void
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
  is_enabled: boolean
}

export default function POList({ onViewPO, refreshTrigger }: POListProps) {
  const { t } = useI18n()
  const { isAdmin } = useAuth()
  const [pos, setPos] = useState<PurchaseOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  useEffect(() => {
    loadSuppliers()
  }, [])

  useEffect(() => {
    loadPOs()
  }, [filterSupplier, startDate, endDate, searchTerm, refreshTrigger])

  const togglePOEnabled = async (poId: string, currentStatus: boolean) => {
    if (!isAdmin()) return

    try {
      const { error } = await supabase
        .from('purchase_order')
        .update({
          is_enabled: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('po_id', poId)

      if (error) {
        console.error('Error toggling PO status:', error)
        return
      }

      // Refresh the PO list
      loadPOs()
    } catch (error) {
      console.error('Error toggling PO status:', error)
    }
  }

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
          po_number,
          supplier_id,
          po_date,
          expected_date,
          status,
          total_amount,
          is_enabled,
          created_by,
          suppliers!inner(supplier_name)
        `)

      // No status filtering - POs come from external system
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
          supplier_name: (po.suppliers as any)?.supplier_name || 'Unknown',
          po_date: po.po_date || '', // Convert null to empty string
          expected_date: null, // Not in database schema
          status: po.status || 'DRAFT',
          total_amount: 0, // Not in database schema - would need to calculate from PO lines
          line_count: lineCount,
          created_by_name: userProfile?.full_name || 'Unknown',
          is_enabled: po.is_enabled !== false // Default to true if null/undefined
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


  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === '') return '-'
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
              {t('purchasing.poList.search')}
            </label>
            <Input
              type="text"
              placeholder={t('purchasing.poList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isAdmin() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Power className="w-4 h-4 inline mr-1" />
                {t('purchasing.poList.status')} {t('purchasing.poList.adminToggle')}
              </label>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="flex items-center">
                  <Power className="w-4 h-4 mr-1 text-green-500" />
                  {t('purchasing.poList.enabled')} = Active
                </span>
                <span className="flex items-center">
                  <PowerOff className="w-4 h-4 mr-1 text-gray-400" />
                  {t('purchasing.poList.disabled')} = Inactive
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              {t('purchasing.supplier')}
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('purchasing.poList.allSuppliers')}</option>
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
              {t('purchasing.poList.startDate')}
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
              {t('purchasing.poList.endDate')}
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
            {t('purchasing.poList.showingPurchaseOrders', { filtered: filteredPOs.length, total: pos.length })}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSearchTerm('')
              setFilterSupplier('')
              setStartDate('')
              setEndDate('')
            }}
          >
            {t('purchasing.poList.clearFilters')}
          </Button>
        </div>
      </div>

      {/* PO List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">{t('purchasing.poList.loadingPurchaseOrders')}</p>
        </div>
      ) : filteredPOs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('purchasing.poList.noPurchaseOrdersFound')}</h3>
          <p className="text-gray-600">
            {searchTerm || filterSupplier || startDate || endDate
              ? t('purchasing.poList.tryAdjustingFilters')
              : t('purchasing.poList.noPOsCreatedYet')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('purchasing.poList.poNumber')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('purchasing.supplier')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('purchasing.poDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('purchasing.expectedDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('purchasing.poList.items')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('purchasing.poList.totalTHB')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('purchasing.poList.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
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
                      {formatDate(po.expected_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {po.line_count} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ฿{po.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {po.is_enabled ? (
                          <div className="flex items-center text-green-600">
                            <Power className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">{t('purchasing.poList.enabled')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <PowerOff className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">{t('purchasing.poList.disabled')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => onViewPO(po.po_id)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700"
                        title={t('purchasing.poList.viewDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => togglePOEnabled(po.po_id, po.is_enabled)}
                          className={`inline-flex items-center ${po.is_enabled ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`}
                          title={po.is_enabled ? t('purchasing.poList.disablePO') : t('purchasing.poList.enablePO')}
                        >
                          {po.is_enabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
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
