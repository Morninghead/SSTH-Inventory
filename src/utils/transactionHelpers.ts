/**
 * Transaction Helpers - Atomic Operations via Postgres RPC
 * 
 * This module provides type-safe wrappers around Postgres stored procedures
 * that handle inventory transactions with FIFO costing and row-level locking.
 * 
 * Key Features:
 * - Atomic operations (no race conditions)
 * - FIFO cost calculation
 * - Stock validation with locks
 * - Comprehensive error handling
 * 
 * @see supabase/migrations/20260216_atomic_transaction_functions.sql
 */

import { supabase } from '../lib/supabase'

// =====================================================
// Type Definitions
// =====================================================

interface TransactionItem {
  item_id: string
  quantity: number
  unit_cost: number
  notes?: string | null
  lot_number?: string | null // For receive transactions
}

interface TransactionResult {
  success: boolean
  transaction_id?: string
  error?: string
  error_code?: string
  message?: string
}

// =====================================================
// 1. ISSUE TRANSACTION (FIFO Stock Consumption)
// =====================================================

/**
 * Creates an issue transaction with atomic FIFO stock consumption
 * 
 * @param departmentId - Department receiving the items
 * @param items - Array of items to issue
 * @param referenceNumber - Optional reference (e.g., requisition number)
 * @param notes - Optional transaction notes
 * @returns Transaction result with success status and transaction_id
 * 
 * @throws Will return error if insufficient stock
 */
export async function createIssueTransaction(
  departmentId: string,
  items: TransactionItem[],
  referenceNumber?: string | null,
  notes?: string | null,
): Promise<TransactionResult> {
  try {
    // Call atomic Postgres function
    const { data, error } = await supabase.rpc('create_issue_transaction', {
      p_department_id: departmentId,
      p_items: items,
      p_reference_number: referenceNumber,
      p_notes: notes,
    })

    if (error) {
      console.error('Issue transaction RPC error:', error)
      return {
        success: false,
        error: error.message,
        error_code: error.code,
      }
    }

    // Parse the JSONB response
    const result = data as TransactionResult

    if (!result.success) {
      console.error('Issue transaction failed:', result.error)
    }

    return result
  } catch (error: any) {
    console.error('Issue transaction error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      error_code: 'CLIENT_ERROR',
    }
  }
}

// =====================================================
// 2. RECEIVE TRANSACTION (Creates New Inventory Lots)
// =====================================================

/**
 * Creates a receive transaction and adds new inventory lots
 * 
 * @param supplierId - Supplier providing the items (optional)
 * @param items - Array of items to receive (must include unit_cost)
 * @param referenceNumber - Optional reference (e.g., PO number)
 * @param notes - Optional transaction notes
 * @returns Transaction result with success status and transaction_id
 */
export async function createReceiveTransaction(
  items: TransactionItem[],
  supplierId: string | null = null,
  referenceNumber?: string | null,
  notes?: string | null,
): Promise<TransactionResult> {
  try {
    const { data, error } = await supabase.rpc('create_receive_transaction', {
      p_items: items,
      p_supplier_id: supplierId,
      p_reference_number: referenceNumber,
      p_notes: notes,
    })

    if (error) {
      console.error('Receive transaction RPC error:', error)
      return {
        success: false,
        error: error.message,
        error_code: error.code,
      }
    }

    const result = data as TransactionResult

    if (!result.success) {
      console.error('Receive transaction failed:', result.error)
    }

    return result
  } catch (error: any) {
    console.error('Receive transaction error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      error_code: 'CLIENT_ERROR',
    }
  }
}

// =====================================================
// 3. BACKORDER TRANSACTION (No Stock Changes)
// =====================================================

/**
 * Creates a backorder transaction (records demand without affecting inventory)
 * 
 * @param departmentId - Department requesting the items
 * @param items - Array of items on backorder
 * @param referenceNumber - Optional reference
 * @param notes - Optional transaction notes
 * @returns Transaction result with success status and transaction_id
 */
export async function createBackorderTransaction(
  departmentId: string,
  items: TransactionItem[],
  referenceNumber?: string | null,
  notes?: string | null,
): Promise<TransactionResult> {
  try {
    const { data, error } = await supabase.rpc('create_backorder_transaction', {
      p_department_id: departmentId,
      p_items: items,
      p_reference_number: referenceNumber,
      p_notes: notes,
    })

    if (error) {
      console.error('Backorder transaction RPC error:', error)
      return {
        success: false,
        error: error.message,
        error_code: error.code,
      }
    }

    const result = data as TransactionResult

    if (!result.success) {
      console.error('Backorder transaction failed:', result.error)
    }

    return result
  } catch (error: any) {
    console.error('Backorder transaction error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      error_code: 'CLIENT_ERROR',
    }
  }
}

// =====================================================
// 4. ADJUSTMENT TRANSACTION (Increase/Decrease Stock)
// =====================================================

/**
 * Creates an adjustment transaction (stock count corrections, damage, etc.)
 * 
 * @param items - Array of items to adjust
 * @param adjustmentType - 'INCREASE' or 'DECREASE'
 * @param referenceNumber - Optional reference
 * @param notes - Optional transaction notes (reason for adjustment)
 * @returns Transaction result with success status and transaction_id
 * 
 * @throws Will return error if decreasing more than available stock
 */
export async function createAdjustmentTransaction(
  items: TransactionItem[],
  adjustmentType: 'INCREASE' | 'DECREASE',
  referenceNumber?: string | null,
  notes?: string | null,
): Promise<TransactionResult> {
  try {
    const { data, error } = await supabase.rpc('create_adjustment_transaction', {
      p_items: items,
      p_adjustment_type: adjustmentType,
      p_reference_number: referenceNumber,
      p_notes: notes,
    })

    if (error) {
      console.error('Adjustment transaction RPC error:', error)
      return {
        success: false,
        error: error.message,
        error_code: error.code,
      }
    }

    const result = data as TransactionResult

    if (!result.success) {
      console.error('Adjustment transaction failed:', result.error)
    }

    return result
  } catch (error: any) {
    console.error('Adjustment transaction error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      error_code: 'CLIENT_ERROR',
    }
  }
}

// =====================================================
// 5. HELPER FUNCTIONS
// =====================================================

/**
 * Gets real-time available stock for an item
 * 
 * @param itemId - Item UUID
 * @returns Available quantity (sum of all lots)
 */
export async function getAvailableStock(itemId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_available_stock', {
      p_item_id: itemId,
    })

    if (error) {
      console.error('Get available stock error:', error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error('Get available stock error:', error)
    return 0
  }
}

/**
 * Gets comprehensive stock summary for an item
 * 
 * @param itemId - Item UUID
 * @returns Stock summary with total quantity, value, weighted avg cost, and lot count
 */
export async function getItemStockSummary(itemId: string): Promise<{
  total_quantity: number
  total_value: number
  weighted_avg_cost: number
  lot_count: number
} | null> {
  try {
    const { data, error } = await supabase.rpc('get_item_stock_summary', {
      p_item_id: itemId,
    })

    if (error) {
      console.error('Get item stock summary error:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Get item stock summary error:', error)
    return null
  }
}