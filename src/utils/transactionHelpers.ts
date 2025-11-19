import { supabase } from '../lib/supabase'

export async function createIssueTransaction(
  departmentId: string,
  items: Array<{
    item_id: string
    quantity: number
    unit_cost: number
    notes?: string | null
  }>,
  referenceNumber?: string | null,
  notes?: string | null,
  createdBy?: string
) {
  try {
    // Step 1: Create transaction header
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        transaction_type: 'ISSUE',
        transaction_date: new Date().toISOString(),
        department_id: departmentId,
        reference_number: referenceNumber || null,
        notes: notes || null,
        status: 'COMPLETED',
        created_by: createdBy || 'system'
      })
      .select()
      .single()

    if (txError) throw txError

    // Step 2: Create transaction lines and update inventory
    for (const item of items) {
      // Insert transaction line
      const { error: lineError } = await supabase
        .from('transaction_lines')
        .insert({
          transaction_id: transaction.transaction_id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          notes: item.notes || null
        })

      if (lineError) throw lineError

      // Update inventory quantity (decrease for issue)
      const { data: currentStock } = await supabase
        .from('inventory_status')
        .select('quantity')
        .eq('item_id', item.item_id)
        .single()

      const newQuantity = (currentStock?.quantity || 0) - item.quantity

      const { error: updateError } = await supabase
        .from('inventory_status')
        .update({
          quantity: Math.max(0, newQuantity),
          last_updated: new Date().toISOString()
        })
        .eq('item_id', item.item_id)

      if (updateError) throw updateError
    }

    return { success: true, transaction_id: transaction.transaction_id }
  } catch (error: any) {
    console.error('Transaction error:', error)
    return { success: false, error: error.message }
  }
}

export async function createReceiveTransaction(
  supplierId: string | null,
  items: Array<{
    item_id: string
    quantity: number
    unit_cost: number
    notes?: string | null
  }>,
  referenceNumber?: string | null,
  notes?: string | null,
  createdBy?: string
) {
  try {
    // Step 1: Create transaction header
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        transaction_type: 'RECEIVE',
        transaction_date: new Date().toISOString(),
        supplier_id: supplierId,
        reference_number: referenceNumber || null,
        notes: notes || null,
        status: 'COMPLETED',
        created_by: createdBy || 'system'
      })
      .select()
      .single()

    if (txError) throw txError

    // Step 2: Create transaction lines and update inventory
    for (const item of items) {
      // Insert transaction line
      const { error: lineError } = await supabase
        .from('transaction_lines')
        .insert({
          transaction_id: transaction.transaction_id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          notes: item.notes || null
        })

      if (lineError) throw lineError

      // Update inventory quantity (increase for receive)
      const { data: currentStock } = await supabase
        .from('inventory_status')
        .select('quantity')
        .eq('item_id', item.item_id)
        .single()

      const newQuantity = (currentStock?.quantity || 0) + item.quantity

      const { error: updateError } = await supabase
        .from('inventory_status')
        .upsert({
          item_id: item.item_id,
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })

      if (updateError) throw updateError
    }

    return { success: true, transaction_id: transaction.transaction_id }
  } catch (error: any) {
    console.error('Transaction error:', error)
    return { success: false, error: error.message }
  }
}

export async function createAdjustmentTransaction(
  items: Array<{
    item_id: string
    quantity: number
    unit_cost: number
    notes?: string | null
  }>,
  adjustmentType: 'INCREASE' | 'DECREASE',
  referenceNumber?: string | null,
  notes?: string | null,
  createdBy?: string
) {
  try {
    // Step 1: Create transaction header
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        transaction_type: 'ADJUSTMENT',
        transaction_date: new Date().toISOString(),
        reference_number: referenceNumber || null,
        notes: `${adjustmentType}: ${notes || ''}`,
        status: 'COMPLETED',
        created_by: createdBy || 'system'
      })
      .select()
      .single()

    if (txError) throw txError

    // Step 2: Create transaction lines and update inventory
    for (const item of items) {
      // Insert transaction line
      const { error: lineError } = await supabase
        .from('transaction_lines')
        .insert({
          transaction_id: transaction.transaction_id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          notes: item.notes || null
        })

      if (lineError) throw lineError

      // Update inventory quantity
      const { data: currentStock } = await supabase
        .from('inventory_status')
        .select('quantity')
        .eq('item_id', item.item_id)
        .single()

      const currentQty = currentStock?.quantity || 0
      const newQuantity = adjustmentType === 'INCREASE'
        ? currentQty + item.quantity
        : Math.max(0, currentQty - item.quantity)

      const { error: updateError } = await supabase
        .from('inventory_status')
        .upsert({
          item_id: item.item_id,
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })

      if (updateError) throw updateError
    }

    return { success: true, transaction_id: transaction.transaction_id }
  } catch (error: any) {
    console.error('Transaction error:', error)
    return { success: false, error: error.message }
  }
}