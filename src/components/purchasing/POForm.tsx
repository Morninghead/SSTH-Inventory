import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Database } from '../../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type Supplier = Database['public']['Tables']['suppliers']['Row']

interface POFormProps {
  onSuccess: () => void
  onCancel: () => void
  poId?: string // For editing existing PO
}

interface POLineItem {
  item_id: string
  item_code: string
  description: string
  quantity: number
  unit_cost: number
  base_uom: string
  line_total: number
  notes?: string
}

export default function POForm({ onSuccess, onCancel, poId }: POFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [poLines, setPoLines] = useState<POLineItem[]>([])
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    loadSuppliers()
    loadItems()
    if (poId) {
      loadPO()
    }
  }, [poId])

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('supplier_name')
    setSuppliers(data || [])
  }

  const loadItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('item_code')
    setItems(data || [])
  }

  const loadPO = async () => {
    if (!poId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_order_details' as any, { p_po_id: poId })

      if (error) throw error

      const poData = data?.[0] as any
      if (poData) {
        setIsEditMode(true)
        setSelectedSupplier(poData.supplier_id)
        setPoDate(poData.po_date.split('T')[0])
        setDeliveryDate(poData.delivery_date ? poData.delivery_date.split('T')[0] : '')
        setNotes(poData.notes || '')

        // Load line items
        const lineItems = poData.line_items || []
        setPoLines(lineItems.map((line: any) => ({
          item_id: line.item_id,
          item_code: line.item_code,
          description: line.description,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          base_uom: items.find(i => i.item_id === line.item_id)?.base_uom || 'PCS',
          line_total: line.line_total,
          notes: line.notes
        })))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase order')
    } finally {
      setLoading(false)
    }
  }

  const addLine = () => {
    setPoLines([
      ...poLines,
      {
        item_id: '',
        item_code: '',
        description: '',
        quantity: 1,
        unit_cost: 0,
        base_uom: '',
        line_total: 0,
        notes: ''
      }
    ])
  }

  const removeLine = (index: number) => {
    setPoLines(poLines.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...poLines]
    if (field === 'item_id') {
      const item = items.find((i) => i.item_id === value)
      if (item) {
        updated[index] = {
          ...updated[index],
          item_id: item.item_id,
          item_code: item.item_code || '',
          description: item.description || '',
          unit_cost: item.unit_cost || 0,
          base_uom: item.base_uom || '',
          line_total: updated[index].quantity * (item.unit_cost || 0)
        }
      }
    } else if (field === 'quantity') {
      updated[index] = {
        ...updated[index],
        quantity: value,
        line_total: value * updated[index].unit_cost
      }
    } else if (field === 'unit_cost') {
      updated[index] = {
        ...updated[index],
        unit_cost: value,
        line_total: updated[index].quantity * value
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setPoLines(updated)
  }

  const handleSubmit = async () => {
    setError('')

    // Validation
    if (!selectedSupplier) {
      setError('Please select a supplier')
      return
    }

    if (poLines.length === 0) {
      setError('Please add at least one item')
      return
    }

    // Validate line items
    for (const line of poLines) {
      if (!line.item_id) {
        setError('Please select an item for all lines')
        return
      }
      if (line.quantity <= 0) {
        setError('Quantity must be greater than 0')
        return
      }
      if (line.unit_cost < 0) {
        setError('Unit cost must be 0 or greater')
        return
      }
    }

    setLoading(true)

    try {
      if (isEditMode && poId) {
        // Update existing PO
        const itemsToUpdate = poLines.map(line => ({
          item_id: line.item_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          notes: line.notes || null
        }))

        const { data, error: updateError } = await supabase
          .rpc('update_po_line_items' as any, {
            p_po_id: poId,
            p_items: itemsToUpdate as any,
            p_updated_by: user?.id
          })

        if (updateError) throw updateError

        const result = data as any
        if (!result?.[0]?.success) {
          throw new Error(result?.[0]?.message || 'Failed to update purchase order')
        }

        onSuccess()
      } else {
        // Create new PO
        const itemsToCreate = poLines.map(line => ({
          item_id: line.item_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          notes: line.notes || null
        }))

        const { data, error: createError } = await supabase
          .rpc('create_purchase_order' as any, {
            p_supplier_id: selectedSupplier,
            p_po_date: new Date(poDate).toISOString(),
            p_delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
            p_notes: notes || null,
            p_items: itemsToCreate as any,
            p_created_by: user?.id
          })

        if (createError) throw createError

        const result = data as any
        if (!result?.[0]?.success) {
          throw new Error(result?.[0]?.message || 'Failed to create purchase order')
        }

        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save purchase order')
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = poLines.reduce((sum, line) => sum + line.line_total, 0)

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-1">
          {isEditMode ? 'Edit Purchase Order' : 'Create New Purchase Order'}
        </h3>
        <p className="text-sm text-blue-700">
          {isEditMode
            ? 'Update line items for this purchase order'
            : 'Fill in the details to create a new purchase order for supplier approval'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supplier <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            disabled={isEditMode}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select supplier...</option>
            {suppliers.map((supplier) => (
              <option key={supplier.supplier_id} value={supplier.supplier_id}>
                {supplier.supplier_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PO Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={poDate}
            onChange={(e) => setPoDate(e.target.value)}
            disabled={isEditMode}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
          <Input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            disabled={isEditMode}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
          <Button size="sm" onClick={addLine} variant="secondary">
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {poLines.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-600">No items added yet. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost (THB)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Line Total (THB)</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {poLines.map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <select
                        value={line.item_id}
                        onChange={(e) => updateLine(index, 'item_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[250px]"
                      >
                        <option value="">Select item...</option>
                        {items.map((item) => (
                          <option key={item.item_id} value={item.item_id}>
                            {item.item_code} - {item.description}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="text-sm w-24"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{line.base_uom || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unit_cost}
                        onChange={(e) => updateLine(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                        className="text-sm w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        ฿{line.line_total.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeLine(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-900">
                    Total Amount:
                  </td>
                  <td className="px-4 py-3 font-bold text-lg text-blue-600">
                    ฿{totalAmount.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isEditMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add any notes or special instructions..."
          />
        </div>
      )}

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
          {loading ? 'Saving...' : isEditMode ? 'Update Purchase Order' : 'Create Purchase Order'}
        </Button>
      </div>
    </div>
  )
}
