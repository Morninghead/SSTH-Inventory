import { useState, useEffect } from 'react'
import { Trash2, Save, X, Calculator, Building2, Receipt } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Database } from '../../types/database.types'
import { useI18n } from '../../i18n'

type Item = Database['public']['Tables']['items']['Row']
type Vendor = Database['public']['Tables']['suppliers']['Row']

interface POLineItem {
  item_id: string
  item_code: string
  description: string
  quantity: number
  unit_price: number
  vat_rate: number
  line_total: number
  vat_amount: number
  base_uom: string
  notes?: string
}

interface POFormProps {
  onSuccess: () => void
  onCancel: () => void
  poId?: string // For editing existing PO
}

export default function EnhancedPOForm({ onSuccess, onCancel, poId }: POFormProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState<Vendor[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [supplierVATRate, setSupplierVATRate] = useState(7.00)
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [poLines, setPoLines] = useState<POLineItem[]>([])
  const [isEditMode, setIsEditMode] = useState(false)

  // Calculated totals
  const subtotal = poLines.reduce((sum, line) => sum + line.line_total, 0)
  const totalVAT = poLines.reduce((sum, line) => sum + line.vat_amount, 0)
  const totalAmount = subtotal + totalVAT

  useEffect(() => {
    loadVendors()
    loadItems()
    if (poId) {
      loadPO()
    }
  }, [poId])

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*, supplier_categories(category_name)')
        .eq('is_active', true)
        .order('supplier_name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, categories(category_name)')
        .eq('is_active', true)
        .order('description')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading items:', error)
    }
  }

  const loadPO = async () => {
    if (!poId) return

    try {
      // Load PO header
      const { data: po, error: poError } = await supabase
        .from('purchase_order')
        .select('*')
        .eq('po_id', poId)
        .single()

      if (poError) throw poError

      // Load PO lines with item details
      const { data: lines, error: linesError } = await supabase
        .from('purchase_order_line')
        .select('*, items(item_code, description, base_uom)')
        .eq('po_id', poId)

      if (linesError) throw linesError

      // Set form data
      setSelectedSupplier(po.supplier_id || '')
      setPoDate(po.po_date || new Date().toISOString().split('T')[0])
      setDeliveryDate(po.expected_date || '')
      setNotes(po.notes || '')

      // Convert PO lines to our format
      const formattedLines: POLineItem[] = lines?.map(line => ({
        item_id: line.item_id,
        item_code: line.items?.item_code || '',
        description: line.items?.description || '',
        quantity: line.quantity,
        unit_price: line.unit_cost || 0,
        vat_rate: 7.00, // Default VAT rate
        line_total: line.quantity * (line.unit_cost || 0),
        vat_amount: line.quantity * (line.unit_cost || 0) * 0.07, // 7% VAT
        base_uom: line.items?.base_uom || '',
        notes: ''
      })) || []

      setPoLines(formattedLines)
      setIsEditMode(true)
    } catch (error) {
      console.error('Error loading PO:', error)
      setError('Failed to load purchase order')
    }
  }

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplier(supplierId)
    // Use default VAT rate of 7%
    setSupplierVATRate(7.00)
    // Update all existing lines with the new supplier VAT rate
    setPoLines(prev => prev.map(line => ({
      ...line,
      vat_rate: 7.00,
      vat_amount: line.line_total * (7.00 / 100)
    })))
  }

  const addItemToPO = (item: Item) => {
    // Check if item already exists in PO lines
    if (poLines.find(line => line.item_id === item.item_id)) {
      return
    }

    const unitPrice = 0 // Would be populated from supplier_items table
    const newLine: POLineItem = {
      item_id: item.item_id,
      item_code: item.item_code || '',
      description: item.description || '',
      quantity: 1,
      unit_price: unitPrice,
      vat_rate: supplierVATRate,
      line_total: unitPrice * 1,
      vat_amount: (unitPrice * 1) * (supplierVATRate / 100),
      base_uom: item.base_uom || '',
      notes: ''
    }

    setPoLines(prev => [...prev, newLine])
  }

  const updatePOLine = (index: number, field: keyof POLineItem, value: any) => {
    setPoLines(prev => {
      const updated = [...prev]
      const line = { ...updated[index] }

      if (field === 'quantity' || field === 'unit_price' || field === 'vat_rate') {
        (line as any)[field] = parseFloat(value) || 0
        line.line_total = line.quantity * line.unit_price
        line.vat_amount = line.line_total * (line.vat_rate / 100)
      } else if (field === 'notes') {
        line.notes = value
      }

      updated[index] = line
      return updated
    })
  }

  const removePOLine = (index: number) => {
    setPoLines(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    if (!selectedSupplier) {
      setError('Please select a vendor')
      return false
    }
    if (!poDate) {
      setError('Purchase order date is required')
      return false
    }
    if (poLines.length === 0) {
      setError('Please add at least one item to the purchase order')
      return false
    }
    for (const line of poLines) {
      if (line.quantity <= 0) {
        setError('All quantities must be greater than 0')
        return false
      }
      if (line.unit_price <= 0) {
        setError('All unit prices must be greater than 0')
        return false
      }
    }
    return true
  }

  const generatePONumber = async (): Promise<string> => {
    const { data, error } = await supabase
      .from('purchase_order')
      .select('po_number')
      .order('po_number', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error generating PO number:', error)
      return `PO-${Date.now()}`
    }

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastPO = data[0].po_number
      const match = lastPO.match(/PO-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    return `PO-${nextNumber.toString().padStart(5, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    if (!user) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Generate PO number
      const poNumber = await generatePONumber()

      // Create PO header with all required fields
      const poData = {
        po_number: poNumber,
        created_by: user.id,
        supplier_id: selectedSupplier,
        po_date: poDate,
        expected_date: deliveryDate || null,
        notes: notes,
        subtotal_amount: subtotal,
        vat_amount: totalVAT,
        total_amount: totalAmount,
        vat_rate: supplierVATRate,
        status: 'DRAFT'
      }

      const { data: poResult, error: poError } = await supabase
        .from('purchase_order')
        .insert(poData)
        .select()
        .single()

      if (poError) throw poError

      // Create PO lines with required unit_cost field
      const lineData = poLines.map(line => ({
        po_id: poResult.po_id,
        item_id: line.item_id,
        quantity: line.quantity,
        unit_cost: line.unit_price, // unit_cost is required in the schema
        unit_price: line.unit_price,
        vat_rate: line.vat_rate,
        line_total: line.line_total
      }))

      const { error: lineError } = await supabase
        .from('purchase_order_line')
        .insert(lineData)

      if (lineError) throw lineError

      onSuccess()
    } catch (error: any) {
      console.error('Error creating PO:', error)
      setError(error.message || 'Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? t('purchasing.enhancedPoForm.editPurchaseOrder') : t('purchasing.enhancedPoForm.createPurchaseOrder')}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Vendor Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('purchasing.enhancedPoForm.vendorRequired')}
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t('purchasing.enhancedPoForm.selectVendor')}</option>
              {suppliers.map(vendor => (
                <option key={vendor.supplier_id} value={vendor.supplier_id}>
                  {vendor.supplier_code} - {vendor.supplier_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('purchasing.enhancedPoForm.poDateRequired')}
            </label>
            <Input
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('purchasing.enhancedPoForm.expectedDeliveryDate')}
            </label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
        </div>

        {/* VAT Rate Display */}
        {selectedSupplier && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-blue-900">{t('purchasing.enhancedPoForm.vatRateForVendor')}</span>
                <span className="block text-lg font-bold text-blue-900">{supplierVATRate}%</span>
              </div>
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        )}

        {/* Item Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('purchasing.enhancedPoForm.addItems')}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center text-gray-500 mb-4">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm">Select items to add to purchase order</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {items.map(item => (
                <button
                  key={item.item_id}
                  type="button"
                  onClick={() => addItemToPO(item)}
                  className="p-2 text-left border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.item_code}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {item.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PO Lines */}
        {poLines.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Purchase Order Lines</h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('purchasing.enhancedPoForm.item')}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('purchasing.enhancedPoForm.qty')}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('purchasing.enhancedPoForm.unitPrice')}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('purchasing.enhancedPoForm.vatRate')}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('purchasing.enhancedPoForm.lineTotal')}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('purchasing.enhancedPoForm.vatAmount')}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('purchasing.enhancedPoForm.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {poLines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <div className="text-sm font-medium text-gray-900">{line.item_code}</div>
                        <div className="text-xs text-gray-600">{line.description}</div>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(value) => updatePOLine(index, 'quantity', value)}
                          className="w-20"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unit_price}
                          onChange={(value) => updatePOLine(index, 'unit_price', value)}
                          className="w-24"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded">
                          <span className="text-sm">{line.vat_rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        ฿{line.line_total.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        ฿{line.vat_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removePOLine(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('purchasing.enhancedPoForm.notes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('purchasing.enhancedPoForm.notesPlaceholder')}
          />
        </div>

        {/* Totals */}
        {poLines.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{t('purchasing.enhancedPoForm.subtotal')}</span>
                <span>฿{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{t('purchasing.enhancedPoForm.vatPercentage', { rate: supplierVATRate })}</span>
                <span>฿{totalVAT.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-300">
                <span>{t('purchasing.enhancedPoForm.totalAmount')}</span>
                <span>฿{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? t('purchasing.enhancedPoForm.creating') : (isEditMode ? t('purchasing.enhancedPoForm.updatePO') : t('purchasing.enhancedPoForm.createPO'))}
          </Button>
        </div>
      </form>
    </div>
  )
}