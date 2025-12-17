import type { Database } from './database.types'

// Type exports from database
export type StockCount = Database['public']['Tables']['stock_counts']['Row']
export type StockCountInsert = Database['public']['Tables']['stock_counts']['Insert']
export type StockCountUpdate = Database['public']['Tables']['stock_counts']['Update']

export type StockCountLine = Database['public']['Tables']['stock_count_lines']['Row']
export type StockCountLineInsert = Database['public']['Tables']['stock_count_lines']['Insert']
export type StockCountLineUpdate = Database['public']['Tables']['stock_count_lines']['Update']

export type StockCountAdjustment = Database['public']['Tables']['stock_count_adjustments']['Row']
export type StockCountAdjustmentInsert = Database['public']['Tables']['stock_count_adjustments']['Insert']

// Extended types with joins
export interface StockCountWithDetails extends StockCount {
  created_by_profile?: {
    full_name: string | null
    email: string | null
  } | null
  completed_by_profile?: {
    full_name: string | null
    email: string | null
  } | null
  posted_by_profile?: {
    full_name: string | null
    email: string | null
  } | null
  lines?: StockCountLineWithItem[]
}

export interface StockCountLineWithItem extends StockCountLine {
  item?: {
    item_code: string
    description: string
    unit_cost: number
    base_uom: string
    category_name?: string
  } | null
}

export interface StockCountWithLines extends StockCount {
  lines: StockCountLineWithItem[]
  discrepancy_summary: {
    total_items: number
    matched_items: number
    difference_items: number
    pending_items: number
    total_variance: number
    total_variance_value: number
  }
}

// Filter types
export interface StockCountFilters {
  search: string
  countType: string
  status: string
  periodMonth: string
  dateFrom: string
  dateTo: string
}

// Form types
export interface CreateStockCountForm {
  countType: 'EOM' | 'CYCLE' | 'ADHOC'
  countDate: string
  periodMonth: string
  notes: string
  categories?: string[]
  departments?: string[]
}

export interface StockCountEntryForm {
  lineId: string
  countedQuantity: number | null
  notes: string
}

export interface StockCountReviewForm {
  writeOffThreshold: number
  notes: string
  createLargeVariances: boolean
  varianceReason: string
}

// API response types
export interface StockCountListResponse {
  data: StockCountWithDetails[]
  count: number
}

export interface StockCountVarianceReport {
  item_code: string
  item_description: string
  category_name: string
  system_quantity: number
  counted_quantity: number
  discrepancy: number
  unit_cost: number
  variance_value: number
  adjustment_type: string
  count_date: string
  period_month: string
}

// Dashboard widget types
export interface StockCountDashboardStatus {
  lastCountDate: string | null
  lastCountStatus: string | null
  currentMonthCount: StockCount | null
  pendingActions: number
  averageVariance: number
}

// Export types
export interface StockCountExportData {
  countInfo: {
    countId: string
    countType: string
    countDate: string
    periodMonth: string
    status: string
    createdByName: string
  }
  items: Array<{
    rowNumber: number
    itemCode: string
    description: string
    categoryName: string
    systemQuantity: number
    countedQuantity: number | null
    discrepancy: number | null
    unitCost: number
    varianceValue: number | null
    notes: string | null
    status: string
  }>
  summary: {
    totalItems: number
    matchedItems: number
    varianceItems: number
    pendingItems: number
    totalVarianceValue: number
  }
}

// Utility types
export type StockCountStatus = StockCount['status']
export type StockCountType = StockCount['count_type']
export type StockCountLineStatus = StockCountLine['status']
export type AdjustmentType = StockCountAdjustment['adjustment_type']

// Constants
export const STOCK_COUNT_TYPES = {
  EOM: 'EOM',
  CYCLE: 'CYCLE',
  ADHOC: 'ADHOC'
} as const

export const STOCK_COUNT_STATUS = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  POSTED: 'POSTED'
} as const

export const STOCK_COUNT_LINE_STATUS = {
  PENDING: 'PENDING',
  MATCHED: 'MATCHED',
  DIFFERENCE: 'DIFFERENCE',
  ADJUSTED: 'ADJUSTED'
} as const

export const ADJUSTMENT_TYPES = {
  WRITE_OFF: 'WRITE_OFF',
  ADJUSTMENT: 'ADJUSTMENT'
} as const

// Validation schemas
export interface StockCountValidationErrors {
  countType?: string
  countDate?: string
  periodMonth?: string
  notes?: string
}

export interface StockCountLineValidationErrors {
  countedQuantity?: string
  notes?: string
}