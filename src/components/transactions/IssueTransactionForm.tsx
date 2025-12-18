import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X, AlertTriangle, Layers } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import SearchableItemSelector from './SearchableItemSelector'
import BulkItemSelectorModal from './BulkItemSelectorModal'
import BackorderAlertModal from './BackorderAlertModal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../i18n/I18nProvider'
import { useStockValidation } from '../../hooks/useStockValidation'
import { createIssueTransaction, createBackorderTransaction } from '../../utils/transactionHelpers'
import { generateTransactionNumber } from '../../utils/transactionNumber'
import notificationService from '../../services/notificationService'
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
  allow_backorder?: boolean
}

interface BackorderItem {
  item_code: string
  description: string
  requested_qty: number
  available_qty: number
  backorder_qty: number
}

export default function IssueTransactionForm({ onSuccess, onCancel }: IssueTransactionFormProps) {
  const { user, profile } = useAuth()
  const { t, language } = useI18n()
  const { validateStock, errors: validationErrors } = useStockValidation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [items, setItems] = useState<ItemWithInventory[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [issueLines, setIssueLines] = useState<IssueLineItem[]>([])
  const [notes, setNotes] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [showBackorderAlert, setShowBackorderAlert] = useState(false)
  const [backorderItems, setBackorderItems] = useState<BackorderItem[]>([])
  const [pendingTransaction, setPendingTransaction] = useState<any>(null)

  useEffect(() => {
    loadDepartments()
    loadItems()
    generateAutoReferenceNumber()
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
    // Get items first
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('item_code')

    // Get inventory status separately
    const itemIds = items?.map(item => item.item_id).filter((id): id is string => Boolean(id)) || []
    const { data: inventoryData } = await supabase
      .from('inventory_status')
      .select('item_id, quantity')
      .in('item_id', itemIds)

    // Group inventory status by item_id
    const inventoryByItem: { [key: string]: { quantity: number }[] } = {}
    inventoryData?.forEach(inv => {
      if (!inventoryByItem[inv.item_id]) {
        inventoryByItem[inv.item_id] = []
      }
      inventoryByItem[inv.item_id].push({ quantity: inv.quantity || 0 })
    })


    // Merge items with inventory status
    const itemsWithInventory = items?.map(item => ({
      ...item,
      inventory_status: inventoryByItem[item.item_id] || []
    }))

    setItems(itemsWithInventory as ItemWithInventory[])
  }

  const generateAutoReferenceNumber = async () => {
    try {
      const autoRef = await generateTransactionNumber({ transactionType: 'ISSUE' })
      setReferenceNumber(autoRef)
    } catch (error) {
      console.warn('Error generating auto reference number:', error)
      // Fallback to timestamp
      setReferenceNumber(`ISU-${Date.now()}`)
    }
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

  const handleBulkSelect = (selectedItems: ItemWithInventory[]) => {
    const newLines = selectedItems.map(item => ({
      item_id: item.item_id,
      item_code: item.item_code,
      description: item.description || '',
      available_qty: item.inventory_status?.[0]?.quantity || 0,
      quantity: 1,
      unit_cost: item.unit_cost || 0,
      base_uom: item.base_uom || ''
    }))

    setIssueLines([...issueLines, ...newLines])
  }

  const handleSubmit = async () => {
    setError('')

    // Validation
    if (!selectedDepartment) {
      setError(language === 'th' ? 'กรุณาเลือกแผนก' : 'Please select a department')
      return
    }

    if (issueLines.length === 0) {
      setError(language === 'th' ? 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ' : 'Please add at least one item')
      return
    }

    // Validate line items
    for (const line of issueLines) {
      if (!line.item_id) {
        setError(language === 'th' ? 'กรุณาเลือกสินค้าให้ครบทุกรายการ' : 'Please select an item for all lines')
        return
      }
      if (line.quantity <= 0) {
        setError(language === 'th' ? 'จำนวนต้องมากกว่า 0' : 'Quantity must be greater than 0')
        return
      }
    }

    setLoading(true)

    try {
      console.log('🔍 Starting handleSubmit with issueLines:', issueLines)

      // Validate stock availability using the hook
      const stockChecks = issueLines.map(line => ({
        itemId: line.item_id,
        quantity: line.quantity
      }))

      console.log('🔍 Stock checks prepared:', stockChecks)

      const validationResults = await validateStock(stockChecks)

      console.log('🔍 Stock validation results:', validationResults)

      // Check if any items have insufficient stock and prepare backorder items
      const insufficientStock = validationResults.filter(r => !r.available)

      console.log('🔍 Insufficient stock items:', insufficientStock)

      if (insufficientStock.length > 0) {
        console.log('🔍 Showing backorder alert for', insufficientStock.length, 'items')

        // Prepare backorder items list for the popup
        const backorderData: BackorderItem[] = []

        for (const insufficientItem of insufficientStock) {
          const lineItem = issueLines.find(line => line.item_id === insufficientItem.itemId)
          console.log('🔍 Processing insufficient item:', insufficientItem, 'lineItem:', lineItem)

          if (lineItem) {
            const backorderQty = lineItem.quantity - insufficientItem.currentQuantity
            backorderData.push({
              item_code: lineItem.item_code,
              description: lineItem.description,
              requested_qty: lineItem.quantity,
              available_qty: insufficientItem.currentQuantity,
              backorder_qty: backorderQty
            })
          }
        }

        console.log('🔍 Backorder data prepared:', backorderData)

        // Set backorder items and show alert
        setBackorderItems(backorderData)

        // Prepare transaction data for when user confirms
        const transactionData = {
          itemsToProcess: issueLines.map(line => ({
            item_id: line.item_id,
            quantity: line.quantity,
            unit_cost: line.unit_cost,
            notes: null
          })),
          insufficientStockItems: insufficientStock
        }

        setPendingTransaction(transactionData)
        setShowBackorderAlert(true)
        setLoading(false)
        return
      } else {
        console.log('🔍 No insufficient stock items, proceeding normally')
      }

      // No insufficient stock items, process normally
      const itemsToProcess = issueLines.map(line => ({
        item_id: line.item_id,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        notes: null
      }))

      await processTransactionWithBackorder(itemsToProcess, [], false)
    } catch (err: any) {
      setError(err.message || 'Failed to create issue transaction')
    } finally {
      setLoading(false)
    }
  }

  const processTransactionWithBackorder = async (itemsToProcess: any[], insufficientStockItems: any[], isBackorder: boolean = false) => {
    console.log('🔍 processTransactionWithBackorder called with items:', itemsToProcess, 'insufficientStockItems:', insufficientStockItems)
    try {
      // Try using database function first (more robust)
      let transactionSuccessful = false
      let errorMessage = ''
      let referenceNumberUsed = referenceNumber

      // Generate appropriate reference number based on transaction type
      if (isBackorder) {
        referenceNumberUsed = await generateTransactionNumber({ transactionType: 'BACKORDER' })
      }

      try {
        const { data, error: txError } = await supabase
          .rpc('process_transaction' as any, {
            p_transaction_type: isBackorder ? 'BACKORDER' : 'ISSUE',
            p_department_id: selectedDepartment,
            p_supplier_id: null,
            p_reference_number: referenceNumberUsed || null,
            p_notes: notes || null,
            p_items: itemsToProcess as any,
            p_created_by: user?.id
          })

        if (txError) throw txError

        const result = data as any
        if (result && Array.isArray(result) && result.length > 0 && result[0].success) {
          transactionSuccessful = true
          referenceNumberUsed = result[0].reference_number || referenceNumber
        } else {
          throw new Error(result?.[0]?.message || 'Failed to process transaction')
        }
      } catch (dbFunctionError: any) {
        // Database function failed, trying client-side implementation
        const fallbackResult = isBackorder
          ? await createBackorderTransaction(
            selectedDepartment,
            itemsToProcess,
            referenceNumberUsed,
            notes
          )
          : await createIssueTransaction(
            selectedDepartment,
            itemsToProcess,
            referenceNumberUsed,
            notes
          )

        if (fallbackResult.success) {
          transactionSuccessful = true
        } else {
          errorMessage = fallbackResult.error || 'Failed to process transaction'
        }
      }

      if (transactionSuccessful) {
        // Create backorders for insufficient stock items
        for (const insufficientItem of insufficientStockItems) {
          const lineItem = issueLines.find(line => line.item_id === insufficientItem.itemId)
          if (lineItem && insufficientItem.currentQuantity < lineItem.quantity) {
            const backorderQty = lineItem.quantity - insufficientItem.currentQuantity

            if (backorderQty > 0) {
              try {
                await supabase.from('backorders').insert({
                  backorder_id: crypto.randomUUID(),
                  item_id: insufficientItem.itemId,
                  department_id: selectedDepartment,
                  quantity: backorderQty,
                  status: 'PENDING',
                  notes: `Auto-created from issue transaction ${referenceNumberUsed}`,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
              } catch (backorderError) {
                console.error('Failed to create backorder:', backorderError)
              }
            }
          }
        }

        // Send notification
        try {
          await notificationService.sendTransactionNotification(
            referenceNumberUsed || 'Unknown',
            'ISSUE',
            selectedDepartment,
            profile?.full_name || 'Unknown',
            language
          )
        } catch (notificationError) {
          console.log('Notification failed but transaction succeeded:', notificationError)
        }

        onSuccess()
      } else {
        setError(errorMessage || 'Failed to create issue transaction')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create issue transaction')
    }
  }

  const handleBackorderConfirm = async () => {
    console.log('🔍 handleBackorderConfirm called with pendingTransaction:', pendingTransaction)
    setShowBackorderAlert(false)
    setLoading(true)

    if (pendingTransaction) {
      await processTransactionWithBackorder(
        pendingTransaction.itemsToProcess,
        pendingTransaction.insufficientStockItems,
        true // This is a backorder transaction
      )
    }

    setLoading(false)
    setPendingTransaction(null)
    setBackorderItems([])
  }

  const handleBackorderCancel = () => {
    setShowBackorderAlert(false)
    setPendingTransaction(null)
    setBackorderItems([])
    setError(language === 'th' ? 'ยกเลิกการทำรายการเนื่องจากสินค้าไม่เพียงพอ' : 'Transaction cancelled due to insufficient stock')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('department.selectDepartment')} <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('department.selectDepartment')}</option>
            {departments.map((dept) => (
              <option key={dept.dept_id} value={dept.dept_id}>
                {dept.dept_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('referenceNumber')}
            <span className="text-xs text-green-600 ml-2 font-normal">(Auto-generated)</span>
          </label>
          <Input
            type="text"
            value={referenceNumber}
            disabled
            className="bg-green-50 border-green-200"
          />
          <p className="text-xs text-gray-500 mt-1">Format: ISU-YYYYMMDDXXXX (auto-incremented)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('transactions.issueForm.transactionDate')}</label>
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
          <h3 className="text-lg font-semibold text-gray-900">{t('transactions.issueForm.itemsToIssue')}</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setIsBulkModalOpen(true)} variant="outline">
              <Layers className="w-4 h-4 mr-1" />
              {t('transactions.issueForm.bulkAdd')}
            </Button>
            <Button size="sm" onClick={addLine} variant="secondary">
              <Plus className="w-4 h-4 mr-1" />
              {t('transactions.issueForm.addItem')}
            </Button>
          </div>
        </div>

        {issueLines.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-600">{t('transactions.issueForm.noItemsAddedYet')}</p>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('transactions.issueForm.notesOptional')}</label>
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
          {t('transactions.issueForm.cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? t('transactions.issueForm.processing') : t('transactions.issueForm.createIssueTransaction')}
        </Button>
      </div>

      <BulkItemSelectorModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSelect={handleBulkSelect}
        items={items}
      />

      <BackorderAlertModal
        isOpen={showBackorderAlert}
        onClose={handleBackorderCancel}
        onConfirm={handleBackorderConfirm}
        backorderItems={backorderItems}
        language={language}
      />
    </div>
  )
}
