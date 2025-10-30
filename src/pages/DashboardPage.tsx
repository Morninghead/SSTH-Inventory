import { useState, useEffect } from 'react'
import { Package, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import { supabase } from '../lib/supabase'

interface DashboardStats {
  totalItems: number
  lowStockItems: number
  totalValue: number
  outOfStock: number
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    outOfStock: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)

      // Get all active items with inventory status
      const { data: items, error } = await supabase
        .from('items')
        .select(`
          item_id,
          unit_cost,
          reorder_level,
          inventory_status(quantity)
        `)
        .eq('is_active', true)

      if (error) throw error

      // Calculate stats
      const totalItems = items?.length || 0
      let lowStockCount = 0
      let outOfStockCount = 0
      let totalValue = 0

      items?.forEach((item: any) => {
        const quantity = item.inventory_status?.[0]?.quantity || 0
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome back, {profile?.full_name || 'User'}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Total Items</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalItems}
                </div>
                <div className="mt-1 text-sm text-gray-600">Active inventory items</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Low Stock</div>
                <div className="mt-2 text-3xl font-bold text-yellow-600">
                  {loading ? '...' : stats.lowStockItems}
                </div>
                <div className="mt-1 text-sm text-gray-600">Below reorder level</div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <TrendingDown className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Total Value</div>
                <div className="mt-2 text-3xl font-bold text-green-600">
                  ${loading ? '...' : stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="mt-1 text-sm text-gray-600">Inventory worth</div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Out of Stock</div>
                <div className="mt-2 text-3xl font-bold text-red-600">
                  {loading ? '...' : stats.outOfStock}
                </div>
                <div className="mt-1 text-sm text-gray-600">Urgent attention needed</div>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ShoppingCart className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        <Card title="System Status">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">✅ New System Active!</h3>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>✅ Full TypeScript types</li>
                  <li>✅ Working authentication</li>
                  <li>✅ Database connected</li>
                  <li>✅ Inventory pages ready!</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Your Profile</h3>
                <p className="text-sm text-purple-700">Name: {profile?.full_name || 'N/A'}</p>
                <p className="text-sm text-purple-700">Role: {profile?.role}</p>
                <p className="text-sm text-purple-700">
                  Status: {profile?.is_active ? 'Active ✓' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
