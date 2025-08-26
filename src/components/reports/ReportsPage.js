import React, { useState, useEffect } from 'react'
import { supabase, DEPARTMENTS } from '../../services/supabase'
import { Calendar, Download, Filter, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const [selectedDepartment, setSelectedDepartment] = useState('All')
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({
    totalDraws: 0,
    totalRestocks: 0,
    overdrawnCount: 0,
    departmentStats: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    generateReport()
  }, [])

  const generateReport = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (selectedDepartment !== 'All') {
        query = query.eq('department', selectedDepartment)
      }

      const { data } = await query

      setTransactions(data || [])
      calculateSummary(data || [])

    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างรายงาน')
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (data) => {
    const draws = data.filter(t => t.type === 'DRAW')
    const restocks = data.filter(t => t.type === 'RESTOCK')
    const overdrawn = data.filter(t => t.status === 'Overdrawn')

    // Department statistics
    const deptStats = {}
    data.forEach(txn => {
      if (!deptStats[txn.department]) {
        deptStats[txn.department] = { draws: 0, restocks: 0, total: 0 }
      }
      deptStats[txn.department].total++
      if (txn.type === 'DRAW') deptStats[txn.department].draws++
      if (txn.type === 'RESTOCK') deptStats[txn.department].restocks++
    })

    setSummary({
      totalDraws: draws.length,
      totalRestocks: restocks.length,
      overdrawnCount: overdrawn.length,
      departmentStats: Object.entries(deptStats).map(([dept, stats]) => ({
        department: dept,
        ...stats
      }))
    })
  }

  const setQuickRange = (type) => {
    const today = new Date()
    let start, end

    switch (type) {
      case 'today':
        start = end = format(today, 'yyyy-MM-dd')
        break
      case 'week':
        start = format(subDays(today, 7), 'yyyy-MM-dd')
        end = format(today, 'yyyy-MM-dd')
        break
      case 'month':
        start = format(startOfMonth(today), 'yyyy-MM-dd')
        end = format(endOfMonth(today), 'yyyy-MM-dd')
        break
      case 'year':
        start = format(startOfYear(today), 'yyyy-MM-dd')
        end = format(today, 'yyyy-MM-dd')
        break
      default:
        return
    }

    setDateRange({ start, end })
  }

  const exportToCSV = () => {
    const headers = ['วันที่', 'เวลา', 'ประเภท', 'SKU', 'ชื่อสินค้า', 'จำนวน', 'หน่วย', 'แผนก', 'ผู้ดำเนินการ', 'อ้างอิง', 'สถานะ']
    
    const csvData = [
      headers.join(','),
      ...transactions.map(t => [
        format(new Date(t.created_at), 'yyyy-MM-dd'),
        format(new Date(t.created_at), 'HH:mm:ss'),
        t.type === 'DRAW' ? 'เบิก' : t.type === 'RESTOCK' ? 'รับ' : 'ปรับ',
        t.sku,
        `"${t.item_name}"`,
        t.quantity,
        t.unit,
        t.department,
        `"${t.user_name || t.user_email}"`,
        `"${t.reference || ''}"`,
        t.status === 'Overdrawn' ? 'เบิกเกิน' : 'ปกติ'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventory-report-${dateRange.start}-to-${dateRange.end}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">รายงานการใช้งาน</h1>
        <button
          onClick={exportToCSV}
          disabled={transactions.length === 0}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>ส่งออก CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              แผนก
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">ทุกแผนก</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>{loading ? 'กำลังโหลด...' : 'สร้างรายงาน'}</span>
            </button>
          </div>
        </div>

        {/* Quick Date Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setQuickRange('today')}
            className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            วันนี้
          </button>
          <button
            onClick={() => setQuickRange('week')}
            className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            7 วันล่าสุด
          </button>
          <button
            onClick={() => setQuickRange('month')}
            className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            เดือนนี้
          </button>
          <button
            onClick={() => setQuickRange('year')}
            className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            ปีนี้
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">จำนวนการเบิก</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalDraws}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">จำนวนการรับ</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalRestocks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">การเบิกเกิน</p>
              <p className="text-2xl font-bold text-gray-900">{summary.overdrawnCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      {summary.departmentStats.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">สถิติตามแผนก</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    แผนก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การเบิก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การรับ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รวม
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.departmentStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {stat.draws}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {stat.restocks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">รายการธุรกรรม ({transactions.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่/เวลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สินค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แผนก
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้ดำเนินการ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(txn.created_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      txn.type === 'DRAW' ? 'bg-red-100 text-red-800' :
                      txn.type === 'RESTOCK' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {txn.type === 'DRAW' ? 'เบิก' : txn.type === 'RESTOCK' ? 'รับ' : 'ปรับ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.item_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.quantity} {txn.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {txn.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {txn.user_name || txn.user_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      txn.status === 'Overdrawn' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {txn.status === 'Overdrawn' ? 'เบิกเกิน' : 'ปกติ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
