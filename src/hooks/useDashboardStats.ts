import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n/I18nProvider'

// ── Types ──────────────────────────────────────────

export interface TopItem {
    item_id: string
    item_code: string
    description: string
    total_quantity: number
    category_name: string
}

export interface TopDepartment {
    department_id: string
    department_name: string
    total_value: number
}

export interface SavingItem {
    item_id: string
    item_code: string
    description: string
    previous_quantity: number
    current_quantity: number
    savings_quantity: number
    category_name: string
}

export interface SavingDepartment {
    department_id: string
    department_name: string
    previous_value: number
    current_value: number
    savings_value: number
}

export interface InventoryValuePoint {
    month: string
    value: number
}

export interface CategoryDistPoint {
    category: string
    value: number
    count: number
}

export interface TransactionTrendPoint {
    period: string
    issue: number
    receive: number
}

export interface DashboardStats {
    totalItems: number
    lowStockItems: number
    totalValue: number
    outOfStock: number
    recentTransactions: number
    topItems: TopItem[]
    topDepartments: TopDepartment[]
    topSavingItems: SavingItem[]
    topSavingDepartments: SavingDepartment[]
    inventoryValueTrend: InventoryValuePoint[]
    categoryDistribution: CategoryDistPoint[]
    transactionTrends: TransactionTrendPoint[]
}

const INITIAL_STATS: DashboardStats = {
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
}

// ── Hook ───────────────────────────────────────────

export function useDashboardStats(selectedMonth: number, selectedYear: number) {
    const { t, language } = useI18n()
    const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS)
    const [loading, setLoading] = useState(true)

    // ── Chart Data (Real) ────────────────────────────

    const loadChartData = useCallback(async () => {
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

        // Fetch real transaction data for trends
        const { data: trendTransactions } = await supabase
            .from('transactions')
            .select('created_at, transaction_type')
            .gte('created_at', sixMonthsAgo.toISOString())
            .order('created_at', { ascending: true })

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

        const transactionTrends = trendMonths.map(month => ({
            period: month,
            issue: trendData[month].issue,
            receive: trendData[month].receive,
        }))

        return { transactionTrends }
    }, [language])

    // ── Inventory Value Trend (Real Data) ────────────

    const loadInventoryValueTrend = useCallback(async (currentTotalValue: number): Promise<InventoryValuePoint[]> => {
        // Build real trend from transaction history over last 6 months
        const today = new Date()
        const months: InventoryValuePoint[] = []

        // Fetch all transactions in the last 6 months to compute historical value deltas
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
        const { data: transactions } = await supabase
            .from('transactions')
            .select('created_at, transaction_type, transaction_lines(quantity, unit_cost)')
            .gte('created_at', sixMonthsAgo.toISOString())
            .order('created_at', { ascending: true })

        // Calculate net value change per month
        const monthlyDeltas: Record<string, number> = {}
        transactions?.forEach((tx: any) => {
            if (!tx.created_at) return
            const date = new Date(tx.created_at)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

            if (!monthlyDeltas[key]) monthlyDeltas[key] = 0

            tx.transaction_lines?.forEach((line: any) => {
                const lineValue = (line.quantity || 0) * (line.unit_cost || 0)
                if (tx.transaction_type === 'RECEIVE') {
                    monthlyDeltas[key] += lineValue
                } else if (tx.transaction_type === 'ISSUE') {
                    monthlyDeltas[key] -= lineValue
                }
            })
        })

        // Work backwards from current value to compute historical values
        const monthKeys: string[] = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
            monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
        }

        // Reverse-calculate: subtract future deltas from current value
        let value = currentTotalValue
        const valueByMonth: Record<string, number> = {}
        for (let i = monthKeys.length - 1; i >= 0; i--) {
            valueByMonth[monthKeys[i]] = Math.max(0, value)
            if (i > 0) {
                value -= (monthlyDeltas[monthKeys[i]] || 0)
            }
        }

        // Build the trend array
        for (const key of monthKeys) {
            const [yearStr, monthStr] = key.split('-')
            const d = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1)
            const label = d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { month: 'short' })
            months.push({ month: label, value: Math.round(valueByMonth[key]) })
        }

        return months
    }, [language])

    // ── Main Load Function ───────────────────────────

    const loadDashboardStats = useCallback(async () => {
        try {
            setLoading(true)

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
            const { data: inventoryData } = await supabase
                .from('inventory_status')
                .select('item_id, quantity')
                .in('item_id', itemIds)

            // Calculate selected month dates
            const selectedMonthStart = new Date(selectedYear, selectedMonth, 1)
            const selectedMonthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)
            const previousMonthStart = new Date(selectedYear, selectedMonth - 1, 1)

            // Get transactions for analysis
            const { data: transactions } = await supabase
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

            // Calculate basic stats
            const totalItems = items?.length || 0
            let lowStockCount = 0
            let outOfStockCount = 0
            let totalValue = 0

            const inventoryMap = new Map(inventoryData?.map(inv => [inv.item_id, inv.quantity]) || [])
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

                const categoryName = item.categories?.category_name || t('common.uncategorized')
                if (!categoryStats[categoryName]) {
                    categoryStats[categoryName] = { value: 0, count: 0 }
                }
                categoryStats[categoryName].value += quantity * unitCost
                categoryStats[categoryName].count += 1
            })

            // Category distribution
            const categoryDistribution = Object.entries(categoryStats)
                .map(([category, stat]) => ({
                    category,
                    value: stat.value,
                    count: stat.count,
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6)

            // Previous month end
            const previousMonthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)

            // Calculate item usage for selected month
            const itemUsageCount: Record<string, number> = {}
            transactions?.forEach((trans: any) => {
                const transDate = new Date(trans.created_at)
                if (trans.transaction_type === 'ISSUE' && transDate >= selectedMonthStart && transDate <= selectedMonthEnd && trans.transaction_lines) {
                    trans.transaction_lines.forEach((line: any) => {
                        if (line.item_id) {
                            itemUsageCount[line.item_id] = (itemUsageCount[line.item_id] || 0) + (line.quantity || 0)
                        }
                    })
                }
            })

            // Top 10 items by ISSUE quantity
            const topItems: TopItem[] = Object.entries(itemUsageCount)
                .map(([itemId, totalQuantity]) => {
                    const item = items?.find(i => i.item_id === itemId)
                    return item ? {
                        item_id: itemId,
                        item_code: item.item_code,
                        description: item.description,
                        total_quantity: totalQuantity,
                        category_name: (item as any).categories?.category_name || t('common.uncategorized'),
                    } : null
                })
                .filter((item): item is TopItem => item !== null)
                .sort((a, b) => b.total_quantity - a.total_quantity)
                .slice(0, 10)

            // Department values
            const departmentTransactionValue: Record<string, { totalValue: number; departmentName: string }> = {}
            transactions?.forEach((trans: any) => {
                const transDate = new Date(trans.created_at)
                if (transDate >= selectedMonthStart && transDate <= selectedMonthEnd && trans.department_id && trans.transaction_lines) {
                    const deptId = trans.department_id
                    const deptName = trans.departments?.dept_name || 'Unknown'

                    if (!departmentTransactionValue[deptId]) {
                        departmentTransactionValue[deptId] = { totalValue: 0, departmentName: deptName }
                    }

                    const transactionValue = trans.transaction_lines?.reduce((sum: number, line: any) => {
                        return sum + ((line.quantity || 0) * (line.unit_cost || 0))
                    }, 0) || 0

                    departmentTransactionValue[deptId].totalValue += transactionValue
                }
            })

            const topDepartments: TopDepartment[] = Object.entries(departmentTransactionValue)
                .map(([deptId, data]) => ({
                    department_id: deptId,
                    department_name: data.departmentName,
                    total_value: data.totalValue,
                }))
                .filter(dept => dept.total_value > 0)
                .sort((a, b) => b.total_value - a.total_value)
                .slice(0, 10)

            // Previous month item usage
            const previousMonthItemUsage: Record<string, number> = {}
            transactions?.forEach((trans: any) => {
                const transDate = new Date(trans.created_at)
                if (trans.transaction_type === 'ISSUE' && transDate >= previousMonthStart && transDate <= previousMonthEnd && trans.transaction_lines) {
                    trans.transaction_lines.forEach((line: any) => {
                        if (line.item_id) {
                            previousMonthItemUsage[line.item_id] = (previousMonthItemUsage[line.item_id] || 0) + (line.quantity || 0)
                        }
                    })
                }
            })

            // Top saving items
            const topSavingItems: SavingItem[] = Object.entries(itemUsageCount)
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
                            category_name: (item as any).categories?.category_name || t('common.uncategorized'),
                        }
                    }
                    return null
                })
                .filter((item): item is SavingItem => item !== null)
                .sort((a, b) => b.savings_quantity - a.savings_quantity)
                .slice(0, 10)

            // Previous month department values
            const previousMonthDepartmentValue: Record<string, { totalValue: number; departmentName: string }> = {}
            transactions?.forEach((trans: any) => {
                const transDate = new Date(trans.created_at)
                if (transDate >= previousMonthStart && transDate <= previousMonthEnd && trans.department_id && trans.transaction_lines) {
                    const deptId = trans.department_id
                    const deptName = trans.departments?.dept_name || 'Unknown'

                    if (!previousMonthDepartmentValue[deptId]) {
                        previousMonthDepartmentValue[deptId] = { totalValue: 0, departmentName: deptName }
                    }

                    const transactionValue = trans.transaction_lines?.reduce((sum: number, line: any) => {
                        return sum + ((line.quantity || 0) * (line.unit_cost || 0))
                    }, 0) || 0

                    previousMonthDepartmentValue[deptId].totalValue += transactionValue
                }
            })

            // Top saving departments
            const topSavingDepartments: SavingDepartment[] = Object.entries(departmentTransactionValue)
                .map(([deptId, data]) => {
                    const previousValue = previousMonthDepartmentValue[deptId]?.totalValue || 0
                    const savingsValue = previousValue - data.totalValue

                    if (savingsValue > 0) {
                        return {
                            department_id: deptId,
                            department_name: data.departmentName,
                            previous_value: previousValue,
                            current_value: data.totalValue,
                            savings_value: savingsValue,
                        }
                    }
                    return null
                })
                .filter((dept): dept is SavingDepartment => dept !== null)
                .sort((a, b) => b.savings_value - a.savings_value)
                .slice(0, 10)

            // Recent transactions count (last 7 days)
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            const recentTransactionCount = transactions?.filter(
                t => t.created_at && new Date(t.created_at) >= sevenDaysAgo
            ).length || 0

            // Load real inventory value trend
            const inventoryValueTrend = await loadInventoryValueTrend(totalValue)

            setStats({
                totalItems,
                lowStockItems: lowStockCount,
                totalValue,
                outOfStock: outOfStockCount,
                recentTransactions: recentTransactionCount,
                topItems,
                topDepartments,
                topSavingItems,
                topSavingDepartments,
                inventoryValueTrend,
                categoryDistribution,
                transactionTrends: chartData.transactionTrends,
            })
        } catch (error) {
            console.error('Error loading dashboard stats:', error)
        } finally {
            setLoading(false)
        }
    }, [selectedMonth, selectedYear, language, t, loadChartData, loadInventoryValueTrend])

    useEffect(() => {
        loadDashboardStats()
    }, [loadDashboardStats])

    return { stats, loading }
}
