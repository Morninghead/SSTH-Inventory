import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Filter,
  BarChart3,
  Target,
  Clock,
  ChevronUp,
  ChevronDown,
  Download
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'
import type { Database } from '../../types/database.types'

type BackorderWithDetails = Database['public']['Tables']['backorders']['Row'] & {
  items: {
    item_code: string
    description: string
    unit_cost: number
    reorder_level: number
  }
  departments: {
    dept_name: string
  }
}

type BackorderAnalytics = {
  totalBackorders: number
  totalQuantity: number
  totalValue: number
  departmentsWithBackorders: number
  averageBackorderAge: number
  criticalItems: number
  monthlyTrend: number
}

export default function BackorderList() {
  const { language } = useI18n()
  const [backorders, setBackorders] = useState<BackorderWithDetails[]>([])
  const [analytics, setAnalytics] = useState<BackorderAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [sortBy, setSortBy] = useState<'created_at' | 'quantity' | 'value'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    loadBackorders()
    loadDepartments()
  }, [searchTerm, filterDepartment, filterStatus, sortBy, sortOrder])

  const loadBackorders = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('backorders')
        .select(`
          *,
          items!inner(
            item_code,
            description,
            unit_cost,
            reorder_level
          ),
          departments!inner(dept_name)
        `)

      // Apply filters
      if (searchTerm) {
        query = query.or(`items.item_code.ilike.%${searchTerm}%,items.description.ilike.%${searchTerm}%`)
      }

      if (filterDepartment) {
        query = query.eq('department_id', filterDepartment)
      }

      if (filterStatus !== 'ALL') {
        query = query.eq('status', filterStatus)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error

      // Type cast to handle nullable unit_cost and reorder_level
      const typedData = (data || []).map(item => ({
        ...item,
        items: {
          ...item.items,
          unit_cost: item.items?.unit_cost || 0,
          reorder_level: item.items?.reorder_level || 0
        }
      })) as BackorderWithDetails[]

      setBackorders(typedData)

      // Calculate analytics
      if (typedData && typedData.length > 0) {
        calculateAnalytics(typedData)
      } else {
        setAnalytics({
          totalBackorders: 0,
          totalQuantity: 0,
          totalValue: 0,
          departmentsWithBackorders: 0,
          averageBackorderAge: 0,
          criticalItems: 0,
          monthlyTrend: 0
        })
      }
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

  const calculateAnalytics = (backorderData: BackorderWithDetails[]) => {
    const now = new Date()
    const totalValue = backorderData.reduce((sum, bo) =>
      sum + (bo.quantity * bo.items.unit_cost), 0
    )

    const totalAge = backorderData.reduce((sum, bo) =>
      sum + (now.getTime() - new Date(bo.created_at).getTime()), 0
    )

    const uniqueDepartments = new Set(backorderData.map(bo => bo.department_id)).size

    const criticalItems = backorderData.filter(bo =>
      bo.quantity > (bo.items.reorder_level * 2)
    ).length

    // Calculate monthly trend (simplified - compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recentBackorders = backorderData.filter(bo =>
      new Date(bo.created_at) >= thirtyDaysAgo
    ).length

    const previousBackorders = backorderData.filter(bo => {
      const created = new Date(bo.created_at)
      return created >= sixtyDaysAgo && created < thirtyDaysAgo
    }).length

    const monthlyTrend = previousBackorders > 0
      ? ((recentBackorders - previousBackorders) / previousBackorders) * 100
      : 0

    setAnalytics({
      totalBackorders: backorderData.length,
      totalQuantity: backorderData.reduce((sum, bo) => sum + bo.quantity, 0),
      totalValue,
      departmentsWithBackorders: uniqueDepartments,
      averageBackorderAge: totalAge / backorderData.length / (1000 * 60 * 60 * 24), // days
      criticalItems,
      monthlyTrend
    })
  }

  const filteredBackorders = backorders

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'FULFILLED': return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getBackorderValue = (backorder: BackorderWithDetails) =>
    backorder.quantity * backorder.items.unit_cost

  const getPriorityLevel = (backorder: BackorderWithDetails) => {
    const daysSinceCreated = (Date.now() - new Date(backorder.created_at).getTime()) / (1000 * 60 * 60 * 24)
    const quantityVsReorder = backorder.quantity / (backorder.items.reorder_level || 1)

    if (daysSinceCreated > 14 || quantityVsReorder > 3) return 'high'
    if (daysSinceCreated > 7 || quantityVsReorder > 2) return 'medium'
    return 'low'
  }

  const getPriorityBadge = (priority: string) => {
    const configs = {
      high: { color: 'bg-red-100 text-red-800', label: 'High Priority' },
      medium: { color: 'bg-amber-100 text-amber-800', label: 'Medium' },
      low: { color: 'bg-blue-100 text-blue-800', label: 'Low' }
    }

    const config = configs[priority as keyof typeof configs] || configs.low
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard */}
      {analytics && showAnalytics && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Backorder Analytics
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Backorders */}
            <Card className="p-4 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Backorders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalBackorders}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.totalQuantity} units
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </Card>

            {/* Total Value */}
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ฿{analytics.totalValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.departmentsWithBackorders} departments affected
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            {/* Average Age */}
            <Card className="p-4 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Age</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(analytics.averageBackorderAge)} days
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.criticalItems} critical items
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            {/* Monthly Trend */}
            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Trend</p>
                  <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                    {analytics.monthlyTrend > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    {Math.abs(Math.round(analytics.monthlyTrend))}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    vs last 30 days
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <Input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
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
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Sort By
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-')
                setSortBy(sort as any)
                setSortOrder(order as any)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="quantity-desc">Highest Quantity</option>
              <option value="quantity-asc">Lowest Quantity</option>
              <option value="value-desc">Highest Value</option>
              <option value="value-asc">Lowest Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backorder List */}
      {filteredBackorders.length === 0 ? (
        <Card className="p-8 text-center bg-green-50 border-green-200">
          <Package className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-900 mb-2">No Backorders Found</h3>
          <p className="text-green-700 max-w-md mx-auto">
            Great! No items are currently on backorder. Your inventory levels are meeting demand.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Backorders
              <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {filteredBackorders.length}
              </span>
            </h3>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>

          <div className="grid gap-3">
            {filteredBackorders.map((backorder) => {
              const priority = getPriorityLevel(backorder)
              const value = getBackorderValue(backorder)

              return (
                <Card
                  key={backorder.backorder_id}
                  className={`p-4 border-l-4 hover:shadow-md transition-shadow ${
                    priority === 'high' ? 'border-l-red-500 bg-red-50' :
                    priority === 'medium' ? 'border-l-amber-500 bg-amber-50' :
                    'border-l-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {backorder.items.item_code}
                        </h4>
                        {getPriorityBadge(priority)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(backorder.status || '')}`}>
                          {backorder.status}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-1">{backorder.items.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {backorder.departments.dept_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(backorder.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Math.round((Date.now() - new Date(backorder.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </span>
                      </div>

                      {backorder.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">{backorder.notes}</p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-gray-900">
                        {backorder.quantity} units
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        ฿{value.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ฿{backorder.items.unit_cost} per unit
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}