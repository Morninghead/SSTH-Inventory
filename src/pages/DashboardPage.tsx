import { useState, useEffect } from 'react'
import { Package, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Activity, PieChart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n/I18nProvider'
import MainLayout from '../components/layout/MainLayout'
import Card from '../components/ui/Card'
import InventoryValueChart from '../components/charts/InventoryValueChart'
import CategoryDistributionChart from '../components/charts/CategoryDistributionChart'
import TransactionTrendChart from '../components/charts/TransactionTrendChart'
import { supabase } from '../lib/supabase'

interface DashboardStats {
  totalItems: number
  lowStockItems: number
  totalValue: number
  outOfStock: number
  recentTransactions: number
  topItems: Array<{
    item_id: string
    item_code: string
    description: string
    total_quantity: number
    category_name: string
  }>
  topDepartments: Array<{
    department_id: string
    department_name: string
    total_value: number
  }>
  topSavingItems: Array<{
    item_id: string
    item_code: string
    description: string
    previous_quantity: number
    current_quantity: number
    savings_quantity: number
    category_name: string
  }>
  topSavingDepartments: Array<{
    department_id: string
    department_name: string
    previous_value: number
    current_value: number
    savings_value: number
  }>
  // Chart data
  inventoryValueTrend: Array<{
    month: string
    value: number
  }>
  categoryDistribution: Array<{
    category: string
    value: number
    count: number
  }>
  transactionTrends: Array<{
    period: string
    issue: number
    receive: number
  }>
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { t, language } = useI18n()
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    outOfStock: 0,
    recentTransactions: 0,
    topItems: [],
    topDepartments: [],
    topSavingItems: [],
    topSavingDepartments: [],
    inventoryValueTrend: [],
    categoryDistribution: [],
    transactionTrends: [],
  })
  const [loading, setLoading] = useState(true)

  // Date filtering for Top 10 reports
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  // Get months array in the correct language
  const monthsArray = language === 'th'
    ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  useEffect(() => {
    loadDashboardStats()
  }, [selectedMonth, selectedYear, language])

  // Load chart data
  const loadChartData = async () => {
    // 1. Inventory Value Trend (using mock data for history as we don't store snapshots)
    const months = language === 'th'
      ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

    // Generate dates for the last 6 months for the Transaction Trends
    const today = new Date()
    const trendMonths: string[] = []
    const trendData: Record<string, { issue: number; receive: number }> = {}

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthName = d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { month: 'short' })
      trendMonths.push(monthName)
      trendData[monthName] = { issue: 0, receive: 0 }
    }

    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)

    // Fetch transaction history for trends (lightweight query)
    const { data: trendTransactions } = await supabase
      .from('transactions')
      .select('created_at, transaction_type')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    // Aggregate real transaction data
    trendTransactions?.forEach(tx => {
      if (!tx.created_at) return
      const date = new Date(tx.created_at)
      const monthName = date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { month: 'short' })

      if (trendData[monthName]) {
        if (tx.transaction_type === 'ISSUE') {
          trendData[monthName].issue += 1
        } else if (tx.transaction_type === 'RECEIVE') {
          trendData[monthName].receive += 1
        }
      }
    })

    const transactionData = trendMonths.map(month => ({
      period: month,
      issue: trendData[month].issue,
      receive: trendData[month].receive
    }))

    // Mock data for Inventory Value (as we don't have historical snapshots)
    const inventoryValueData = months.map(month => ({
      month,
      value: Math.floor(Math.random() * 1000000) + 500000
    }))

    // Category data is now calculated in loadDashboardStats, we return empty here or initial structure
    // but the main function overrides it. We'll leave the mock here as fallback/initial state
    const categoryData = [
      { category: 'Loading...', value: 0, count: 0 }
    ]

    return {
      inventoryValueTrend: inventoryValueData,
      categoryDistribution: categoryData,
      transactionTrends: transactionData
    }
  }

  const loadDashboardStats = async () => {
    try {
      setLoading(true)

      // Load chart data
      const chartData = await loadChartData()

      // Get all active items
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select(`
          item_id,
          item_code,
          description,
          unit_cost,
          reorder_level,
          categories (category_id, category_name)
        `)
        .eq('is_active', true)

      if (itemsError) throw itemsError

      // Get inventory status
      const itemIds = items?.map(item => item.item_id) || []
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_status')
        .select('item_id, quantity')
        .in('item_id', itemIds)

      if (inventoryError) {
        console.warn('Failed to fetch inventory status:', inventoryError)
      }

      // Calculate selected month dates for Top 10 reports
      const selectedMonthStart = new Date(selectedYear, selectedMonth, 1)
      const selectedMonthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)

      // Calculate previous month dates for comparison (for savings calculation)
      const previousMonthStart = new Date(selectedYear, selectedMonth - 1, 1)

      // Get all transactions with lines for analysis - Filter by date range to improve performance
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          transaction_id,
          transaction_type,
          department_id,
          created_at,
          departments (dept_name),
          transaction_lines (
            item_id,
            quantity,
            unit_cost,
            items!transaction_lines_item_id_fkey (item_code, description, categories (category_name))
          )
        `)
        .gte('created_at', previousMonthStart.toISOString())
        .lte('created_at', selectedMonthEnd.toISOString())
        .order('created_at', { ascending: false })

      if (transactionsError) {
        console.warn('Failed to fetch transactions:', transactionsError)
      }

      // Calculate basic stats
      const totalItems = items?.length || 0
      let lowStockCount = 0
      let outOfStockCount = 0
      let totalValue = 0

      // Create a map for faster O(1) lookups
      const inventoryMap = new Map(inventoryData?.map(inv => [inv.item_id, inv.quantity]) || [])

      // Calculate category statistics
      const categoryStats: Record<string, { value: number; count: number }> = {}

      items?.forEach((item: any) => {
        const quantity = inventoryMap.get(item.item_id) || 0
        const unitCost = item.unit_cost || 0
        const reorderLevel = item.reorder_level || 0

        totalValue += quantity * unitCost

        if (quantity === 0) {
          outOfStockCount++
        } else if (quantity <= reorderLevel && reorderLevel > 0) {
          lowStockCount++
        }

        // Calculate Category Distribution
        const categoryName = item.categories?.category_name || t('common.uncategorized')
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = { value: 0, count: 0 }
        }
        categoryStats[categoryName].value += quantity * unitCost
        categoryStats[categoryName].count += 1
      })

      // Format Category Distribution for Chart
      const realCategoryDistribution = Object.entries(categoryStats)
        .map(([category, stat]) => ({
          category,
          value: stat.value,
          count: stat.count
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      // Date ranges are already calculated above for the query
      // const selectedMonthStart = ... 
      // const selectedMonthEnd = ...
      // const previousMonthStart = ...
      const previousMonthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)

      // Calculate selected month item usage
      const itemUsageCount: { [key: string]: number } = {}
      transactions?.forEach((trans: any) => {
        const transDate = new Date(trans.created_at)
        if (trans.transaction_type === 'ISSUE' && transDate >= selectedMonthStart && transDate <= selectedMonthEnd && trans.transaction_lines) {
          trans.transaction_lines.forEach((line: any) => {
            const itemId = line.item_id
            if (itemId) {
              itemUsageCount[itemId] = (itemUsageCount[itemId] || 0) + (line.quantity || 0)
            }
          })
        }
      })

      // Calculate top 10 items by ISSUE quantity
      const topItems = Object.entries(itemUsageCount)
        .map(([itemId, totalQuantity]) => {
          const item = items?.find(i => i.item_id === itemId)
          return item ? {
            item_id: itemId,
            item_code: item.item_code,
            description: item.description,
            total_quantity: totalQuantity,
            category_name: (item as any).categories?.category_name || t('common.uncategorized')
          } : null
        })
        .filter(item => item !== null)
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 10)

      // Calculate selected month department values
      const departmentTransactionValue: { [key: string]: { totalValue: number; departmentName: string } } = {}
      transactions?.forEach((trans: any) => {
        const transDate = new Date(trans.created_at)
        if (transDate >= selectedMonthStart && transDate <= selectedMonthEnd && trans.department_id && trans.transaction_lines) {
          const deptId = trans.department_id
          const deptName = trans.departments?.dept_name || 'Unknown'

          if (!departmentTransactionValue[deptId]) {
            departmentTransactionValue[deptId] = { totalValue: 0, departmentName: deptName }
          }

          const transactionValue = trans.transaction_lines?.reduce((sum: number, line: any) => {
            const quantity = line.quantity || 0
            const unitCost = line.unit_cost || 0
            return sum + (quantity * unitCost)
          }, 0) || 0

          departmentTransactionValue[deptId].totalValue += transactionValue
        }
      })

      const topDepartments = Object.entries(departmentTransactionValue)
        .map(([deptId, data]) => ({
          department_id: deptId,
          department_name: data.departmentName,
          total_value: data.totalValue
        }))
        .filter(dept => dept.total_value > 0)
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 10)

      // Calculate previous month item usage
      const previousMonthItemUsage: { [key: string]: number } = {}
      transactions?.forEach((trans: any) => {
        const transDate = new Date(trans.created_at)
        if (trans.transaction_type === 'ISSUE' && transDate >= previousMonthStart && transDate <= previousMonthEnd && trans.transaction_lines) {
          trans.transaction_lines.forEach((line: any) => {
            const itemId = line.item_id
            if (itemId) {
              previousMonthItemUsage[itemId] = (previousMonthItemUsage[itemId] || 0) + (line.quantity || 0)
            }
          })
        }
      })

      // Calculate top saving items (decreased usage)
      const savingItems = Object.entries(itemUsageCount)
        .map(([itemId, currentQuantity]) => {
          const previousQuantity = previousMonthItemUsage[itemId] || 0
          const savingsQuantity = previousQuantity - currentQuantity
          const item = items?.find(i => i.item_id === itemId)

          if (item && savingsQuantity > 0) {
            return {
              item_id: itemId,
              item_code: item.item_code,
              description: item.description,
              previous_quantity: previousQuantity,
              current_quantity: currentQuantity,
              savings_quantity: savingsQuantity,
              category_name: (item as any).categories?.category_name || t('common.uncategorized')
            }
          }
          return null
        })
        .filter(item => item !== null)
        .sort((a, b) => b.savings_quantity - a.savings_quantity)
        .slice(0, 10)

      // Calculate previous month department values
      const previousMonthDepartmentValue: { [key: string]: { totalValue: number; departmentName: string } } = {}
      transactions?.forEach((trans: any) => {
        const transDate = new Date(trans.created_at)
        if (transDate >= previousMonthStart && transDate <= previousMonthEnd && trans.department_id && trans.transaction_lines) {
          const deptId = trans.department_id
          const deptName = trans.departments?.dept_name || 'Unknown'

          if (!previousMonthDepartmentValue[deptId]) {
            previousMonthDepartmentValue[deptId] = { totalValue: 0, departmentName: deptName }
          }

          const transactionValue = trans.transaction_lines?.reduce((sum: number, line: any) => {
            const quantity = line.quantity || 0
            const unitCost = line.unit_cost || 0
            return sum + (quantity * unitCost)
          }, 0) || 0

          previousMonthDepartmentValue[deptId].totalValue += transactionValue
        }
      })

      // Calculate top saving departments (decreased spending)
      const savingDepartments = Object.entries(departmentTransactionValue)
        .map(([deptId, data]) => {
          const previousValue = previousMonthDepartmentValue[deptId]?.totalValue || 0
          const currentValue = data.totalValue
          const savingsValue = previousValue - currentValue

          if (savingsValue > 0) {
            return {
              department_id: deptId,
              department_name: data.departmentName,
              previous_value: previousValue,
              current_value: currentValue,
              savings_value: savingsValue
            }
          }
          return null
        })
        .filter(dept => dept !== null)
        .sort((a, b) => b.savings_value - a.savings_value)
        .slice(0, 10)

      // Count recent transactions (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentTransactionCount = transactions?.filter(
        t => t.created_at && new Date(t.created_at) >= sevenDaysAgo
      ).length || 0

      setStats({
        totalItems,
        lowStockItems: lowStockCount,
        totalValue,
        outOfStock: outOfStockCount,
        recentTransactions: recentTransactionCount,
        topItems,
        topDepartments,
        topSavingItems: savingItems,
        topSavingDepartments: savingDepartments,
        inventoryValueTrend: chartData.inventoryValueTrend,
        categoryDistribution: realCategoryDistribution,
        transactionTrends: chartData.transactionTrends,
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            {t('auth.welcomeBack')}, {profile?.full_name || t('auth.email')}
          </p>
        </div>

        {/* Main KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalItems')}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalItems.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">{t('dashboard.activeInventory')}</p>
              </div>
              <div className="ml-4 p-3 bg-blue-100 rounded-lg">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalValue')}</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  ฿{loading ? '...' : stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-gray-500">{t('dashboard.inventoryWorth')}</p>
              </div>
              <div className="ml-4 p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{t('dashboard.lowStock')}</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {loading ? '...' : stats.lowStockItems.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">{t('dashboard.needsReorder')}</p>
              </div>
              <div className="ml-4 p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{t('dashboard.outOfStock')}</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {loading ? '...' : stats.outOfStock.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">{t('dashboard.criticalItems')}</p>
              </div>
              <div className="ml-4 p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Date Selector for Top 10 Reports */}
        <Card className="bg-white border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">{t('dashboard.selectMonth')}:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {monthsArray.map((monthName, index) => (
                  <option key={index} value={index}>{monthName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">{t('dashboard.selectYear')}:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {t('dashboard.showingDataFor')} {new Date(selectedYear, selectedMonth).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </Card>

        {/* 4 Column Grid for Top Items, Departments, and Savings */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Top 10 Items by Usage */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.topItems')}</h2>
                <p className="text-sm text-gray-600">{t('dashboard.mostUsedByQuantity')}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard.loading')}</div>
              ) : stats.topItems.length > 0 ? (
                stats.topItems.map((item, index) => (
                  <div
                    key={item.item_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index < 3
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${index === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : index === 1
                            ? 'bg-gray-400 text-gray-900'
                            : index === 2
                              ? 'bg-orange-400 text-orange-900'
                              : 'bg-gray-300 text-gray-700'
                          }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {item.item_code} • {item.category_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-gray-900">
                        {item.total_quantity.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{t('dashboard.units')}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>{t('dashboard.noUsageData')}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Top 10 Departments by Value */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.topDepartments')}</h2>
                <p className="text-sm text-gray-600">{t('dashboard.mostUsedByValue')}</p>
              </div>
              <Activity className="w-6 h-6 text-purple-500" />
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard.loading')}</div>
              ) : stats.topDepartments.length > 0 ? (
                stats.topDepartments.map((dept, index) => (
                  <div
                    key={dept.department_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index === 0
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                      : index === 1
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                        : index === 2
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${index === 0
                          ? 'bg-purple-500 text-white'
                          : index === 1
                            ? 'bg-blue-500 text-white'
                            : index === 2
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {dept.department_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-gray-900">
                        ฿{dept.total_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-gray-600">{t('dashboard.transactionValue')}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>{t('dashboard.noDepartmentData')}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Top 10 Most Saving Items */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.topSavingItems')}</h2>
                <p className="text-sm text-gray-600">{t('dashboard.decreasedUsageQuantity')}</p>
              </div>
              <TrendingDown className="w-6 h-6 text-green-500" />
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard.loading')}</div>
              ) : stats.topSavingItems.length > 0 ? (
                stats.topSavingItems.map((item, index) => (
                  <div
                    key={item.item_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index < 3
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${index === 0
                          ? 'bg-green-500 text-white'
                          : index === 1
                            ? 'bg-teal-500 text-white'
                            : index === 2
                              ? 'bg-lime-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {item.previous_quantity} → {item.current_quantity} units
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-green-600">
                        ↓ {item.savings_quantity.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{t('dashboard.saved')}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>{t('dashboard.noSavingsData')}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Top 10 Departments Helping Save Cost */}
          <Card className="bg-white border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.topSavingDepartments')}</h2>
                <p className="text-sm text-gray-600">{t('dashboard.reducedSpending')}</p>
              </div>
              <TrendingDown className="w-6 h-6 text-green-500" />
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard.loading')}</div>
              ) : stats.topSavingDepartments.length > 0 ? (
                stats.topSavingDepartments.map((dept, index) => (
                  <div
                    key={dept.department_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index === 0
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : index === 1
                        ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200'
                        : index === 2
                          ? 'bg-gradient-to-r from-lime-50 to-green-50 border-lime-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${index === 0
                          ? 'bg-green-500 text-white'
                          : index === 1
                            ? 'bg-teal-500 text-white'
                            : index === 2
                              ? 'bg-lime-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {dept.department_name}
                        </div>
                        <div className="text-xs text-gray-600">
                          ฿{dept.previous_value.toLocaleString()} → ฿{dept.current_value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-green-600">
                        ↓ ฿{dept.savings_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-gray-500">{t('dashboard.saved')}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>{t('dashboard.noSavingsData')}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Inventory Value Trend
              </h3>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <InventoryValueChart data={stats.inventoryValueTrend} />
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-600" />
                Category Distribution
              </h3>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <CategoryDistributionChart data={stats.categoryDistribution} />
              )}
            </div>
          </Card>
        </div>

        {/* Transaction Trends Chart */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Transaction Trends
            </h3>
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <TransactionTrendChart data={stats.transactionTrends} />
            )}
          </div>
        </Card>

        {/* Alerts Section */}
        {(stats.outOfStock > 0 || stats.lowStockItems > 0) && (
          <Card className="border-l-4 border-l-red-500 bg-red-50 border-red-200">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">{t('dashboard.inventoryAlerts')}</h3>
                <div className="mt-2 text-sm text-red-700">
                  {stats.outOfStock > 0 && (
                    <p>• {stats.outOfStock} {t('dashboard.itemsOutOfStock')}</p>
                  )}
                  {stats.lowStockItems > 0 && (
                    <p>• {stats.lowStockItems} {t('dashboard.itemsBelowReorder')}</p>
                  )}
                </div>
                <div className="mt-3">
                  <a
                    href="/inventory"
                    className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    {t('dashboard.viewInventoryDetails')} →
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
