// Report utility functions and types

export interface ReportFilter {
  startDate?: string
  endDate?: string
  categoryId?: string
  departmentId?: string
  supplierId?: string
  status?: string
}

export interface InventoryReportData {
  item_code: string
  description: string
  category: string
  current_quantity: number
  unit_cost: number
  total_value: number
  reorder_level: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
  base_uom: string
}

export interface TransactionReportData {
  transaction_date: string
  transaction_type: string
  department_name?: string
  supplier_name?: string
  item_code: string
  description: string
  quantity: number
  unit_cost: number
  line_total: number
}

export interface StockMovementData {
  item_code: string
  description: string
  opening_balance: number
  total_received: number
  total_issued: number
  closing_balance: number
  variance: number
}

export interface DepartmentUsageData {
  department_name: string
  total_issues: number
  total_value: number
  item_count: number
}

export interface SupplierPerformanceData {
  supplier_name: string
  po_count: number
  total_received: number
  total_value: number
  avg_delivery_days: number
}

// Export to CSV
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Format currency
export function formatCurrency(amount: number): string {
  return `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Calculate stock status
export function getStockStatus(quantity: number, reorderLevel: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (quantity === 0) return 'Out of Stock'
  if (quantity <= reorderLevel) return 'Low Stock'
  return 'In Stock'
}

// Group data by key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Get date range presets
export function getDateRangePreset(preset: 'today' | 'week' | 'month' | 'quarter' | 'year'): { startDate: string; endDate: string } {
  const today = new Date()
  const endDate = today.toISOString().split('T')[0]
  let startDate: Date

  switch (preset) {
    case 'today':
      startDate = today
      break
    case 'week':
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 7)
      break
    case 'month':
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 1)
      break
    case 'quarter':
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 3)
      break
    case 'year':
      startDate = new Date(today)
      startDate.setFullYear(today.getFullYear() - 1)
      break
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate
  }
}
