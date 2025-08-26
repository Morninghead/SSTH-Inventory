import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

export default function InventoryPage({ user }) {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    filterAndSortItems()
  }, [items, searchTerm, selectedCategory, sortBy, sortOrder])

  const loadItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortItems = () => {
    let filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory

      return matchesSearch && matchesCategory
    })

    // Sort items
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredItems(filtered)
  }

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { status: 'out', label: 'หมดสต็อก', color: '#ef4444' }
    if (item.quantity <= (item.reorder_level || 0) && item.reorder_level > 0) {
      return { status: 'low', label: 'สต็อกต่ำ', color: '#f59e0b' }
    }
    return { status: 'good', label: 'ปกติ', color: '#10b981' }
  }

  const getCategories = () => {
    const cats = [...new Set(items.map(item => item.category).filter(Boolean))]
    return ['All', ...cats.sort()]
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดคลังสินค้า...</p>
      </div>
    )
  }

  return (
    <div className="inventory-page">
      {/* Header Section */}
      <div className="inventory-header">
        <div className="header-content">
          <h2>📦 คลังสินค้า</h2>
          <p>จัดการข้อมูลครุภัณฑ์และวัสดุทั้งหมด</p>
        </div>
        <div className="header-stats">
          <div className="stat-box">
            <div className="stat-number">{items.length}</div>
            <div className="stat-label">รายการทั้งหมด</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {items.filter(item => item.quantity === 0).length}
            </div>
            <div className="stat-label">หมดสต็อก</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {items.filter(item => item.quantity <= (item.reorder_level || 0) && item.reorder_level > 0).length}
            </div>
            <div className="stat-label">สต็อกต่ำ</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="inventory-controls">
        <div className="controls-left">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 ค้นหาสินค้า, รหัส, หมวดหมู่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {getCategories().map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'ทุกหมวดหมู่' : cat}
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order)
            }}
            className="sort-select"
          >
            <option value="name-asc">ชื่อ A-Z</option>
            <option value="name-desc">ชื่อ Z-A</option>
            <option value="quantity-desc">คงเหลือมาก-น้อย</option>
            <option value="quantity-asc">คงเหลือน้อย-มาก</option>
            <option value="created_at-desc">ใหม่-เก่า</option>
            <option value="created_at-asc">เก่า-ใหม่</option>
          </select>
        </div>

        <div className="controls-right">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞ Grid
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              ☰ Table
            </button>
          </div>
          
          <button onClick={loadItems} className="refresh-btn">
            🔄 รีเฟรช
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span>แสดง {filteredItems.length} จาก {items.length} รายการ</span>
        {searchTerm && (
          <span className="search-result">
            ผลการค้นหา: "{searchTerm}"
          </span>
        )}
      </div>

      {/* Content Section */}
      {filteredItems.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>ไม่พบข้อมูลที่ค้นหา</h3>
          <p>ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</p>
          <button onClick={() => {
            setSearchTerm('')
            setSelectedCategory('All')
          }} className="clear-filters-btn">
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="inventory-grid">
              {filteredItems.map(item => {
                const stockInfo = getStockStatus(item)
                return (
                  <div key={item.id} className="inventory-card">
                    <div className="card-header">
                      <h3 className="item-name">{item.name}</h3>
                      <span className="item-sku">{item.sku}</span>
                    </div>
                    
                    <div className="card-body">
                      <div className="stock-info">
                        <div className="quantity">
                          <span className="quantity-number">{item.quantity}</span>
                          <span className="quantity-unit">{item.unit}</span>
                        </div>
                        <div 
                          className="stock-status"
                          style={{ 
                            backgroundColor: stockInfo.color + '20',
                            color: stockInfo.color,
                            border: `1px solid ${stockInfo.color}40`
                          }}
                        >
                          {stockInfo.label}
                        </div>
                      </div>

                      <div className="item-details">
                        <div className="detail-row">
                          <span className="detail-label">🏷️ หมวดหมู่:</span>
                          <span className="detail-value">{item.category || 'ไม่ระบุ'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">📍 ตำแหน่ง:</span>
                          <span className="detail-value">{item.location || 'ไม่ระบุ'}</span>
                        </div>
                        {item.cost && (
                          <div className="detail-row">
                            <span className="detail-label">💰 ราคา:</span>
                            <span className="detail-value">
                              {new Intl.NumberFormat('th-TH', {
                                style: 'currency',
                                currency: 'THB'
                              }).format(item.cost)}
                            </span>
                          </div>
                        )}
                        {item.supplier && (
                          <div className="detail-row">
                            <span className="detail-label">🏪 ผู้จำหน่าย:</span>
                            <span className="detail-value">{item.supplier}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-footer">
                      <button className="action-btn primary">
                        ✏️ แก้ไข
                      </button>
                      <button className="action-btn secondary">
                        📊 รายละเอียด
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ชื่อสินค้า</th>
                    <th>รหัส</th>
                    <th>คงเหลือ</th>
                    <th>สถานะ</th>
                    <th>หมวดหมู่</th>
                    <th>ตำแหน่ง</th>
                    <th>ราคา</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const stockInfo = getStockStatus(item)
                    return (
                      <tr key={item.id} className="table-row">
                        <td className="item-name-cell">
                          <strong>{item.name}</strong>
                          {item.description && (
                            <div className="item-description">{item.description}</div>
                          )}
                        </td>
                        <td className="sku-cell">{item.sku}</td>
                        <td className="quantity-cell">
                          <span className="quantity">{item.quantity} {item.unit}</span>
                        </td>
                        <td className="status-cell">
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: stockInfo.color + '20',
                              color: stockInfo.color,
                              border: `1px solid ${stockInfo.color}40`
                            }}
                          >
                            {stockInfo.label}
                          </span>
                        </td>
                        <td className="category-cell">{item.category || '-'}</td>
                        <td className="location-cell">{item.location || '-'}</td>
                        <td className="cost-cell">
                          {item.cost ? (
                            new Intl.NumberFormat('th-TH', {
                              style: 'currency',
                              currency: 'THB'
                            }).format(item.cost)
                          ) : '-'}
                        </td>
                        <td className="actions-cell">
                          <button className="table-action-btn edit">✏️</button>
                          <button className="table-action-btn view">👁️</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
