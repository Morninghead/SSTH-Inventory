import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import SearchableItemSelector from './SearchableItemSelector'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Database } from '../../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type Supplier = Database['public']['Tables']['suppliers']['Row']
type PurchaseOrder = Database['public']['Tables']['purchase_order']['Row']

interface ReceiveTransactionFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface ReceiveLineItem {
  item_id: string
  item_code: string
  description: string
  quantity: number
  unit_cost: number
  base_uom: string
  line_total: number
}

export default function ReceiveTransactionForm({ onSuccess, onCancel }: ReceiveTransactionFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [selectedPO, setSelectedPO] = useState('')
  const [receiveLines, setReceiveLines] = useState<ReceiveLineItem[]>([])
  const [notes, setNotes] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')

  useEffect(() => {
    loadSuppliers()
    loadItems()
    loadPurchaseOrders()
  }, [])

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

  const loadPurchaseOrders = async () => {
    const { data } = await supabase
      .from('purchase_order')
      .select('*')
      .in('status', ['SUBMITTED', 'APPROVED'])
      .order('po_date', { ascending: false })
    setPurchaseOrders(data || [])
  }

  const addLine = () => {
    setReceiveLines([
      ...receiveLines,
      {
        item_id: '',
        item_code: '',
        description: '',
        quantity: 1,
        unit_cost: 0,
        base_uom: '',
        line_total: 0,
      },
    ])
  }

  const removeLine = (index: number) => {
    setReceiveLines(receiveLines.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...receiveLines]
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
          line_total: updated[index].quantity * (item.unit_cost || 0),
        }
      }
    } else if (field === 'quantity') {
      updated[index] = {
        ...updated[index],
        quantity: value,
        line_total: value * updated[index].unit_cost,
      }
    } else if (field === 'unit_cost') {
      updated[index] = {
        ...updated[index],
        unit_cost: value,
        line_total: updated[index].quantity * value,
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setReceiveLines(updated)
  }

  const handleSubmit = async () => {
    setError('')

    // Validation
    if (!selectedSupplier) {
      setError('Please select a supplier')
      return
    }

    if (receiveLines.length === 0) {
      setError('Please add at least one item')
      return
    }

    // Validate line items
    for (const line of receiveLines) {
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
      // Prepare items for the database function
      const itemsToProcess = receiveLines.map(line => ({
        item_id: line.item_id,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        notes: null
      }))

      // Call the database function to process the transaction
      const { data, error: txError } = await supabase
        .rpc('process_transaction' as any, {
          p_transaction_type: 'RECEIVE',
          p_department_id: null,
          p_supplier_id: selectedSupplier,
          p_reference_number: referenceNumber || selectedPO || null,
          p_notes: notes || null,
          p_items: itemsToProcess as any,
          p_created_by: user?.id
        })

      if (txError) throw txError

      const result = data as any
      if (result && Array.isArray(result) && result.length > 0 && result[0].success) {
        // If linked to PO, update PO status
        if (selectedPO) {
          const { error: poError } = await supabase
            .from('purchase_order')
            .update({ status: 'RECEIVED' })
            .eq('po_id', selectedPO)

          if (poError) console.error('Failed to update PO status:', poError)
        }

        onSuccess()
      } else {
        throw new Error(result?.[0]?.message || 'Failed to process transaction')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create receive transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supplier <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            Purchase Order (Optional)
          </label>
          <select
            value={selectedPO}
            onChange={(e) => setSelectedPO(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No PO / Direct Receive</option>
            {purchaseOrders.map((po: any) => (
              <option key={po.po_id} value={po.po_id}>
                {po.po_number || po.po_id} - {po.status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
          <Input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="INV-001 (optional)"
          />
        </div>
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

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Items to Receive</h3>
          <Button size="sm" onClick={addLine} variant="secondary">
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {receiveLines.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-600">No items added yet. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                {receiveLines.map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <SearchableItemSelector
                        items={items.map(item => ({ ...item, inventory_status: [] }))}
                        value={line.item_id}
                        onChange={(value) => updateLine(index, 'item_id', value)}
                        placeholder="Search items..."
                        showStock={false}
                        className="min-w-64"
                      />
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
                    Total:
                  </td>
                  <td className="px-4 py-3 font-bold text-lg text-gray-900">
                    ฿{receiveLines.reduce((sum, line) => sum + line.line_total, 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
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
          {loading ? 'Processing...' : 'Create Receive Transaction'}
        </Button>
      </div>
    </div>
  )
}
