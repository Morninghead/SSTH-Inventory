import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, User, Package, Filter, Calendar, Download } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { useI18n } from '../../i18n/I18nProvider'

type Backorder = Database['public']['Tables']['backorders']['Row'] & {
  items?: {
    item_code: string
    description: string
  }
  departments?: {
    dept_name: string
  }
}

const translations = {
  en: {
    title: 'Backorder Report',
    subtitle: 'Track all pending backorders and stock shortages',
    backorderNo: 'Backorder #',
    itemCode: 'Item Code',
    description: 'Description',
    department: 'Department',
    quantity: 'Quantity',
    status: 'Status',
    createdAt: 'Created Date',
    notes: 'Notes',
    pending: 'Pending',
    fulfilled: 'Fulfilled',
    cancelled: 'Cancelled',
    totalBackorders: 'Total Backorders',
    totalItems: 'Total Items Backordered',
    searchPlaceholder: 'Search by item code or description...',
    filterDepartment: 'Filter by Department',
    filterStatus: 'Filter by Status',
    startDate: 'Start Date',
    endDate: 'End Date',
    clearFilters: 'Clear Filters',
    showingResults: 'Showing {filtered} of {total} backorders',
    noBackorders: 'No backorders found',
    noBackordersDescription: 'There are currently no pending backorders.',
    noMatchingBackorders: 'No backorders match your search criteria.',
    exportCsv: 'Export CSV',
    exportExcel: 'Export Excel'
  },
  th: {
    title: 'รายงานค้างจ่าย',
    subtitle: 'ติดตามการค้างจ่ายและการขาดสต็อกทั้งหมด',
    backorderNo: 'ค้างจ่าย #',
    itemCode: 'รหัสสินค้า',
    description: 'รายละเอียด',
    department: 'แผนก',
    quantity: 'จำนวน',
    status: 'สถานะ',
    createdAt: 'วันที่สร้าง',
    notes: 'หมายเหตุ',
    pending: 'รอดำเนินการ',
    fulfilled: 'ดำเนินการแล้วเสร็จ',
    cancelled: 'ยกเลิก',
    totalBackorders: 'ค้างจ่ายทั้งหมด',
    totalItems: 'สินค้าที่ค้างจ่ายทั้งหมด',
    searchPlaceholder: 'ค้นหาตามรหัสสินค้าหรือรายละเอียด...',
    filterDepartment: 'กรองตามแผนก',
    filterStatus: 'กรองตามสถานะ',
    startDate: 'วันที่เริ่มต้น',
    endDate: 'วันที่สิ้นสุด',
    clearFilters: 'ล้างตัวกรอง',
    showingResults: 'แสดง {filtered} จาก {total} การค้างจ่าย',
    noBackorders: 'ไม่พบการค้างจ่าย',
    noBackordersDescription: 'ไม่มีรายการค้างจ่ายที่รอดำเนินการในขณะนี้',
    noMatchingBackorders: 'ไม่มีการค้างจ่ายที่ตรงกับเงื่อนไขของคุณ',
    exportCsv: 'ส่งออก CSV',
    exportExcel: 'ส่งออก Excel'
  }
}

export default function BackorderReport() {
  const { language } = useI18n()
  const translations_local = translations[language]

  const [backorders, setBackorders] = useState<Backorder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    loadBackorders()
    loadDepartments()
  }, [searchTerm, filterDepartment, filterStatus, startDate, endDate])

  const loadBackorders = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('backorders')
        .select(`
          *,
          items!inner(item_code, description),
          departments!inner(dept_name)
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`items.item_code.ilike.%${searchTerm}%,items.description.ilike.%${searchTerm}%`)
      }

      if (filterDepartment) {
        query = query.eq('department_id', filterDepartment)
      }

      if (filterStatus !== 'ALL') {
        query = query.eq('status', filterStatus)
      }

      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString())
      }

      if (endDate) {
        query = query.lte('created_at', new Date(endDate + 'T23:59:59').toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setBackorders(data || [])
    } catch (error) {
      console.error('Error loading backorders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('dept_id, dept_name')
      .eq('is_active', true)
      .order('dept_name')
    setDepartments(data || [])
  }

  const filteredBackorders = backorders

  const totalBackorderValue = filteredBackorders.reduce((sum, bo) => sum + bo.quantity, 0)

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: translations_local.pending },
      FULFILLED: { color: 'bg-green-100 text-green-800', label: translations_local.fulfilled },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: translations_local.cancelled }
    }

    const config = statusMap[status as keyof typeof statusMap] || statusMap.PENDING

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Clock className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{translations_local.title}</h2>
          <p className="text-gray-600 mt-1">{translations_local.subtitle}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{translations_local.totalBackorders}</p>
              <p className="text-2xl font-bold text-gray-900">{filteredBackorders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{translations_local.totalItems}</p>
              <p className="text-2xl font-bold text-gray-900">{totalBackorderValue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exports</p>
                <div className="flex space-x-2 mt-1">
                  <Button size="sm" variant="outline">
                    {translations_local.exportCsv}
                  </Button>
                  <Button size="sm" variant="outline">
                    {translations_local.exportExcel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              {translations_local.searchPlaceholder}
            </label>
            <Input
              type="text"
              placeholder={translations_local.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              {translations_local.filterDepartment}
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{translations_local.filterDepartment}</option>
              {departments.map((dept) => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              {translations_local.filterStatus}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">{translations_local.pending}</option>
              <option value="FULFILLED">{translations_local.fulfilled}</option>
              <option value="CANCELLED">{translations_local.cancelled}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              {translations_local.startDate}
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
              {translations_local.endDate}
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
            {translations_local.showingResults.replace('{filtered}', String(filteredBackorders.length)).replace('{total}', String(backorders.length))}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSearchTerm('')
              setFilterDepartment('')
              setFilterStatus('ALL')
              setStartDate('')
              setEndDate('')
            }}
          >
            {translations_local.clearFilters}
          </Button>
        </div>
      </div>

      {/* Backorders List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading backorders...</p>
        </div>
      ) : filteredBackorders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{translations_local.noBackorders}</h3>
          <p className="text-gray-600">
            {searchTerm || filterDepartment || filterStatus !== 'ALL' || startDate || endDate
              ? translations_local.noMatchingBackorders
              : translations_local.noBackordersDescription}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations_local.backorderNo}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations_local.itemCode}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations_local.description}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations_local.department}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations_local.quantity}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations_local.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations_local.createdAt}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations_local.notes}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBackorders.map((backorder) => (
                  <tr key={backorder.backorder_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {backorder.backorder_id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backorder.items?.item_code || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {backorder.items?.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backorder.departments?.dept_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {backorder.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(backorder.status || 'PENDING')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(backorder.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {backorder.notes || '-'}
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