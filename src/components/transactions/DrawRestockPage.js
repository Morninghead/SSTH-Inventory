import React, { useState, useEffect } from 'react'
import { supabase, DEPARTMENTS, UNITS, UNIT_CONVERSIONS } from '../../services/supabase'
import { useAuth } from '../auth/AuthProvider'
import { Plus, Minus, Search, ShoppingCart, Package, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DrawRestockPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('draw') // 'draw' or 'restock'
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [department, setDepartment] = useState(user?.user_metadata?.department || '')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'Active')
        .order('name')

      setItems(data || [])
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    }
  }

  const filteredItems = items.filter(item =>
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = (item) => {
    const existing = selectedItems.find(selected => selected.sku === item.sku)
    if (existing) {
      toast.error('สินค้านี้มีในรายการแล้ว')
      return
    }

    setSelectedItems([...selectedItems, {
      ...item,
      transactionQuantity: 1,
      transactionUnit: item.unit
    }])
    toast.success(`เพิ่ม ${item.name} ลงในรายการแล้ว`)
  }

  const removeFromCart = (sku) => {
    setSelectedItems(selectedItems.filter(item => item.sku !== sku))
  }

  const updateCartItem = (sku, field, value) => {
    setSelectedItems(selectedItems.map(item =>
      item.sku === sku ? { ...item, [field]: value } : item
    ))
  }

  const processTransaction = async () => {
    if (!department) {
      toast.error('กรุณาเลือกแผนก')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('กรุณาเลือกสินค้า')
      return
    }

    setLoading(true)

    try {
      const userName = `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim()

      for (const item of selectedItems) {
        const transactionQty = parseFloat(item.transactionQuantity)
        const conversionFactor = UNIT_CONVERSIONS[item.transactionUnit] || 1
        const baseQuantity = transactionQty * conversionFactor

        // Calculate new quantity
        const newQuantity = activeTab === 'draw' 
          ? item.quantity - baseQuantity
          : item.quantity + baseQuantity

        // Update inventory
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('sku', item.sku)

        if (updateError) throw updateError

        // Log transaction
        const { error: txnError } = await supabase
          .from('transactions')
          .insert([{
            type: activeTab.toUpperCase(),
            sku: item.sku,
            item_name: item.name,
            quantity: transactionQty,
            unit: item.transactionUnit,
            department,
            user_email: user?.email,
            user_name: userName,
            reference,
            notes,
            status: newQuantity >= 0 ? 'Normal' : 'Overdrawn'
          }])

        if (txnError) throw txnError

        // Create back order if overdrawn
        if (newQuantity < 0 && activeTab === 'draw') {
          await supabase
            .from('back_orders')
            .insert([{
              sku: item.sku,
              item_name: item.name,
              outstanding_qty: Math.abs(newQuantity),
              unit: 'EA',
              department,
              requested_by: userName,
              notes: `เบิกเกิน ${Math.abs(newQuantity)} ${item.unit}`
            }])
        }
      }

      toast.success(`${activeTab === 'draw' ? 'เบิก' : 'รับ'}สินค้าสำเร็จ!`)
      
      // Reset form
      setSelectedItems([])
      setReference('')
      setNotes('')
      loadItems()

    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">จัดการสินค้า</h1>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('draw')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'draw'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Minus className="h-4 w-4 inline mr-2" />
            เบิกสินค้า
          </button>
          <button
            onClick={() => setActiveTab('restock')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'restock'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            รับสินค้า
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Item Selection */}
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">รายการสินค้า</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredItems.map(item => (
                <div key={item.id} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      <div className="text-sm text-gray-500">{item.location}</div>
                      <div className={`text-sm font-medium ${
                        item.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        คงเหลือ: {item.quantity} {item.unit}
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      เพิ่ม
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Transaction Form */}
        <div className="space-y-6">
          {/* Transaction Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">รายละเอียดการ{activeTab === 'draw' ? 'เบิก' : 'รับ'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แผนก *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">เลือกแผนก</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลขที่อ้างอิง
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น PO-001, WO-123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>
            </div>
          </div>

          {/* Selected Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                สินค้าที่เลือก ({selectedItems.length})
              </h2>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {selectedItems.length > 0 ? selectedItems.map(item => (
                <div key={item.sku} className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      <div className="text-sm text-gray-500">
                        คงเหลือ: {item.quantity} {item.unit}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.transactionQuantity}
                        onChange={(e) => updateCartItem(item.sku, 'transactionQuantity', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <select
                        value={item.transactionUnit}
                        onChange={(e) => updateCartItem(item.sku, 'transactionUnit', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeFromCart(item.sku)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>ยังไม่มีสินค้าที่เลือก</p>
                </div>
              )}
            </div>

            {selectedItems.length > 0 && (
              <div className="p-6">
                <button
                  onClick={processTransaction}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    activeTab === 'draw'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {loading ? 'กำลังดำเนินการ...' : `ยืนยันการ${activeTab === 'draw' ? 'เบิก' : 'รับ'}สินค้า`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
