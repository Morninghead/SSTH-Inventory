import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

type Item = Database['public']['Tables']['items']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  item?: Item | null
}

export default function ItemFormModal({ isOpen, onClose, onSuccess, item }: ItemFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    item_code: '',
    description: '',
    category_id: '',
    base_uom: 'PCS',
    unit_cost: '',
    reorder_level: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      if (item) {
        // Edit mode - populate form
        setFormData({
          item_code: item.item_code || '',
          description: item.description || '',
          category_id: item.category_id || '',
          base_uom: item.base_uom || 'PCS',
          unit_cost: item.unit_cost?.toString() || '',
          reorder_level: item.reorder_level?.toString() || '',
        })
      } else {
        // Create mode - reset form
        setFormData({
          item_code: '',
          description: '',
          category_id: '',
          base_uom: 'PCS',
          unit_cost: '',
          reorder_level: '',
        })
      }
      setError('')
    }
  }, [isOpen, item])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const itemData = {
        item_code: formData.item_code.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id || null,
        base_uom: formData.base_uom,
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
        reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : null,
        is_active: true,
      }

      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('item_id', item.item_id)

        if (error) throw error
      } else {
        // Create new item
        const { data: newItem, error: insertError } = await supabase
          .from('items')
          .insert(itemData)
          .select()
          .single()

        if (insertError) throw insertError

        // Create initial inventory status
        if (newItem) {
          const { error: statusError } = await supabase
            .from('inventory_status')
            .insert({
              item_id: newItem.item_id,
              quantity: 0,
              reserved_qty: 0,
            })

          if (statusError) throw statusError
        }
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Item' : 'Create New Item'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Item Code"
            name="item_code"
            value={formData.item_code}
            onChange={handleChange}
            required
            placeholder="e.g., ABC-001"
            disabled={!!item} // Can't change item code when editing
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Enter item description"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Base UOM"
            name="base_uom"
            value={formData.base_uom}
            onChange={handleChange}
            required
            placeholder="e.g., PCS, KG, LTR"
          />

          <Input
            label="Unit Cost"
            name="unit_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_cost}
            onChange={handleChange}
            placeholder="0.00"
          />

          <Input
            label="Reorder Level"
            name="reorder_level"
            type="number"
            step="1"
            min="0"
            value={formData.reorder_level}
            onChange={handleChange}
            placeholder="0"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          }
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-4 border-t gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
