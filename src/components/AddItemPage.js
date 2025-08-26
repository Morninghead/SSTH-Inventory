import React, { useState } from 'react'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

export default function AddItemPage({ user }) {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'EA',
    reorder_level: '',
    location: '',
    supplier: '',
    cost: '',
    department_owner: '',
    asset_tag: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.sku || !formData.name || !formData.quantity) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น: รหัสสินค้า, ชื่อ, จำนวน')
      return
    }

    setLoading(true)

    try {
      // Insert ข้อมูลสินค้า
      const { error: itemError } = await supabase
        .from('inventory_items')
        .insert([{
          sku: formData.sku,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          quantity: parseFloat(formData.quantity) || 0,
          unit: formData.unit,
          reorder_level: parseFloat(formData.reorder_level) || 0,
          location: formData.location,
          supplier: formData.supplier,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          department_owner: formData.department_owner,
          asset_tag: formData.asset_tag,
          notes: formData.notes,
          status: 'Active'
        }])

      if (itemError) throw itemError

      // เพิ่ม transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          type: 'RESTOCK',
          sku: formData.sku,
          item_name: formData.name,
          quantity: parseFloat(formData.quantity) || 0,
          unit: formData.unit,
          department: user.user_metadata?.department || 'Admin',
          user_name: user.user_metadata?.first_name || user.email,
          user_email: user.email,
          purpose: 'Initial stock entry',
          status: 'Normal'
        }])

      if (transactionError) {
        console.warn('Transaction record failed:', transactionError)
      }

      toast.success('เพิ่มครุภัณฑ์/วัสดุใหม่สำเร็จ!')
      
      // Reset form
      setFormData({
        sku: '',
        name: '',
        description: '',
        category: '',
        quantity: '',
        unit: 'EA',
        reorder_level: '',
        location: '',
        supplier: '',
        cost: '',
        department_owner: '',
        asset_tag: '',
        notes: ''
      })

    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const UNITS = ["EA", "Pack", "Box", "Bottle", "Roll", "Pair", "Set", "Ream", "Kit", "L", "ML", "KG", "G"]
  
  const DEPARTMENTS = [
    "IT Department",
    "HR Department", 
    "Finance Department",
    "Operations Department",
    "Maintenance Department",
    "Security Department",
    "Administration",
    "Warehouse"
  ]

  return (
    <div className="add-item-page">
      <div className="page-header">
        <h2>➕ เพิ่มครุภัณฑ์/วัสดุใหม่</h2>
        <p>เพิ่มรายการครุภัณฑ์หรือวัสดุใหม่เข้าสู่ระบบ</p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="add-item-form">
        <div className="form-grid">
          
          {/* Basic Information */}
          <div className="form-section">
            <h3>ข้อมูลพื้นฐาน</h3>
            
            <div className="form-group required">
              <label htmlFor="sku">รหัสสินค้า (SKU)</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="เช่น OFF-001, SAF-002"
                required
              />
            </div>

            <div className="form-group required">
              <label htmlFor="name">ชื่อครุภัณฑ์/วัสดุ</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="เช่น ปากกาลูกลื่น สีน้ำเงิน"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">รายละเอียด</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="รายละเอียดเพิ่มเติม"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">หมวดหมู่</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="เช่น Office Supplies"
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit">หน่วยนับ</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                >
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Information */}
          <div className="form-section">
            <h3>ข้อมูลสต็อก</h3>
            
            <div className="form-row">
              <div className="form-group required">
                <label htmlFor="quantity">จำนวนเริ่มต้น</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reorder_level">จุดสั่งซื้อใหม่</label>
                <input
                  type="number"
                  id="reorder_level"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">ตำแหน่งจัดเก็บ</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="เช่น ห้องเก็บของ A-01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cost">ราคาต่อหน่วย (บาท)</label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-section">
            <h3>ข้อมูลเพิ่มเติม</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="supplier">ผู้จัดจำหน่าย</label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  placeholder="ชื่อบริษัท/ร้านค้า"
                />
              </div>

              <div className="form-group">
                <label htmlFor="department_owner">แผนกเจ้าของ</label>
                <select
                  id="department_owner"
                  name="department_owner"
                  value={formData.department_owner}
                  onChange={handleInputChange}
                >
                  <option value="">เลือกแผนก</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="asset_tag">Asset Tag</label>
              <input
                type="text"
                id="asset_tag"
                name="asset_tag"
                value={formData.asset_tag}
                onChange={handleInputChange}
                placeholder="รหัสติดตามทรัพย์สิน"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">หมายเหตุ</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="หมายเหตุเพิ่มเติม"
                rows="3"
              />
            </div>
          </div>

        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner small"></span>
                กำลังบันทึก...
              </>
            ) : (
              <>
                💾 บันทึกครุภัณฑ์/วัสดุ
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
