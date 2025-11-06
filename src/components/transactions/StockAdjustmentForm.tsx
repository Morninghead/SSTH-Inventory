import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Database } from '../../types/database.types'

type Item = Database['public']['Tables']['items']['Row']

interface ItemWithInventory extends Item {
  inventory_status?: Array<{
    quantity: number
    reserved_qty?: number | null
  }> | null
}

interface StockAdjustmentFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface AdjustmentLineItem {
  item_id: string
  item_code: string
  description: string
  current_qty: number
  new_qty: number
  adjustment_qty: number
  reason: string
  base_uom: string
}

export default function StockAdjustmentForm({ onSuccess, onCancel }: StockAdjustmentFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<ItemWithInventory[]>([])
  const [adjustmentLines, setAdjustmentLines] = useState<AdjustmentLineItem[]>([])
  const [notes, setNotes] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'subtract'>('set')

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    const { data } = await supabase
      .from('items')
      .select(`
        *,
        inventory_status(quantity)
      `)
      .eq('is_active', true)
      .order('item_code')
    setItems((data as ItemWithInventory[]) || [])
  }

  const addLine = () => {
    setAdjustmentLines([
      ...adjustmentLines,
      {
        item_id: '',
        item_code: '',
        description: '',
        current_qty: 0,
        new_qty: 0,
        adjustment_qty: 0,
        reason: '',
        base_uom: '',
      },
    ])
  }

  const removeLine = (index: number) => {
    setAdjustmentLines(adjustmentLines.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...adjustmentLines]

    if (field === 'item_id') {
      const item = items.find((i) => i.item_id === value)
      if (item) {
        const currentQty = item.inventory_status?.[0]?.quantity || 0
        updated[index] = {
          ...updated[index],
          item_id: item.item_id,
          item_code: item.item_code || '',
          description: item.description || '',
          current_qty: currentQty,
          new_qty: currentQty,
          adjustment_qty: 0,
          base_uom: item.base_uom || '',
        }
      }
    } else if (field === 'new_qty') {
      const newQty = parseFloat(value) || 0
      updated[index] = {
        ...updated[index],
        new_qty: newQty,
        adjustment_qty: newQty - updated[index].current_qty,
      }
    } else if (field === 'adjustment_qty') {
      const adjustQty = parseFloat(value) || 0
      let newQty = updated[index].current_qty

      if (adjustmentType === 'add') {
        newQty = updated[index].current_qty + adjustQty
      } else if (adjustmentType === 'subtract') {
        newQty = updated[index].current_qty - adjustQty
      } else {
        newQty = adjustQty
      }

      updated[index] = {
        ...updated[index],
        adjustment_qty: adjustQty,
        new_qty: Math.max(0, newQty),
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }

    setAdjustmentLines(updated)
  }

  const handleSubmit = async () => {
    setError('')

    // Validation
    if (adjustmentLines.length === 0) {
      setError('Please add at least one item to adjust')
      return
    }

    // Validate line items
    for (const line of adjustmentLines) {
      if (!line.item_id) {
        setError('Please select an item for all lines')
        return
      }
      if (line.new_qty < 0) {
        setError('New quantity cannot be negative')
        return
      }
      if (!line.reason.trim()) {
        setError('Please provide a reason for each adjustment')
        return
      }
    }

    setLoading(true)

    try {
      // Prepare items for the database function
      const itemsToProcess = adjustmentLines.map(line => ({
        item_id: line.item_id,
        quantity: line.new_qty, // For ADJUSTMENT, this is the final quantity
        unit_cost: 0, // Not used for adjustments
        notes: line.reason
      }))

      // Call the database function to process the adjustment
      const { data, error: txError } = await supabase
        .rpc('process_transaction' as any, {
          p_transaction_type: 'ADJUSTMENT',
          p_department_id: null,
          p_supplier_id: null,
          p_reference_number: referenceNumber || null,
          p_notes: notes || null,
          p_items: itemsToProcess as any,
          p_created_by: user?.id
        })

      if (txError) throw txError

      const result = data as any
      if (result && Array.isArray(result) && result.length > 0 && result[0].success) {
        onSuccess()
      } else {
        throw new Error(result?.[0]?.message || 'Failed to process adjustment')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create stock adjustment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-800 mb-1">Stock Adjustment</h4>
            <p className="text-sm text-yellow-700">
              Use this form to correct inventory quantities. All adjustments are logged and require a reason.
              This bypasses normal transaction flows and directly sets inventory levels.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
          <select
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value as 'set' | 'add' | 'subtract')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="set">Set New Quantity</option>
            <option value="add">Add to Current</option>
            <option value="subtract">Subtract from Current</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
          <Input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="ADJ-001 (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Date</label>
          <Input
            type="date"
            value={new Date().toISOString().split('T')[0]}
            disabled
            className="bg-gray-50"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Items to Adjust</h3>
          <Button size="sm" onClick={addLine} variant="secondary">
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {adjustmentLines.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-600">No items added yet. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {adjustmentLines.map((line, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={line.item_id}
                      onChange={(e) => updateLine(index, 'item_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select item...</option>
                      {items.map((item: any) => (
                        <option key={item.item_id} value={item.item_id}>
                          {item.item_code} - {item.description} (Current: {item.inventory_status?.[0]?.quantity || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Quantity</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={line.current_qty}
                        disabled
                        className="bg-white text-sm font-semibold"
                      />
                      <span className="text-sm text-gray-600">{line.base_uom}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {adjustmentType === 'set' ? 'New Quantity' :
                       adjustmentType === 'add' ? 'Add Quantity' : 'Subtract Quantity'}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={adjustmentType === 'set' ? line.new_qty : line.adjustment_qty}
                        onChange={(e) => updateLine(
                          index,
                          adjustmentType === 'set' ? 'new_qty' : 'adjustment_qty',
                          e.target.value
                        )}
                        className="text-sm"
                      />
                      <span className="text-sm text-gray-600">{line.base_uom}</span>
                    </div>
                  </div>

                  {adjustmentType !== 'set' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resulting Quantity
                      </label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          value={line.new_qty}
                          disabled
                          className="bg-blue-50 text-sm font-semibold text-blue-900"
                        />
                        <span className="text-sm text-gray-600">{line.base_uom}</span>
                        <span className={`text-sm font-medium ${
                          line.adjustment_qty > 0 ? 'text-green-600' :
                          line.adjustment_qty < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {line.adjustment_qty > 0 ? '+' : ''}{line.adjustment_qty}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Adjustment <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={line.reason}
                      onChange={(e) => updateLine(index, 'reason', e.target.value)}
                      placeholder="e.g., Physical count correction, damaged goods, data entry error..."
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => removeLine(index)}
                    className="flex items-center text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">General Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add any general notes about this adjustment batch..."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Processing...' : 'Create Stock Adjustment'}
        </Button>
      </div>
    </div>
  )
}
