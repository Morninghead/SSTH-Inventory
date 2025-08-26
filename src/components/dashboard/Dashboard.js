import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { Package, TrendingDown, AlertTriangle, Activity, Search, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    todayTransactions: 0,
    overdrawnItems: 0
  })
  const [recentItems, setRecentItems] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load stats
      const { data: items } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'Active')

      const { data: todayTxns } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', new Date().toISOString().split('T')[0])

      const { data: backOrders } = await supabase
        .from('back_orders')
        .select('*')
        .eq('status', 'Pending')

      // Calculate stats
      const lowStock = items?.filter(item => 
        item.quantity <= item.reorder_level && item.reorder_level > 0
      ) || []

      setStats({
        totalItems: items?.length || 0,
        lowStockItems: lowStock.length,
        todayTransactions: todayTxns?.length || 0,
        overdrawnItems: backOrders?.length || 0
      })

      // Load recent items
      const { data: recent } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentItems(recent || [])
      setLowStockItems(lowStock.slice(0, 5))

      // Load recent transactions
      const { data: recentTxns } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentTransactions(recentTxns || [])

    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const searchItems = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    try {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'Active')
        .or(`sku.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(10)

      setSearchResults(data || [])
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการค้นหา')
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchItems()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <button
          onClick={loadDashboardData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          รีเฟรช
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="จำนวนสินค้าทั้งหมด"
          value={stats.totalItems}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="สินค้าใกล้หมด"
          value={stats.lowStockItems}
          icon={TrendingDown}
          color="bg-yellow-500"
        />
        <StatCard
          title="ธุรกรรมวันนี้"
          value={stats.todayTransactions}
          icon={Activity}
          color="bg-green-500"
        />
        <StatCard
          title="สินค้าขาด (Back Order)"
          value={stats.overdrawnItems}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">ค้นหาสินค้า</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วย SKU หรือชื่อสินค้า"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.quantity} {item.unit}
                  </div>
                  <div className="text-sm text-gray-500">{item.location}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">สินค้าที่เพิ่มล่าสุด</h2>
          </div>
          <div className="p-6 space-y-4">
            {recentItems.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.quantity} {item.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-yellow-600">สินค้าใกล้หมด</h2>
          </div>
          <div className="p-6 space-y-4">
            {lowStockItems.length > 0 ? lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-red-600">
                    {item.quantity} / {item.reorder_level} {item.unit}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-gray-500 text-center py-4">ไม่มีสินค้าใกล้หมด</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">ธุรกรรมล่าสุด</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เวลา
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((txn) => (
                <tr key={txn.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(txn.created_at).toLocaleString('th-TH')}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
