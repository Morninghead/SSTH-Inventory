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
        const { data: itemData, error } = await supabase
          .from('items')
          .select(`
            item_id,
            item_code,
            description,
            inventory_status (
              quantity
            )
          `)
          .eq('item_id', item.itemId)
          .single()

        if (error) throw error

        const inventoryStatus = itemData.inventory_status as any
        const currentQuantity = inventoryStatus?.[0]?.quantity || 0
        const available = currentQuantity >= item.quantity
        const shortage = available ? 0 : item.quantity - currentQuantity

        results.push({
          itemId: item.itemId,
          available,
          currentQuantity,
          shortage,
          itemCode: itemData.item_code,
          description: itemData.description
        })

        if (!available) {
          setErrors(prev => [
            ...prev,
            `${itemData.item_code}: Insufficient stock. Need ${item.quantity}, have ${currentQuantity}`
          ])
        }
      }

      return results
    } catch (error) {
      console.error('Stock validation error:', error)
      throw error
    } finally {
      setValidating(false)
    }
  }

  return { validateStock, validating, errors }
}
