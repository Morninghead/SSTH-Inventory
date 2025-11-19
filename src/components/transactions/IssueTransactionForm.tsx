import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X, AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import SearchableItemSelector from './SearchableItemSelector'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { useStockValidation } from '../../hooks/useStockValidation'
import { createIssueTransaction } from '../../utils/transactionHelpers'
import type { Database } from '../../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type Department = Database['public']['Tables']['departments']['Row']

interface ItemWithInventory extends Item {
  inventory_status?: Array<{
    quantity: number
  }> | null
}

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
  const { t } = useLanguage()
  const { validateStock, errors: validationErrors } = useStockValidation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [items, setItems] = useState<ItemWithInventory[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [issueLines, setIssueLines] = useState<IssueLineItem[]>([])
  const [notes, setNotes] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')

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
    console.log('Loading items with inventory status...')

    // Get items first
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('item_code')

    console.log(`Found ${items?.length || 0} active items`)

    // Get inventory status separately
    const itemIds = items?.map(item => item.item_id) || []
    const { data: inventoryData } = await supabase
      .from('inventory_status')
      .select('item_id, quantity')
      .in('item_id', itemIds)

    console.log(`Found ${inventoryData?.length || 0} inventory status records`)

    // Group inventory status by item_id
    const inventoryByItem: { [key: string]: { quantity: number }[] } = {}
    inventoryData?.forEach(inv => {
      if (!inventoryByItem[inv.item_id]) {
        inventoryByItem[inv.item_id] = []
      }
      inventoryByItem[inv.item_id].push({ quantity: inv.quantity })
    })

    // Log some examples for debugging
    Object.entries(inventoryByItem).slice(0, 5).forEach(([itemId, records]) => {
      const totalQty = records.reduce((sum, r) => sum + r.quantity, 0)
      console.log(`Item ${itemId}: ${records.length} record(s), total quantity: ${totalQty}`)
    })

    // Merge items with inventory status
    const itemsWithInventory = items?.map(item => ({
      ...item,
      inventory_status: inventoryByItem[item.item_id] || []
    }))

    setItems(itemsWithInventory as ItemWithInventory[])
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
      const item = items.find((i) => i.item_id === value)
      if (item) {
        const availableQty = item.inventory_status?.[0]?.quantity || 0
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

    // Validation
    if (!selectedDepartment) {
      setError('Please select a department')
      return
    }

    if (issueLines.length === 0) {
      setError('Please add at least one item')
      return
    }

    // Validate line items
    for (const line of issueLines) {
      if (!line.item_id) {
        setError('Please select an item for all lines')
        return
      }
      if (line.quantity <= 0) {
        setError('Quantity must be greater than 0')
        return
      }
    }

    setLoading(true)

    try {
      // Validate stock availability using the hook
      const stockChecks = issueLines.map(line => ({
        itemId: line.item_id,
        quantity: line.quantity
      }))

      const validationResults = await validateStock(stockChecks)

      // Check if any items have insufficient stock
      const insufficientStock = validationResults.filter(r => !r.available)
      if (insufficientStock.length > 0) {
        setError('Some items have insufficient stock. Check the warnings below.')
        setLoading(false)
        return
      }

      // Prepare items for processing
      const itemsToProcess = issueLines.map(line => ({
        item_id: line.item_id,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        notes: null
      }))

      // Try using database function first (more robust)
      let transactionSuccessful = false
      let errorMessage = ''

      try {
        const { data, error: txError } = await supabase
          .rpc('process_transaction' as any, {
            p_transaction_type: 'ISSUE',
            p_department_id: selectedDepartment,
            p_supplier_id: null,
            p_reference_number: referenceNumber || null,
            p_notes: notes || null,
            p_items: itemsToProcess as any,
            p_created_by: user?.id
          })

        if (txError) throw txError

        const result = data as any
        if (result && Array.isArray(result) && result.length > 0 && result[0].success) {
          transactionSuccessful = true
        } else {
          throw new Error(result?.[0]?.message || 'Failed to process transaction')
        }
      } catch (dbFunctionError: any) {
        console.log('Database function failed, trying client-side implementation:', dbFunctionError.message)

        // Fallback to client-side implementation
        const fallbackResult = await createIssueTransaction(
          selectedDepartment,
          itemsToProcess,
          referenceNumber,
          notes,
          user?.id
        )

        if (fallbackResult.success) {
          transactionSuccessful = true
        } else {
          errorMessage = fallbackResult.error || 'Failed to process transaction'
        }
      }

      if (transactionSuccessful) {
        onSuccess()
      } else {
        setError(errorMessage || 'Failed to create issue transaction')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create issue transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('department')} <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('selectDepartment')}</option>
            {departments.map((dept) => (
              <option key={dept.dept_id} value={dept.dept_id}>
                {dept.dept_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('referenceNumber')}</label>
          <Input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="REF-001 {t('optional')}"
          />
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
                  <SearchableItemSelector
                    items={items}
                    value={line.item_id}
                    onChange={(value) => updateLine(index, 'item_id', value)}
                    placeholder="Search items by code or description..."
                    showStock={true}
                  />
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

      {/* Stock Validation Warnings */}
      {validationErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Stock Warnings</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
