import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Package,
  Clock,
  Target,
  CheckCircle,
  BarChart3,
  Lightbulb
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'

type ProcurementRecommendation = {
  id: string
  type: 'immediate' | 'planned' | 'monitor'
  priority: 'high' | 'medium' | 'low'
  item_code: string
  description: string
  suggested_quantity: number
  estimated_cost: number
  backorder_quantity: number
  current_stock: number
  monthly_usage: number
  supplier_suggestion?: string
  rationale: string
  impact: string
}

type ProcurementAnalytics = {
  totalInvestment: number
  potential_savings: number
  urgent_items: number
  departments_affected: number
  fulfillment_rate: number
}

export default function ProcurementInsights() {
  const {} = useI18n()
  const [recommendations, setRecommendations] = useState<ProcurementRecommendation[]>([])
  const [analytics, setAnalytics] = useState<ProcurementAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'immediate' | 'planned' | 'monitor'>('all')

  useEffect(() => {
    loadProcurementInsights()
  }, [])

  const loadProcurementInsights = async () => {
    setLoading(true)
    try {
      // Get comprehensive backorder and inventory data
      const { data: backorders, error: backorderError } = await supabase
        .from('backorders')
        .select(`
          *,
          items (
            item_code,
            description,
            unit_cost,
            reorder_level,
            categories (category_name)
          ),
          departments (dept_name)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (backorderError) throw backorderError

      const recommendations: ProcurementRecommendation[] = []
      let totalInvestment = 0
      let urgentItems = 0
      const affectedDepts = new Set<string>()

      // Process each backorder to generate recommendations
      for (const backorderRaw of (backorders || [])) {
        // Type cast to handle relation queries
        const backorder = backorderRaw as any
        // Get current stock and recent usage data
        const { data: currentStock } = await supabase
          .from('inventory_status')
          .select('quantity')
          .eq('item_id', backorder.item_id)
          .single()

        const currentQty = currentStock?.quantity || 0

        // Calculate monthly usage from recent transactions (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const { data: recentUsage } = await supabase
          .from('transaction_lines')
          .select('quantity')
          .eq('item_id', backorder.item_id)
          .gte('created_at', thirtyDaysAgo.toISOString())

        const monthlyUsage = recentUsage?.reduce((sum, tl) => sum + tl.quantity, 0) || backorder.quantity

        // Determine recommendation type and priority
        const daysSinceBackorder = Math.floor(
          (Date.now() - new Date(backorder.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        const stockCoverDays = currentQty > 0 ? Math.floor((currentQty / monthlyUsage) * 30) : 0
        const urgency = daysSinceBackorder + (30 - stockCoverDays)

        let type: 'immediate' | 'planned' | 'monitor'
        let priority: 'high' | 'medium' | 'low'

        if (urgency > 21 || currentQty === 0) {
          type = 'immediate'
          priority = 'high'
          urgentItems++
        } else if (urgency > 14) {
          type = 'immediate'
          priority = 'medium'
        } else if (urgency > 7) {
          type = 'planned'
          priority = 'medium'
        } else {
          type = 'monitor'
          priority = 'low'
        }

        // Calculate suggested quantity (backorder + 2 months buffer)
        const bufferMonths = type === 'immediate' ? 3 : 2
        const suggestedQuantity = backorder.quantity + (monthlyUsage * bufferMonths)

        const estimatedCost = suggestedQuantity * (backorder.items?.unit_cost || 0)
        totalInvestment += estimatedCost
        affectedDepts.add(backorder.department_id)

        // Generate rationale and impact
        let rationale = ''
        let impact = ''

        if (currentQty === 0) {
          rationale = `Out of stock with ${backorder.quantity} units on backorder for ${daysSinceBackorder} days`
          impact = `Immediate fulfillment required - operations impacted`
        } else if (daysSinceBackorder > 14) {
          rationale = `Backorder pending for ${daysSinceBackorder} days, current stock covers ${stockCoverDays} days`
          impact = `Risk of stockout affecting ${backorder.departments?.dept_name || 'Unknown Department'} operations`
        } else {
          rationale = `Moderate backorder pressure, current stock adequate for ${stockCoverDays} days`
          impact = `Planned restocking recommended to maintain service levels`
        }

        recommendations.push({
          id: backorder.backorder_id,
          type,
          priority,
          item_code: backorder.items?.item_code || '',
          description: backorder.items?.description || '',
          suggested_quantity: suggestedQuantity,
          estimated_cost: estimatedCost,
          backorder_quantity: backorder.quantity,
          current_stock: currentQty,
          monthly_usage: monthlyUsage,
          rationale,
          impact,
          supplier_suggestion: backorder.items?.categories
            ? `Based on ${backorder.items?.categories.category_name} category requirements`
            : 'Category requirements analysis'
        })
      }

      // Calculate analytics
      const { data: fulfilledBackorders } = await supabase
        .from('backorders')
        .select('count')
        .eq('status', 'FULFILLED')

      const { data: totalBackordersData } = await supabase
        .from('backorders')
        .select('count')

      const fulfillmentRate = (totalBackordersData?.[0]?.count ?? 0) > 0
        ? ((fulfilledBackorders?.[0]?.count ?? 0) / (totalBackordersData?.[0]?.count ?? 1)) * 100
        : 0

      setAnalytics({
        totalInvestment,
        potential_savings: Math.round(totalInvestment * 0.1), // Assumed 10% savings from bulk ordering
        urgent_items: urgentItems,
        departments_affected: affectedDepts.size,
        fulfillment_rate: Math.round(fulfillmentRate)
      })

      // Sort recommendations by priority and urgency
      recommendations.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        const typeWeight = { immediate: 3, planned: 2, monitor: 1 }

        const weightA = priorityWeight[a.priority] * 10 + typeWeight[a.type]
        const weightB = priorityWeight[b.priority] * 10 + typeWeight[b.type]

        return weightB - weightA
      })

      setRecommendations(recommendations)
    } catch (error) {
      console.error('Error loading procurement insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecommendations = recommendations.filter(rec =>
    activeFilter === 'all' || rec.type === activeFilter
  )

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'immediate': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'planned': return <Clock className="w-5 h-5 text-amber-600" />
      case 'monitor': return <Target className="w-5 h-5 text-blue-600" />
      default: return <Package className="w-5 h-5 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRecommendationStats = (type: string) => {
    const typeRecs = recommendations.filter(r => r.type === type)
    return {
      count: typeRecs.length,
      totalCost: typeRecs.reduce((sum, r) => sum + r.estimated_cost, 0)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">
                  ฿{analytics.totalInvestment.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {recommendations.length} items recommended
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Savings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ฿{analytics.potential_savings.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Through optimized ordering
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent Items</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.urgent_items}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Require immediate attention
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.departments_affected}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(analytics.fulfillment_rate)}% fulfillment rate
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveFilter('all')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          All ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveFilter('immediate')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeFilter === 'immediate'
              ? 'bg-white text-red-900 shadow-sm'
              : 'text-gray-600 hover:text-red-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Immediate ({getRecommendationStats('immediate').count})
        </button>
        <button
          onClick={() => setActiveFilter('planned')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeFilter === 'planned'
              ? 'bg-white text-amber-900 shadow-sm'
              : 'text-gray-600 hover:text-amber-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Planned ({getRecommendationStats('planned').count})
        </button>
        <button
          onClick={() => setActiveFilter('monitor')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeFilter === 'monitor'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-gray-600 hover:text-blue-900'
          }`}
        >
          <Target className="w-4 h-4" />
          Monitor ({getRecommendationStats('monitor').count})
        </button>
      </div>

      {/* Recommendations List */}
      {filteredRecommendations.length === 0 ? (
        <Card className="p-8 text-center bg-green-50 border-green-200">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-900 mb-2">No Procurement Actions Needed</h3>
          <p className="text-green-700 max-w-md mx-auto">
            All inventory levels are optimal. Continue monitoring for future requirements.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Procurement Recommendations
            </h3>
            <Button size="sm">
              <ShoppingCart className="w-4 h-4 mr-1" />
              Create Purchase Orders
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredRecommendations.map((rec) => (
              <Card
                key={rec.id}
                className={`p-4 border-l-4 hover:shadow-md transition-shadow ${
                  rec.priority === 'high' ? 'border-l-red-500 bg-red-50' :
                  rec.priority === 'medium' ? 'border-l-amber-500 bg-amber-50' :
                  'border-l-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getRecommendationIcon(rec.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {rec.item_code}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {rec.type}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-2">{rec.description}</p>

                      <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Recommendation:</p>
                        <p className="text-sm text-gray-600">{rec.rationale}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Impact:</strong> {rec.impact}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Current Stock</p>
                          <p className="font-semibold">{rec.current_stock} units</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Backorder</p>
                          <p className="font-semibold text-red-600">{rec.backorder_quantity} units</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Monthly Usage</p>
                          <p className="font-semibold">{rec.monthly_usage} units</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Suggested Order</p>
                          <p className="font-semibold text-green-600">{rec.suggested_quantity} units</p>
                        </div>
                      </div>

                      {rec.supplier_suggestion && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          💡 {rec.supplier_suggestion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      ฿{rec.estimated_cost.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">Estimated cost</div>
                    <Button size="sm" variant="outline" className="w-full">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Create PO
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}