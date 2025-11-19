import { useState, useEffect } from 'react'
import { Package, TrendingDown, ShoppingCart, AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import { supabase } from '../lib/supabase'

interface DashboardStats {
  totalItems: number
  lowStockItems: number
  totalValue: number
  outOfStock: number
  recentTransactions: number
  departmentsCount: number
  categoriesCount: number
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    outOfStock: 0,
    recentTransactions: 0,
    departmentsCount: 0,
    categoriesCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)

      // Get all active items first
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select(`
          item_id,
          unit_cost,
          reorder_level
        `)
        .eq('is_active', true)

      if (itemsError) throw itemsError

      // Get inventory status separately
      const itemIds = items?.map(item => item.item_id) || []
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_status')
        .select('item_id, quantity')
        .in('item_id', itemIds)

      if (inventoryError) {
        console.warn('Failed to fetch inventory status for dashboard:', inventoryError)
      }

      // Get recent transactions count (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: recentTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('transaction_id')
        .gte('created_at', sevenDaysAgo.toISOString())

      if (transactionsError) {
        console.warn('Failed to fetch recent transactions:', transactionsError)
      }

      // Get departments count
      const { data: departments, error: departmentsError } = await supabase
        .from('departments')
        .select('department_id')
        .eq('is_active', true)

      if (departmentsError) {
        console.warn('Failed to fetch departments:', departmentsError)
      }

      // Get categories count
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('category_id')
        .eq('is_active', true)

      if (categoriesError) {
        console.warn('Failed to fetch categories:', categoriesError)
      }

      // Calculate stats
      const totalItems = items?.length || 0
      let lowStockCount = 0
      let outOfStockCount = 0
      let totalValue = 0

      items?.forEach((item: any) => {
        const inventoryRecord = inventoryData?.find(inv => inv.item_id === item.item_id)
        const quantity = inventoryRecord?.quantity || 0
        const unitCost = item.unit_cost || 0
        const reorderLevel = item.reorder_level || 0

        // Calculate total inventory value
        totalValue += quantity * unitCost

        // Count low stock items
        if (quantity === 0) {
          outOfStockCount++
        } else if (quantity <= reorderLevel && reorderLevel > 0) {
          lowStockCount++
        }
      })

      setStats({
        totalItems,
        lowStockItems: lowStockCount,
        totalValue,
        outOfStock: outOfStockCount,
        recentTransactions: recentTransactions?.length || 0,
        departmentsCount: departments?.length || 0,
        categoriesCount: categories?.length || 0,
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Welcome back, {profile?.full_name || 'User'}!
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              System Online
            </span>
          </div>
        </div>

        {/* Main KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalItems.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">Active inventory</p>
              </div>
              <div className="ml-4 p-3 bg-blue-100 rounded-lg">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  ฿{loading ? '...' : stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-gray-500">Inventory worth</p>
              </div>
              <div className="ml-4 p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {loading ? '...' : stats.lowStockItems.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">Needs reorder</p>
              </div>
              <div className="ml-4 p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {loading ? '...' : stats.outOfStock.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">Critical items</p>
              </div>
              <div className="ml-4 p-3 bg-red-100 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {loading ? '...' : stats.recentTransactions}
                </p>
                <p className="mt-1 text-xs text-gray-500">Transactions (7 days)</p>
              </div>
              <div className="ml-3 p-2 bg-gray-100 rounded-lg">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {loading ? '...' : stats.departmentsCount}
                </p>
                <p className="mt-1 text-xs text-gray-500">Active departments</p>
              </div>
              <div className="ml-3 p-2 bg-gray-100 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {loading ? '...' : stats.categoriesCount}
                </p>
                <p className="mt-1 text-xs text-gray-500">Product categories</p>
              </div>
              <div className="ml-3 p-2 bg-gray-100 rounded-lg">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-600">Common tasks and navigation</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/inventory"
              className="group flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Package className="w-10 h-10 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-gray-900 mb-1">Inventory</span>
              <span className="text-xs text-gray-500 text-center">Manage items</span>
            </a>

            <a
              href="/transactions"
              className="group flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="w-10 h-10 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-gray-900 mb-1">Transactions</span>
              <span className="text-xs text-gray-500 text-center">Issue/Receive</span>
            </a>

            <a
              href="/purchasing"
              className="group flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <TrendingUp className="w-10 h-10 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-gray-900 mb-1">Purchasing</span>
              <span className="text-xs text-gray-500 text-center">Purchase orders</span>
            </a>

            <a
              href="/reports"
              className="group flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <TrendingDown className="w-10 h-10 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-gray-900 mb-1">Reports</span>
              <span className="text-xs text-gray-500 text-center">Analytics</span>
            </a>
          </div>
        </Card>

        {/* Alerts Section */}
        {(stats.outOfStock > 0 || stats.lowStockItems > 0) && (
          <Card className="border-l-4 border-l-red-500 bg-red-50 border-red-200">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Inventory Alerts</h3>
                <div className="mt-2 text-sm text-red-700">
                  {stats.outOfStock > 0 && (
                    <p>• {stats.outOfStock} items are out of stock and require immediate attention</p>
                  )}
                  {stats.lowStockItems > 0 && (
                    <p>• {stats.lowStockItems} items are below reorder level</p>
                  )}
                </div>
                <div className="mt-3">
                  <a
                    href="/inventory"
                    className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    View inventory details →
                  </a>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
