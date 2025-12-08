import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)
import { Calendar, TrendingUp, Download, Users, Package, Activity, BarChart3, Filter as FilterIcon } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { supabase } from '../../lib/supabase'
import {
  exportToCSV,
  formatCurrency,
  getDateRangePreset,
  groupBy,
  calculatePercentageChange,
  type DepartmentUsageData
} from '../../utils/reportUtils'

interface DepartmentMonthlyData {
  department_name: string
  month: string
  total_quantity: number
  total_value: number
  item_count: number
  transaction_count: number
}

interface DepartmentWeeklyData {
  department_name: string
  week_start: string
  week_end: string
  total_quantity: number
  total_value: number
  item_count: number
}

interface ForecastData {
  department_name: string
  current_month_quantity: number
  next_month_forecast: number
  confidence_score: number
  trend_percentage: number
}

interface TimeRangeData {
  period: string
  [key: string]: any // Dynamic department values
}

export default function DepartmentWithdrawalReport() {
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly' | 'weekly'>('monthly')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  // Enhanced filtering options
  const [chartFilterMode, setChartFilterMode] = useState<'total' | 'items'>('total')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [chartMetric, setChartMetric] = useState<'quantity' | 'value'>('quantity')
  const [comparisonMonths] = useState<string[]>([])
  const [availableItems, setAvailableItems] = useState<any[]>([])

  // Data states
  const [monthlyData, setMonthlyData] = useState<DepartmentMonthlyData[]>([])
  const [weeklyData, setWeeklyData] = useState<DepartmentWeeklyData[]>([])
  const [yearlyData, setYearlyData] = useState<DepartmentUsageData[]>([])
  const [forecastData, setForecastData] = useState<ForecastData[]>([])
  const [chartData, setChartData] = useState<TimeRangeData[]>([])

  useEffect(() => {
    loadDepartments()
    loadAvailableItems()
    // Default to last 6 months for monthly view
    const { startDate: start, endDate: end } = getDateRangePreset('month')
    setStartDate(start)
    setEndDate(end)
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadData()
    }
  }, [startDate, endDate, selectedDepartment, viewMode, selectedYear, chartFilterMode, selectedItems, chartMetric, comparisonMonths])

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('dept_name')

      if (error) {
        console.error('Error loading departments:', error)
        setDepartments([])
        return
      }

            setDepartments(data || [])
    } catch (err) {
      console.error('Unexpected error loading departments:', err)
      setDepartments([])
    }
  }

  const loadAvailableItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('item_id, item_code, description')
      .eq('is_active', true)
      .order('item_code')
      .limit(50) // Limit to top 50 most relevant items
    setAvailableItems(data || [])
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (viewMode === 'monthly') {
        await loadMonthlyData()
      } else if (viewMode === 'weekly') {
        await loadWeeklyData()
      } else if (viewMode === 'yearly') {
        await loadYearlyData()
      }
      await loadForecastData()
    } catch (error) {
      console.error('Error loading department withdrawal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMonthlyData = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          transaction_date,
          department:departments(dept_name),
          transaction_lines(
            quantity,
            unit_cost,
            line_total
          )
        `)
        .eq('transaction_type', 'ISSUE')
        .gte('transaction_date', new Date(startDate).toISOString())
        .lte('transaction_date', new Date(endDate + 'T23:59:59').toISOString())
        .order('transaction_date', { ascending: true })

      if (error) {
        console.error('Error loading monthly transactions:', error)
        throw error
      }

      
      // Process monthly data
      const monthlyMap = new Map<string, DepartmentMonthlyData>()

    ;(transactions as any[]).forEach(tx => {
      const deptName = (tx.department as any)?.dept_name || 'Unknown'
      const monthKey = new Date(tx.transaction_date).toISOString().slice(0, 7) // YYYY-MM

      tx.transaction_lines?.forEach((line: any) => {
        const key = `${deptName}-${monthKey}`
        const existing = monthlyMap.get(key) || {
          department_name: deptName,
          month: monthKey,
          total_quantity: 0,
          total_value: 0,
          item_count: 0,
          transaction_count: 0
        }

        existing.total_quantity += line.quantity
        existing.total_value += line.line_total || 0
        existing.transaction_count += 1

        monthlyMap.set(key, existing)
      })
    })

    const monthly = Array.from(monthlyMap.values())

    // Calculate unique item count per department per month
    const { data: uniqueItems } = await supabase
      .from('transactions')
      .select(`
        transaction_date,
        department_id,
        transaction_lines(item_id)
      `)
      .eq('transaction_type', 'ISSUE')
      .gte('transaction_date', new Date(startDate).toISOString())
      .lte('transaction_date', new Date(endDate + 'T23:59:59').toISOString())

    // Update item counts
    monthly.forEach(month => {
      const deptTrans = uniqueItems?.filter((tx: any) => {
        const txMonth = new Date(tx.transaction_date).toISOString().slice(0, 7)
        const dept = departments.find(d => d.dept_name === month.department_name)
        return txMonth === month.month && tx.department_id === dept?.dept_id
      }) || []

      const itemIds = new Set()
      deptTrans.forEach((tx: any) => {
        tx.transaction_lines?.forEach((line: any) => {
          if (line.item_id) itemIds.add(line.item_id)
        })
      })
      month.item_count = itemIds.size
    })

    setMonthlyData(monthly)
    await prepareChartData(monthly, 'monthly')
    } catch (error) {
      console.error('Error in loadMonthlyData:', error)
      setMonthlyData([])
      setChartData([])
    }
  }

  const loadWeeklyData = async () => {
    // Calculate date ranges for the last 12 weeks
    const weeks = []
    const currentDate = new Date(endDate)

    for (let i = 0; i < 12; i++) {
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(currentDate.getDate() - (i * 7))

      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 6)

      weeks.push({
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0]
      })
    }

    const weekly: DepartmentWeeklyData[] = []

    for (const week of weeks.reverse()) {
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          department:departments(dept_name),
          transaction_lines(quantity, line_total)
        `)
        .eq('transaction_type', 'ISSUE')
        .gte('transaction_date', new Date(week.week_start).toISOString())
        .lte('transaction_date', new Date(week.week_end + 'T23:59:59').toISOString())

      const deptMap = new Map<string, DepartmentWeeklyData>()

      ;(transactions as any[]).forEach(tx => {
        const deptName = (tx.department as any)?.dept_name || 'Unknown'

        const existing = deptMap.get(deptName) || {
          department_name: deptName,
          week_start: week.week_start,
          week_end: week.week_end,
          total_quantity: 0,
          total_value: 0,
          item_count: 0
        }

        tx.transaction_lines?.forEach((line: any) => {
          existing.total_quantity += line.quantity
          existing.total_value += line.line_total || 0
        })

        deptMap.set(deptName, existing)
      })

      weekly.push(...Array.from(deptMap.values()))
    }

    setWeeklyData(weekly)
    await prepareChartData(weekly, 'weekly')
  }

  const loadYearlyData = async () => {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        transaction_date,
        department:departments(dept_name),
        transaction_lines(
          quantity,
          line_total
        )
      `)
      .eq('transaction_type', 'ISSUE')
      .gte('transaction_date', `${selectedYear}-01-01`)
      .lte('transaction_date', `${selectedYear}-12-31`)
      .order('transaction_date', { ascending: true })

    if (error) throw error

    const deptMap = new Map<string, DepartmentUsageData>()

    ;(transactions as any[]).forEach(tx => {
      const deptName = (tx.department as any)?.dept_name || 'Unknown'

      const existing = deptMap.get(deptName) || {
        department_name: deptName,
        total_issues: 0,
        total_value: 0,
        item_count: 0
      }

      tx.transaction_lines?.forEach((line: any) => {
        existing.total_issues += line.quantity
        existing.total_value += line.line_total || 0
      })

      deptMap.set(deptName, existing)
    })

    const yearly = Array.from(deptMap.values())
    setYearlyData(yearly)
    await prepareChartData(yearly, 'yearly')
  }

  const loadForecastData = async () => {
    // Simple forecasting based on historical trends
    const { data: historicalData } = await supabase
      .from('transactions')
      .select(`
        transaction_date,
        department:departments(dept_name),
        transaction_lines(quantity)
      `)
      .eq('transaction_type', 'ISSUE')
      .gte('transaction_date', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
      .order('transaction_date', { ascending: true })

    const deptForecastMap = new Map<string, ForecastData>()

    if (historicalData) {
      // Group by department and calculate trends
      const deptMonthlyData = groupBy(historicalData, 'department')

      Object.entries(deptMonthlyData).forEach(([deptName, txs]) => {
        const monthlyQuantities = new Map<string, number>()

        txs.forEach((tx: any) => {
          const month = new Date(tx.transaction_date).toISOString().slice(0, 7)
          const quantity = tx.transaction_lines?.reduce((sum: number, line: any) => sum + line.quantity, 0) || 0
          monthlyQuantities.set(month, (monthlyQuantities.get(month) || 0) + quantity)
        })

        const months = Array.from(monthlyQuantities.keys()).sort()
        const quantities = months.map(month => monthlyQuantities.get(month) || 0)

        if (quantities.length >= 2) {
          const recentMonths = quantities.slice(-3)
          const olderMonths = quantities.slice(-6, -3)

          const recentAvg = recentMonths.reduce((a, b) => a + b, 0) / recentMonths.length
          const olderAvg = olderMonths.length > 0 ? olderMonths.reduce((a, b) => a + b, 0) / olderMonths.length : recentAvg

          const trend = calculatePercentageChange(recentAvg, olderAvg)
          const forecast = Math.round(recentAvg * (1 + trend / 100))

          const confidence = Math.min(95, Math.max(50, 100 - (quantities.length * 5))) // Simple confidence calculation

          deptForecastMap.set(deptName, {
            department_name: deptName,
            current_month_quantity: recentMonths[recentMonths.length - 1] || 0,
            next_month_forecast: Math.max(0, forecast),
            confidence_score: confidence,
            trend_percentage: Math.round(trend)
          })
        }
      })
    }

    setForecastData(Array.from(deptForecastMap.values()))
  }

  const prepareChartData = async (data: any[], mode: 'monthly' | 'weekly' | 'yearly') => {
    if (chartFilterMode === 'total') {
      await prepareTotalUsageChart(data, mode)
    } else if (chartFilterMode === 'items') {
      await prepareItemUsageChart(data, mode)
    }
  }

  const prepareTotalUsageChart = async (data: any[], mode: 'monthly' | 'weekly' | 'yearly') => {
    const chartMap = new Map<string, any>()

    data.forEach(item => {
      let periodKey: string

      if (mode === 'monthly') {
        periodKey = new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      } else if (mode === 'weekly') {
        periodKey = `${new Date(item.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(item.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      } else {
        periodKey = item.department_name
      }

      if (!chartMap.has(periodKey)) {
        chartMap.set(periodKey, { period: periodKey })
      }

      const periodData = chartMap.get(periodKey)
      const deptKey = item.department_name

      // Use selected metric (quantity or value)
      const value = chartMetric === 'quantity'
        ? item.total_quantity || item.total_issues || 0
        : item.total_value || 0

      periodData[deptKey] = (periodData[deptKey] || 0) + value
    })

    setChartData(Array.from(chartMap.values()))
  }

  const prepareItemUsageChart = async (_data: any[], mode: 'monthly' | 'weekly' | 'yearly') => {
    if (selectedItems.length === 0) {
      setChartData([])
      return
    }

    // Get item-level transaction data for selected items
    const { data: itemTransactions, error } = await supabase
      .from('transactions')
      .select(`
        transaction_date,
        department:departments(dept_name),
        transaction_lines(
          quantity,
          unit_cost,
          line_total,
          item:items(item_code, description)
        )
      `)
      .eq('transaction_type', 'ISSUE')
      .gte('transaction_date', new Date(startDate).toISOString())
      .lte('transaction_date', new Date(endDate + 'T23:59:59').toISOString())
      .in('transaction_lines.item_id', selectedItems)
      .order('transaction_date', { ascending: true })

    if (error) {
      console.error('Error loading item transactions:', error)
      return
    }

    const chartMap = new Map<string, any>()

    ;(itemTransactions as any[]).forEach(tx => {
      const deptName = (tx.department as any)?.dept_name || 'Unknown'

      tx.transaction_lines?.forEach((line: any) => {
        const itemCode = line.item?.item_code || 'Unknown'
        const itemName = line.item?.description || 'Unknown'

        let periodKey: string

        if (mode === 'monthly') {
          periodKey = new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        } else if (mode === 'weekly') {
          const weekStart = new Date(tx.transaction_date)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          periodKey = `Week ${Math.ceil(weekStart.getDate() / 7)}`
        } else {
          periodKey = deptName
        }

        if (!chartMap.has(periodKey)) {
          chartMap.set(periodKey, { period: periodKey })
        }

        const periodData = chartMap.get(periodKey)
        const itemKey = `${itemCode} - ${itemName.substring(0, 20)}${itemName.length > 20 ? '...' : ''}`

        const value = chartMetric === 'quantity' ? line.quantity : line.line_total || 0
        periodData[itemKey] = (periodData[itemKey] || 0) + value
      })
    })

    setChartData(Array.from(chartMap.values()))
  }

  const exportMonthlyData = () => {
    const exportData = monthlyData.map(item => ({
      Department: item.department_name,
      Month: item.month,
      'Total Quantity': item.total_quantity,
      'Total Value': formatCurrency(item.total_value),
      'Unique Items': item.item_count,
      'Transaction Count': item.transaction_count
    }))
    exportToCSV(exportData, `department-monthly-withdrawals-${startDate}-to-${endDate}`)
  }

  const exportForecastData = () => {
    const exportData = forecastData.map(item => ({
      Department: item.department_name,
      'Current Month Quantity': item.current_month_quantity,
      'Next Month Forecast': item.next_month_forecast,
      'Trend %': item.trend_percentage,
      'Confidence Score': `${item.confidence_score}%`
    }))
    exportToCSV(exportData, `department-forecast-${new Date().toISOString().split('T')[0]}`)
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (trend < 0) return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
    return <Activity className="w-4 h-4 text-gray-600" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const filteredForecastData = selectedDepartment
    ? forecastData.filter(item => item.department_name === selectedDepartment)
    : forecastData

  return (
    <div className="space-y-6">
      {/* Header with View Mode Selection */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Department Withdrawal Analytics</h2>
            <p className="text-gray-600 mt-1">Track item withdrawals by department with forecasting and detailed filtering</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'weekly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewMode('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'yearly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Chart Filters */}
        <Card>
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-semibold">Chart Filtering Options</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filter Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FilterIcon className="w-4 h-4 inline mr-1" />
                Filter Mode
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartFilterMode('total')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    chartFilterMode === 'total'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Total Usage
                </button>
                <button
                  onClick={() => setChartFilterMode('items')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    chartFilterMode === 'items'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  By Items
                </button>
              </div>
            </div>

            {/* Metric Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Activity className="w-4 h-4 inline mr-1" />
                Display Metric
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartMetric('quantity')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    chartMetric === 'quantity'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Quantity
                </button>
                <button
                  onClick={() => setChartMetric('value')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    chartMetric === 'value'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Value
                </button>
              </div>
            </div>

            {/* Item Selection (visible only in items mode) */}
            {chartFilterMode === 'items' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Select Items
                </label>
                <select
                  multiple
                  value={selectedItems}
                  onChange={(e) => setSelectedItems(Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  size={3}
                >
                  {availableItems.map(item => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.item_code} - {item.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple items</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={viewMode === 'yearly'}
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
              disabled={viewMode === 'yearly'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.dept_id} value={dept.dept_name}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
          </div>

          {viewMode === 'yearly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[2024, 2023, 2022, 2021].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick Date Presets */}
        {viewMode !== 'yearly' && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => {
              const { startDate: start, endDate: end } = getDateRangePreset('week')
              setStartDate(start)
              setEndDate(end)
            }}>
              Last 7 Days
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {
              const { startDate: start, endDate: end } = getDateRangePreset('month')
              setStartDate(start)
              setEndDate(end)
            }}>
              Last 30 Days
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {
              const { startDate: start, endDate: end } = getDateRangePreset('quarter')
              setStartDate(start)
              setEndDate(end)
            }}>
              Last 90 Days
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {
              const { startDate: start, endDate: end } = getDateRangePreset('year')
              setStartDate(start)
              setEndDate(end)
            }}>
              Last Year
            </Button>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading department analytics...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Departments Found</h3>
          <p className="text-gray-500 mb-4">Unable to load departments. Please check your database connection.</p>
        </div>
      ) : (
        <>
          {/* No Data Message */}
          {chartData.length === 0 && (chartFilterMode === 'total' || selectedItems.length > 0) && (
            <Card>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Transaction Data Found</h3>
                <p className="text-gray-500">
                  {chartFilterMode === 'total'
                    ? 'No ISSUE transactions found in the selected date range. Try expanding the date range or creating some test transactions.'
                    : 'No transactions found for the selected items in the date range. Try selecting different items or expanding the date range.'
                  }
                </p>
              </div>
            </Card>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {chartFilterMode === 'total'
                    ? `Withdrawal Trends by Department (${chartMetric === 'quantity' ? 'Quantity' : 'Value'})`
                    : `Item Usage Trends (${chartMetric === 'quantity' ? 'Quantity' : 'Value'})`
                  }
                </h3>
                <div className="text-sm text-gray-500">
                  {viewMode === 'monthly' ? 'Monthly View' : viewMode === 'weekly' ? 'Weekly View' : 'Yearly View'}
                </div>
              </div>

              {chartFilterMode === 'items' && selectedItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>Please select one or more items to display the chart</p>
                </div>
              ) : (
                <div className="h-96">
                  <Line
                    data={{
                      labels: chartData.map(item => item.period),
                      datasets: chartFilterMode === 'total'
                        ? departments.map((dept, index) => {
                            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#A855F7', '#10B981']
                            return {
                              label: dept.dept_name,
                              data: chartData.map(item => item[dept.dept_name] || 0),
                              borderColor: colors[index % colors.length],
                              backgroundColor: colors[index % colors.length] + '20',
                              borderWidth: 2,
                              tension: 0.1,
                              pointRadius: 3,
                              pointHoverRadius: 5
                            }
                          })
                        : availableItems
                            .filter(item => selectedItems.includes(item.item_id))
                            .slice(0, 5)
                            .map((item, index) => {
                              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']
                              const itemLabel = `${item.item_code} - ${item.description.substring(0, 15)}${item.description.length > 15 ? '...' : ''}`
                              return {
                                label: itemLabel,
                                data: chartData.map(chartItem => chartItem[itemLabel] || 0),
                                borderColor: colors[index % colors.length],
                                backgroundColor: colors[index % colors.length] + '20',
                                borderWidth: 2,
                                tension: 0.1,
                                pointRadius: 3,
                                pointHoverRadius: 5
                              }
                            })
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 15
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.dataset.label || ''
                              const value = context.parsed.y ?? 0
                              return [
                                `${label}: ${chartMetric === 'value' ? formatCurrency(value) : value.toLocaleString()}`,
                                chartMetric === 'value' ? 'Value' : 'Quantity'
                              ]
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            maxRotation: viewMode === 'weekly' ? 45 : 0,
                            minRotation: viewMode === 'weekly' ? 45 : 0,
                            autoSkip: true,
                            maxTicksLimit: 12
                          }
                        },
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return chartMetric === 'value'
                                ? `฿${value.toLocaleString()}`
                                : value.toLocaleString()
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}

              {/* Chart Summary */}
              {chartData.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-700">Data Points</div>
                    <div className="text-lg font-bold text-gray-900">{chartData.length}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-700">Metric Type</div>
                    <div className="text-lg font-bold text-gray-900 capitalize">{chartMetric}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-700">Filter Mode</div>
                    <div className="text-lg font-bold text-gray-900 capitalize">{chartFilterMode}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-700">Selected {chartFilterMode === 'items' ? 'Items' : 'Departments'}</div>
                    <div className="text-lg font-bold text-gray-900">
                      {chartFilterMode === 'items' ? selectedItems.length : selectedDepartment || 'All'}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Forecast Section */}
          {filteredForecastData.length > 0 && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Usage Forecasting</h3>
                <Button onClick={exportForecastData} variant="secondary" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Forecast
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredForecastData.map((forecast, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{forecast.department_name}</h4>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(forecast.trend_percentage)}
                        <span className={`text-sm font-medium ${getTrendColor(forecast.trend_percentage)}`}>
                          {forecast.trend_percentage > 0 ? '+' : ''}{forecast.trend_percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Month:</span>
                        <span className="font-medium">{forecast.current_month_quantity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Next Month Forecast:</span>
                        <span className="font-medium text-blue-600">{forecast.next_month_forecast}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Confidence:</span>
                        <span className={`font-medium ${
                          forecast.confidence_score >= 80 ? 'text-green-600' :
                          forecast.confidence_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {forecast.confidence_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Data Table */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {viewMode === 'monthly' ? 'Monthly' : viewMode === 'weekly' ? 'Weekly' : 'Yearly'} Withdrawal Details
              </h3>
              {viewMode === 'monthly' && (
                <Button onClick={exportMonthlyData} variant="secondary" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Users className="w-4 h-4 inline mr-1" />
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {viewMode === 'monthly' ? 'Month' : viewMode === 'weekly' ? 'Week' : 'Year'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      <Package className="w-4 h-4 inline mr-1" />
                      Total Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unique Items</th>
                    {viewMode === 'monthly' && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(viewMode === 'monthly' ? monthlyData : viewMode === 'weekly' ? weeklyData : yearlyData)
                    .filter(item => !selectedDepartment || item.department_name === selectedDepartment)
                    .map((item: any, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.department_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {viewMode === 'monthly' ? (
                          new Date(item.month + '-01').toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })
                        ) : viewMode === 'weekly' ? (
                          `${new Date(item.week_start).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })} - ${new Date(item.week_end).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}`
                        ) : (
                          selectedYear
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {(item.total_quantity || item.total_issues || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(item.total_value || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {item.item_count}
                      </td>
                      {viewMode === 'monthly' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {item.transaction_count}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}