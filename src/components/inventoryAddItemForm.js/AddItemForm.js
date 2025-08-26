import React, { useState } from 'react'
import { supabase, UNITS } from '../../services/supabase'
import { useAuth } from '../auth/AuthProvider'
import { Upload, Save, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AddItemForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: 0,
    unit: 'EA',
    reorder_level: 0,
    location: '',
    supplier: '',
    cost: '',
    price: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if SKU already exists
      const { data: existing } = await supabase
        .from('inventory_items')
        .select('sku')
        .eq('sku', formData.sku)
        .single()

      if (existing) {
        toast.error('SKU นี้มีอยู่ในระบบแล้ว')
        setLoading(false)
        return
      }

      // Insert new item
      const { error } = await supabase
        .from('inventory_items')
        .insert([{
          ...formData,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          quantity: parseFloat(formData.quantity),
          reorder_level: parseFloat(formData.reorder_level)
        }])

      if (error) throw error

      // Log transaction
      await supabase
        .from('transactions')
        .insert([{
          type: 'RESTOCK',
          sku: formData.sku,
          item_name: formData.name,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          department: user?.user_metadata?.department || 'Admin',
          user_email: user?.email,
          user_name: `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim(),
          reference: 'สร้างสินค้าใหม่',
          notes: `สร้างสินค้าใหม่: ${formData.name}`
        }])

      toast.success('เพิ่มสินค้าสำเร็จ!')
      
      // Reset form
      setFormData({
        sku: '',
        name: '',
        category: '',
        quantity: 0,
        unit: 'EA',
        reorder_level: 0,
        location: '',
        supplier: '',
        cost: '',
        price: '',
        notes: ''
      })

    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    setFormData({ ...formData, sku: `SKU${timestamp}${random}` })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มสินค้าใหม่</h1>
          <p className="text-gray-600 mt-1">กรอกข้อมูลสินค้าที่ต้องการเพิ่มเข้าระบบ</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* SKU and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น PROD001"
                  required
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อสินค้า *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ชื่อสินค้า"
                required
              />
            </div>
          </div>

          {/* Category and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น อุปกรณ์คอมพิวเตอร์"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ตำแหน่งจัดเก็บ
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น ชั้น A1-01"
              />
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนเริ่มต้น *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หน่วยนับ
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จุดสั่งซื้อใหม่
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.reorder_level}
                onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เมื่อเหลือเท่าไร ให้แจ้งเตือน"
              />
            </div>
          </div>

          {/* Supplier and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ผู้จัดจำหน่าย
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ชื่อบริษัทหรือผู้จัดจำหน่าย"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคาต้นทุน (บาท)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคาขาย (บาท)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="รายละเอียดเพิ่มเติม..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setFormData({
                sku: '', name: '', category: '', quantity: 0, unit: 'EA',
                reorder_level: 0, location: '', supplier: '', cost: '', price: '', notes: ''
              })}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ล้างข้อมูล
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
