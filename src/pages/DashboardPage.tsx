import { useState, useEffect } from 'react'
import { Package, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'
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

const StatCard = ({ title, value, icon: Icon, colorClass, note }: any) => (
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className={`mt-1 text-3xl font-bold ${colorClass}`}>
          {value}
        </div>
        <p className="mt-1 text-sm text-gray-600">{note}</p>
      </div>
      <div className={`p-3 bg-gray-100 rounded-full`}>
        <Icon className={`w-7 h-7 ${colorClass}`} />
      </div>
    </div>
  </Card>
)

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

      const totalItems = items?.length || 0
      let lowStockCount = 0
      let outOfStockCount = 0
      let totalValue = 0

      items?.forEach((item: any) => {
        const quantity = item.inventory_status?.[0]?.quantity || 0
        const unitCost = item.unit_cost || 0
        const reorderLevel = item.reorder_level || 0
        totalValue += quantity * unitCost
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome back, {profile?.full_name || 'User'}!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Items"
            value={loading ? '...' : stats.totalItems}
            icon={Package}
            colorClass="text-okabe-ito-blue"
            note="Active items"
          />
          <StatCard
            title="Low Stock"
            value={loading ? '...' : stats.lowStockItems}
            icon={TrendingDown}
            colorClass="text-okabe-ito-orange"
            note="Nearing reorder level"
          />
          <StatCard
            title="Out of Stock"
            value={loading ? '...' : stats.outOfStock}
            icon={AlertTriangle}
            colorClass="text-okabe-ito-vermillion"
            note="Immediate attention"
          />
          <StatCard
            title="Total Value"
            value={`$${loading ? '...' : stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            colorClass="text-okabe-ito-bluishGreen"
            note="Current inventory worth"
          />
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">🚀 New System Active!</h3>
              <ul className="space-y-1 text-gray-600">
                <li>✅ Full TypeScript types</li>
                <li>✅ Modern, accessible UI</li>
                <li>✅ Supabase backend connected</li>
                <li>✅ Core features ready</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Your Profile</h3>
              <p>Name: <span className="font-medium text-gray-800">{profile?.full_name || 'N/A'}</span></p>
              <p>Role: <span className="font-medium text-gray-800">{profile?.role}</span></p>
              <p>Status: <span className={`font-medium ${profile?.is_active ? 'text-okabe-ito-bluishGreen' : 'text-okabe-ito-vermillion'}`}>{profile?.is_active ? 'Active ✓' : 'Inactive'}</span></p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
