import { supabase } from '../lib/supabase'

export interface TransactionNumberOptions {
  transactionType: 'ISSUE' | 'RECEIVE' | 'ADJUSTMENT' | 'BACKORDER'
  date?: Date
}

/**
 * Generates a unique transaction reference number automatically
 * Format: [PREFIX][YYYY][MM][DD][COUNTER]
 * Examples: ISU-202511200001, RCV-202511200001
 */
export async function generateTransactionNumber(options: TransactionNumberOptions): Promise<string> {
  const { transactionType, date = new Date() } = options

  // Get the prefix based on transaction type
  const prefix = transactionType === 'ISSUE' ? 'ISU' :
                 transactionType === 'RECEIVE' ? 'REC' :
                 transactionType === 'BACKORDER' ? 'BAO' : 'ADJ'

  // Format the date component
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`

  // Get the count of transactions for this type today
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  try {
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('transaction_type', transactionType)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())

    if (error) {
      console.warn('Error counting transactions for auto-number generation:', error)
      // Fallback to timestamp-based numbering if database query fails
      const timestamp = Date.now()
      return `${prefix}-${dateStr}${timestamp.toString().slice(-4)}`
    }

    // Generate counter (4 digits, starts from 0001)
    const counter = (count || 0) + 1
    const counterStr = String(counter).padStart(4, '0')

    return `${prefix}-${dateStr}${counterStr}`
  } catch (error) {
    console.warn('Error in generateTransactionNumber:', error)
    // Ultimate fallback
    const timestamp = Date.now()
    return `${prefix}-${dateStr}${timestamp.toString().slice(-4)}`
  }
}

/**
 * Validates that a transaction reference number follows the expected format
 */
export function validateTransactionNumber(referenceNumber: string, transactionType?: string): boolean {
  const pattern = transactionType
    ? new RegExp(`^(ISU|REC|ADJ|BAO)-\\d{8}\\d{4}$`)
    : /^(ISU|REC|ADJ|BAO)-\d{8}\d{4}$/

  return pattern.test(referenceNumber)
}

/**
 * Extracts information from a transaction reference number
 */
export function parseTransactionNumber(referenceNumber: string): {
  transactionType: string
  date: Date
  counter: number
  prefix: string
} | null {
  const match = referenceNumber.match(/^(ISU|REC|ADJ|BAO)-(\d{4})(\d{2})(\d{2})(\d{4})$/)

  if (!match) return null

  const [, prefix, year, month, day, counter] = match

  // Convert prefix back to transaction type
  const transactionType = prefix === 'ISU' ? 'ISSUE' :
                         prefix === 'REC' ? 'RECEIVE' :
                         prefix === 'BAO' ? 'BACKORDER' : 'ADJUSTMENT'

  return {
    transactionType,
    date: new Date(`${year}-${month}-${day}`),
    counter: parseInt(counter),
    prefix
  }
}