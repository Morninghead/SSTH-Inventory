import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Database } from '../../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type Department = Database['public']['Tables']['departments']['Row']

interface IssueTransactionFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface IssueLineItem {
  item_id: string
  item_code: string
  description: string
  available_qty: number
  quantity: number
  unit_cost: number
  base_uom: string
}

export default function IssueTransactionForm({ onSuccess, onCancel }: IssueTransactionFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [issueLines, setIssueLines] = useState<IssueLineItem[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadDepartments()
    loadItems()
  }, [])

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('dept_name')
    setDepartments(data || [])
  }

  const loadItems = async () => {
    const { data } = await supabase
      .from('items')
      .select(`
        *,
        inventory_status(quantity, reserved_qty)
      `)
      .eq('is_active', true)
      .order('item_code')
    setItems(data as any || [])
  }

  const addLine = () => {
    setIssueLines([
      ...issueLines,
      {
        item_id: '',
        item_code: '',
        description: '',
        available_qty: 0,
        quantity: 1,
        unit_cost: 0,
        base_uom: '',
      },
    ])
  }

  const removeLine = (index: number) => {
    setIssueLines(issueLines.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...issueLines]
    if (field === 'item_id') {
      const item = items.find((i: any) => i.item_id === value)
      if (item) {
        const availableQty = (item as any).inventory_status?.[0]?.quantity || 0
        updated[index] = {
          ...updated[index],
          item_id: item.item_id,
          item_code: item.item_code || '',
          description: item.description || '',
          available_qty: availableQty,
          unit_cost: item.unit_cost || 0,
          base_uom: item.base_uom || '',
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setIssueLines(updated)
  }

  const handleSubmit = async () => {
    setError('')

    if (!selectedDepartment) {
      setError('Please select a department')
      return
    }

    if (issueLines.length === 0) {
      setError('Please add at least one item')
      return
    }

    // Validate quantities
    for (const line of issueLines) {
      if (!line.item_id) {
        setError('Please select an item for all lines')
        return
      }
      if (line.quantity <= 0) {
        setError('Quantity must be greater than 0')
        return
      }
      if (line.quantity > line.available_qty) {
        setError(`Insufficient stock for ${line.item_code}. Available: ${line.available_qty}`)
        return
      }
    }

    setLoading(true)

    try {
      // Create transaction header
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          transaction_type: 'ISSUE',
          transaction_date: new Date().toISOString(),
          department_id: selectedDepartment,
          created_by: user?.id,
          notes: notes || null,
        })
        .select()
        .single()

      if (txError) throw txError

      // Create transaction lines and update inventory
      for (const line of issueLines) {
        // Insert transaction line
        const { error: lineError } = await supabase.from('transaction_lines').insert({
          transaction_id: transaction.transaction_id,
          item_id: line.item_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
        })

        if (lineError) throw lineError

        // Update inventory quantity (decrease)
        const { error: invError } = await supabase.rpc('update_inventory_quantity', {
          p_item_id: line.item_id,
          p_quantity_change: -line.quantity,
        })

        // If RPC doesn't exist, update directly
        if (invError) {
          const { error: directError } = await supabase
            .from('inventory_status')
            .update({
              quantity: line.available_qty - line.quantity,
            })
            .eq('item_id', line.item_id)

          if (directError) throw directError
        }
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create issue transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select department...</option>
            {departments.map((dept) => (
              <option key={dept.dept_id} value={dept.dept_id}>
                {dept.dept_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
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
          <h3 className="text-lg font-semibold text-gray-900">Items to Issue</h3>
          <Button size="sm" onClick={addLine} variant="secondary">
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {issueLines.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-600">No items added yet. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issueLines.map((line, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg items-end"
              >
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                  <select
                    value={line.item_id}
                    onChange={(e) => updateLine(index, 'item_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select item...</option>
                    {items.map((item: any) => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_code} - {item.description} (Stock:{' '}
                        {item.inventory_status?.[0]?.quantity || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available</label>
                  <Input
                    type="text"
                    value={line.available_qty}
                    disabled
                    className="bg-white text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    max={line.available_qty}
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value))}
                    className="text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">UOM</label>
                  <Input type="text" value={line.base_uom} disabled className="bg-white text-sm" />
                </div>

                <div className="col-span-1 flex items-end">
                  <button
                    onClick={() => removeLine(index)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add any notes or comments..."
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
          {loading ? 'Processing...' : 'Create Issue Transaction'}
        </Button>
      </div>
    </div>
  )
}
