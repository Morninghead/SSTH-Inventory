import { useState, useEffect } from 'react'
import { Download, Calendar, Filter, TrendingDown, TrendingUp, Settings } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { exportToCSV, formatCurrency, formatDate, getDateRangePreset, type TransactionReportData } from '../../utils/reportUtils'

export default function TransactionReport() {
  const [data, setData] = useState<TransactionReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [departments, setDepartments] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')

  useEffect(() => {
    loadDepartments()
    loadSuppliers()
    // Default to last 30 days
    const { startDate: start, endDate: end } = getDateRangePreset('month')
    setStartDate(start)
    setEndDate(end)
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadData()
    }
  }, [startDate, endDate, filterType, filterDepartment, filterSupplier])

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('dept_name')
    setDepartments(data || [])
  }

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('supplier_name')
    setSuppliers(data || [])
  }

  const loadData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('transactions')
        .select(`
          transaction_id,
          transaction_type,
          transaction_date,
          department:departments(dept_name),
          supplier:suppliers(supplier_name),
          transaction_lines(
            quantity,
            unit_cost,
            line_total,
            item:items(item_code, description)
          )
        `)
        .gte('transaction_date', new Date(startDate).toISOString())
        .lte('transaction_date', new Date(endDate + 'T23:59:59').toISOString())
        .order('transaction_date', { ascending: false })

      if (filterType !== 'ALL') {
        query = query.eq('transaction_type', filterType)
      }

      if (filterDepartment) {
        query = query.eq('department_id', filterDepartment)
      }

      if (filterSupplier) {
        query = query.eq('supplier_id', filterSupplier)
      }

      const { data: transactions, error } = await query

      if (error) throw error

      // Flatten transaction lines into report data
      const reportData: TransactionReportData[] = []
      ;(transactions as any[]).forEach(tx => {
        tx.transaction_lines?.forEach((line: any) => {
          reportData.push({
            transaction_date: tx.transaction_date,
            transaction_type: tx.transaction_type,
            department_name: (tx.department as any)?.dept_name,
            supplier_name: (tx.supplier as any)?.supplier_name,
            item_code: line.item?.item_code || '',
            description: line.item?.description || '',
            quantity: line.quantity,
            unit_cost: line.unit_cost,
            line_total: line.line_total
          })
        })
      })

      setData(reportData)
    } catch (error) {
      console.error('Error loading transaction report:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    totalTransactions: data.length,
    totalIssued: data.filter(t => t.transaction_type === 'ISSUE').reduce((sum, t) => sum + t.line_total, 0),
    totalReceived: data.filter(t => t.transaction_type === 'RECEIVE').reduce((sum, t) => sum + t.line_total, 0),
    totalAdjustments: data.filter(t => t.transaction_type === 'ADJUSTMENT').length
  }

  const handleExport = () => {
    exportToCSV(data, 'transaction-report')
  }

  const handleDatePreset = (preset: 'week' | 'month' | 'quarter' | 'year') => {
    const { startDate: start, endDate: end } = getDateRangePreset(preset)
    setStartDate(start)
    setEndDate(end)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ISSUE':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'RECEIVE':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'ADJUSTMENT':
        return <Settings className="w-5 h-5 text-blue-600" />
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      ISSUE: 'bg-red-100 text-red-800',
      RECEIVE: 'bg-green-100 text-green-800',
      ADJUSTMENT: 'bg-blue-100 text-blue-800'
    }
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Issued</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalIssued)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalReceived)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Adjustments</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalAdjustments}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Date Presets */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Date Range:</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleDatePreset('week')}>
            Last 7 Days
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleDatePreset('month')}>
            Last 30 Days
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleDatePreset('quarter')}>
            Last 90 Days
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleDatePreset('year')}>
            Last Year
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              <option value="ISSUE">Issue</option>
              <option value="RECEIVE">Receive</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(sup => (
                <option key={sup.supplier_id} value={sup.supplier_id}>
                  {sup.supplier_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button onClick={handleExport} variant="secondary" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading report...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept/Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Line Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.transaction_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(item.transaction_type)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(item.transaction_type)}`}>
                          {item.transaction_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.department_name || item.supplier_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.item_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(item.line_total)}
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
