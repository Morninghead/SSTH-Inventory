import { useState, useEffect } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'
import type { Database } from '../../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type SupplierItem = Database['public']['Tables']['supplier_items']['Row'] & {
  items?: Item
}

interface VendorItemsManagerProps {
  supplierId: string
}

export default function VendorItemsManager({ supplierId }: VendorItemsManagerProps) {
  const { t } = useI18n()
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  
  // Form state
  const [selectedItemId, setSelectedItemId] = useState('')
  const [supplierSku, setSupplierSku] = useState('')
  const [supplierPrice, setSupplierPrice] = useState('')
  const [leadTime, setLeadTime] = useState('')
  
  useEffect(() => {
    loadData()
  }, [supplierId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [suppItemsRes, allItemsRes] = await Promise.all([
        supabase
          .from('supplier_items')
          .select('*, items(*)')
          .eq('supplier_id', supplierId)
          .eq('is_active', true),
        supabase
          .from('items')
          .select('*')
          .eq('is_active', true)
          .order('item_code')
      ])

      if (suppItemsRes.error) throw suppItemsRes.error
      if (allItemsRes.error) throw allItemsRes.error

      setSupplierItems(suppItemsRes.data as any || [])
      setAllItems(allItemsRes.data || [])
    } catch (error) {
      console.error('Error loading supplier items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!selectedItemId) return

    try {
      const { error } = await supabase
        .from('supplier_items')
        .insert({
          supplier_id: supplierId,
          item_id: selectedItemId,
          supplier_sku: supplierSku || null,
          supplier_price: supplierPrice ? parseFloat(supplierPrice) : null,
          lead_time_days: leadTime ? parseInt(leadTime) : null,
          is_active: true
        })

      if (error) throw error
      
      // Reset form and reload
      setIsAdding(false)
      setSelectedItemId('')
      setSupplierSku('')
      setSupplierPrice('')
      setLeadTime('')
      loadData()
    } catch (error) {
      console.error('Error adding supplier item:', error)
      alert(t('common.error'))
    }
  }

  const handleRemoveItem = async (supplierItemId: string) => {
    if (!window.confirm(t('common.confirmDelete'))) return

    try {
      const { error } = await supabase
        .from('supplier_items')
        .update({ is_active: false })
        .eq('supplier_item_id', supplierItemId)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error removing supplier item:', error)
    }
  }

  const availableItems = allItems.filter(
    item => !supplierItems.some(si => si.item_id === item.item_id)
  )

  if (loading) return <div className="p-4 text-center">{t('common.loading')}...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">{t('vendors.suppliedItems')}</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {t('vendors.linkItem')}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.item')}
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">{t('common.select')}</option>
                {availableItems.map(item => (
                  <option key={item.item_id} value={item.item_id}>
                    {item.item_code} - {item.description}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t('vendors.supplierSku')}
              value={supplierSku}
              onChange={(e) => setSupplierSku(e.target.value)}
              placeholder="e.g. V-12345"
            />
            <Input
              label={t('vendors.supplierPrice')}
              type="number"
              min="0"
              step="0.01"
              value={supplierPrice}
              onChange={(e) => setSupplierPrice(e.target.value)}
            />
            <Input
              label={t('vendors.leadTimeDays')}
              type="number"
              min="0"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAdding(false)} size="sm">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddItem} disabled={!selectedItemId} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('inventory.itemCode')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('inventory.description')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('vendors.supplierSku')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('vendors.supplierPrice')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {supplierItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 text-sm">
                  {t('vendors.noItemsLinked')}
                </td>
              </tr>
            ) : (
              supplierItems.map((si) => (
                <tr key={si.supplier_item_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {si.items?.item_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {si.items?.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {si.supplier_sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {si.supplier_price ? si.supplier_price.toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <button
                      onClick={() => handleRemoveItem(si.supplier_item_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
