import { supabase } from '../lib/supabase'
import type {
  StockCount,
  StockCountWithDetails,
  StockCountWithLines,
  StockCountLine,
  StockCountLineWithItem,
  StockCountAdjustment,
  CreateStockCountForm,
  StockCountFilters,
  StockCountListResponse,
  StockCountDashboardStatus,
  StockCountVarianceReport,
  StockCountExportData
} from '../types/stockCount.types'

export class StockCountService {
  // Create new stock count
  async createStockCount(formData: CreateStockCountForm, userId: string): Promise<StockCount> {
    try {
      const { data, error } = await supabase.rpc('create_stock_count', {
        p_count_type: formData.countType,
        p_count_date: formData.countDate,
        p_period_month: formData.periodMonth,
        p_created_by: userId,
        p_notes: formData.notes || null
      })

      if (error) throw error

      // Fetch the complete stock count with details
      const { data: stockCount, error: fetchError } = await supabase
        .from('stock_counts')
        .select(`
          *,
          user_profiles(full_name, email)
        `)
        .eq('count_id', data)
        .single()

      if (fetchError) throw fetchError
      return stockCount
    } catch (error) {
      console.error('Error creating stock count:', error)
      throw error
    }
  }

  // Get stock counts list
  async getStockCounts(
    filters: StockCountFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<StockCountListResponse> {
    try {
      const offset = (page - 1) * limit

      const { data, error } = await supabase.rpc('get_stock_counts_paginated', {
        p_limit: limit,
        p_offset: offset,
        p_search_term: filters.search || '',
        p_count_type: filters.countType || '',
        p_status: filters.status || '',
        p_period_month: filters.periodMonth || ''
      })

      if (error) throw error

      const result = data as StockCountListResponse
      return result
    } catch (error) {
      console.error('Error fetching stock counts:', error)
      throw error
    }
  }

  // Get single stock count with all lines
  async getStockCountWithLines(countId: string): Promise<StockCountWithLines> {
    try {
      // Get stock count header
      const { data: stockCount, error: countError } = await supabase
        .from('stock_counts')
        .select(`
          *,
          user_profiles(full_name, email),
          user_profiles(full_name, email)
        `)
        .eq('count_id', countId)
        .single()

      if (countError) throw countError

      // Get all lines with item details
      const { data: lines, error: linesError } = await supabase
        .from('stock_count_lines')
        .select(`
          *,
          item:items(
            item_code,
            description,
            unit_cost,
            base_uom,
            category_id,
            categories!items_category_id_fkey(category_name)
          )
        `)
        .eq('count_id', countId)
        .order('row_number')

      if (linesError) throw linesError

      // Calculate discrepancy summary
      const totalItems = lines.length
      const matchedItems = lines.filter(l => l.status === 'MATCHED').length
      const differenceItems = lines.filter(l => l.status === 'DIFFERENCE').length
      const pendingItems = lines.filter(l => l.status === 'PENDING').length
      const totalVariance = lines.reduce((sum, l) => sum + (l.discrepancy || 0), 0)
      const totalVarianceValue = lines.reduce((sum, l) => {
        const variance = l.discrepancy || 0
        const cost = (l.item as any)?.unit_cost || 0
        return sum + Math.abs(variance * cost)
      }, 0)

      return {
        ...stockCount,
        lines: lines.map(line => ({
          ...line,
          item: line.item ? {
            ...line.item,
            category_name: (line.item as any)?.categories?.category_name
          } : null
        })) as StockCountLineWithItem[],
        discrepancy_summary: {
          totalItems,
          matchedItems,
          differenceItems,
          pendingItems,
          totalVariance,
          totalVarianceValue
        }
      }
    } catch (error) {
      console.error('Error fetching stock count with lines:', error)
      throw error
    }
  }

  // Update count line with physical count
  async updateCountLine(lineId: string, countedQuantity: number, notes?: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_stock_count_line', {
        p_line_id: lineId,
        p_counted_quantity: countedQuantity,
        p_notes: notes || null
      })

      if (error) throw error
    } catch (error) {
      console.error('Error updating count line:', error)
      throw error
    }
  }

  // Post stock count and create adjustments
  async postStockCount(countId: string, writeOffThreshold: number, userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('post_stock_count', {
        p_count_id: countId,
        p_write_off_threshold: writeOffThreshold,
        p_posted_by: userId
      })

      if (error) throw error
    } catch (error) {
      console.error('Error posting stock count:', error)
      throw error
    }
  }

  // Get stock count adjustments
  async getStockCountAdjustments(countId: string): Promise<StockCountAdjustment[]> {
    try {
      const { data, error } = await supabase
        .from('stock_count_adjustments')
        .select(`
          *,
          item:items(item_code, description),
          transaction:transactions(transaction_type, reference_number)
        `)
        .eq('count_id', countId)
        .order('created_at')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching stock count adjustments:', error)
      throw error
    }
  }

  // Get dashboard status
  async getDashboardStatus(): Promise<StockCountDashboardStatus> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

      // Get last completed count
      const { data: lastCount, error: lastError } = await supabase
        .from('stock_counts')
        .select('*')
        .eq('status', 'POSTED')
        .order('posted_at', { ascending: false })
        .limit(1)
        .single()

      // Get current month count
      const { data: currentCount, error: currentError } = await supabase
        .from('stock_counts')
        .select('*')
        .eq('period_month', currentMonth)
        .eq('count_type', 'EOM')
        .single()

      // Get counts pending review
      const { count: pendingCount, error: pendingError } = await supabase
        .from('stock_counts')
        .select('*', { count: 'exact', head: true })
        .in('status', ['IN_PROGRESS', 'COMPLETED'])

      // Calculate average variance
      const { data: varianceData, error: varianceError } = await supabase
        .from('stock_counts')
        .select('total_variance_value')
        .eq('status', 'POSTED')
        .gte('period_month', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().slice(0, 7))

      const averageVariance = varianceData && varianceData.length > 0
        ? varianceData.reduce((sum, sc) => sum + (sc.total_variance_value || 0), 0) / varianceData.length
        : 0

      return {
        lastCountDate: lastCount?.posted_at || null,
        lastCountStatus: lastCount?.status || null,
        currentMonthCount: currentCount || null,
        pendingActions: pendingCount || 0,
        averageVariance
      }
    } catch (error) {
      console.error('Error fetching dashboard status:', error)
      return {
        lastCountDate: null,
        lastCountStatus: null,
        currentMonthCount: null,
        pendingActions: 0,
        averageVariance: 0
      }
    }
  }

  // Generate variance report
  async getVarianceReport(startDate: string, endDate: string): Promise<StockCountVarianceReport[]> {
    try {
      const { data, error } = await supabase
        .from('stock_count_adjustments')
        .select(`
          quantity_before,
          quantity_after,
          variance,
          adjustment_type,
          reason,
          created_at,
          stock_count_lines (
            item_id,
            system_quantity,
            counted_quantity
          ),
          items (
            item_code,
            description,
            unit_cost,
            category_id
          ),
          stock_counts (count_date, period_month)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at')

      if (error) throw error

      // Get category names
      const itemIds = data?.map((adj: any) => adj.items?.category_id).filter(Boolean) || []
      const { data: categories } = await supabase
        .from('categories')
        .select('category_id, category_name')
        .in('category_id', itemIds as string[])

      const categoryMap = (categories || []).reduce((acc, cat) => {
        acc[cat.category_id] = cat.category_name
        return acc
      }, {} as Record<string, string>)

      return (data || []).map(adj => {
        const adjAny = adj as any
        return {
          item_code: adjAny.items?.item_code || '',
          item_description: adjAny.items?.description || '',
          category_name: adjAny.items?.category_id ? categoryMap[adjAny.items.category_id] || '' : '',
          system_quantity: adjAny.stock_count_lines?.system_quantity || 0,
          counted_quantity: adjAny.stock_count_lines?.counted_quantity || 0,
          discrepancy: adjAny.variance || 0,
          unit_cost: adjAny.items?.unit_cost || 0,
          variance_value: Math.abs((adjAny.variance || 0) * (adjAny.items?.unit_cost || 0)),
          adjustment_type: adjAny.adjustment_type,
          count_date: adjAny.stock_counts?.count_date || '',
          period_month: adjAny.stock_counts?.period_month || ''
        }
      })
    } catch (error) {
      console.error('Error generating variance report:', error)
      throw error
    }
  }

  // Export stock count data
  async getExportData(countId: string): Promise<StockCountExportData> {
    try {
      const stockCount = await this.getStockCountWithLines(countId)

      return {
        countInfo: {
          countId: stockCount.count_id,
          countType: stockCount.count_type,
          countDate: stockCount.count_date,
          periodMonth: stockCount.period_month,
          status: stockCount.status,
          createdByName: 'Unknown' // Profile needs to be loaded separately
        },
        items: stockCount.lines.map((line, index) => ({
          rowNumber: index + 1,
          itemCode: line.item?.item_code || '',
          description: line.item?.description || '',
          categoryName: line.item?.category_name || '',
          systemQuantity: line.system_quantity,
          countedQuantity: line.counted_quantity || 0,
          discrepancy: (line.counted_quantity || 0) - line.system_quantity,
          unitCost: line.item?.unit_cost || 0,
          varianceValue: ((line.counted_quantity || 0) - line.system_quantity) * (line.item?.unit_cost || 0),
          notes: line.notes || '',
          status: line.status
        })),
        summary: {
          totalItems: stockCount.discrepancy_summary?.total_items || 0,
          matchedItems: stockCount.discrepancy_summary?.matched_items || 0,
          varianceItems: stockCount.discrepancy_summary?.difference_items || 0,
          pendingItems: stockCount.discrepancy_summary?.pending_items || 0,
          totalVarianceValue: stockCount.discrepancy_summary?.total_variance_value || 0
        }
      }
    } catch (error) {
      console.error('Error getting export data:', error)
      throw error
    }
  }

  // Delete draft stock count
  async deleteDraftStockCount(countId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('stock_counts')
        .delete()
        .eq('count_id', countId)
        .eq('status', 'DRAFT')

      if (error) throw error
    } catch (error) {
      console.error('Error deleting stock count:', error)
      throw error
    }
  }

  // Update stock count status
  async updateStockCountStatus(countId: string, status: string, userId?: string): Promise<void> {
    try {
      const updateData: any = { status }
      if (userId) {
        if (status === 'COMPLETED') {
          updateData.completed_by = userId
        }
        updateData.updated_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('stock_counts')
        .update(updateData)
        .eq('count_id', countId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating stock count status:', error)
      throw error
    }
  }
}

export const stockCountService = new StockCountService()