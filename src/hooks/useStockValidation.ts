import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface StockCheck {
  itemId: string
  quantity: number
}

interface ValidationResult {
  itemId: string
  available: boolean
  currentQuantity: number
  shortage: number
  itemCode: string
  description: string
}

export function useStockValidation() {
  const [validating, setValidating] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validateStock = async (items: StockCheck[]): Promise<ValidationResult[]> => {
    setValidating(true)
    setErrors([])

    try {
      const results: ValidationResult[] = []

      for (const item of items) {
        // Query current stock level
        const { data: inventoryStatus, error: inventoryError } = await supabase
          .from('inventory_status')
          .select('quantity')
          .eq('item_id', item.itemId)

        if (inventoryError) {
          throw inventoryError
        }

        // Get item details
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('item_code, description')
          .eq('item_id', item.itemId)
          .single()

        if (itemError) {
          console.error('Item query error:', itemError)
          throw itemError
        }

        // Calculate total quantity
        let totalQuantity = 0
        if (inventoryStatus && inventoryStatus.length > 0) {
          totalQuantity = inventoryStatus.reduce((sum, inv) => sum + (inv.quantity || 0), 0)
        }

        
        const available = totalQuantity >= item.quantity
        const shortage = available ? 0 : item.quantity - totalQuantity

        results.push({
          itemId: item.itemId,
          available,
          currentQuantity: totalQuantity,
          shortage,
          itemCode: itemData.item_code,
          description: itemData.description
        })

        if (!available) {
          setErrors(prev => [
            ...prev,
            `${itemData.item_code}: Insufficient stock. Need ${item.quantity}, have ${totalQuantity}`
          ])
        }
      }

      return results
    } catch (error) {
      // Error will be handled by calling code
      throw error
    } finally {
      setValidating(false)
    }
  }

  return { validateStock, validating, errors }
}
