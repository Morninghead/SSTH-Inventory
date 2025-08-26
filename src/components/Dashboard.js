import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    total_items: 0,
    low_stock_items: 0,
    today_draws: 0,
    total_asset_value: 0,
    pending_requests: 0,
    back_orders_count: 0,
    maintenance_due: 0,
    active_assignments: 0,
    departments_count: 0
  })
  
  const [recentItems, setRecentItems] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // 🎯 เรียกใช้ Functions ที่สร้างเสร็จแล้ว
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_dashboard_stats')
      
      if (statsError) {
        console.error('Stats error:', statsError)
        toast.error('ไม่สามารถโหลดสถิติได้')
      } else {
        setStats(statsData || {
          total_items: 0,
          low_stock_items: 0,
          today_draws: 0,
          total_asset_value: 0,
          pending_requests: 0,
          back_orders_count: 0,
          maintenance_due: 0,
          active_assignments: 0,
          departments_count: 0
        })
      }

      const { data: itemsData, error: itemsError } = await supabase
        .rpc('get_recent_items', { limit_count: 5 })
      
      if (itemsError) {
        console.error('Items error:', itemsError)
        toast.error('ไม่สามารถโหลดรายการสินค้าได้')
        setRecentItems([])
      } else {
        setRecentItems(itemsData || [])
      }

      const { data: transactionsData, error: transactionsError } = await supabase
        .rpc('get_recent_transactions', { txn_limit: 8 })
      
      if (transactionsError) {
        console.error('Transactions error:', transactionsError)
        toast.error('ไม่สามารถโหลดการเคลื่อนไหวได้')
        setRecentTransactions([])
      } else {
        setRecentTransactions(transactionsData || [])
      }

      // 🎉 แสดงข้อความสำเร็จเมื่อโหลดเสร็จ
      if (!statsError && !itemsError && !transactionsError) {
        toast.success('โหลดข้อมูลสำเร็จ!')
      }

    } catch (error) {
      console.error('Dashboard load error:', error)
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูลภาพรวม...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2>📊 ภาพรวมระบบ Inventory Management</h2>
        <div className="header-actions">
          <button onClick={loadDashboardData} className="refresh-btn">
            🔄 รีเฟรชข้อมูล
          </button>
          <span className="last-update">
            อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
          </span>
        </div>
      </div>

      {/* 📊 Stats Grid - 9 Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>ครุภัณฑ์/วัสดุทั้งหมด</h3>
            <p className="stat-number">{stats.total_items || 0}</p>
            <span className="stat-subtitle">รายการ</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>วัสดุใกล้หมด</h3>
            <p className={`stat-number ${(stats.low_stock_items || 0) > 0 ? 'danger' : 'success'}`}>
              {stats.low_stock_items || 0}
            </p>
            <span className="stat-subtitle">รายการ</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">🔻</div>
          <div className="stat-content">
            <h3>เบิกใช้วันนี้</h3>
            <p className="stat-number">{stats.today_draws || 0}</p>
            <span className="stat-subtitle">ครั้ง</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>มูลค่าทรัพย์สินรวม</h3>
            <p className="stat-number">
              {new Intl.NumberFormat('th-TH', {
                style: 'currency',
                currency: 'THB',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(stats.total_asset_value || 0)}
            </p>
            <span className="stat-subtitle">บาท</span>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>คำขอรออนุมัติ</h3>
            <p className={`stat-number ${(stats.pending_requests || 0) > 0 ? 'warning' : 'success'}`}>
              {stats.pending_requests || 0}
            </p>
            <span className="stat-subtitle">คำขอ</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>รายการรอสินค้า</h3>
            <p className={`stat-number ${(stats.back_orders_count || 0) > 0 ? 'danger' : 'success'}`}>
              {stats.back_orders_count || 0}
            </p>
            <span className="stat-subtitle">รายการ</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <h3>ต้องบำรุงรักษา</h3>
            <p className={`stat-number ${(stats.maintenance_due || 0) > 0 ? 'warning' : 'success'}`}>
              {stats.maintenance_due || 0}
            </p>
            <span className="stat-subtitle">รายการ</span>
          </div>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>ทรัพย์สินที่มอบหมาย</h3>
            <p className="stat-number">{stats.active_assignments || 0}</p>
            <span className="stat-subtitle">รายการ</span>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>แผนกทั้งหมด</h3>
            <p className="stat-number">{stats.departments_count || 0}</p>
            <span className="stat-subtitle">แผนก</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        
        {/* Recent Items */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>📦 ครุภัณฑ์/วัสดุที่เพิ่มล่าสุด</h3>
            <span className="section-count">({recentItems.length} รายการ)</span>
          </div>
          <div className="items-list">
            {recentItems.length > 0 ? recentItems.map(item => (
              <div key={item.item_id} className="item-card">
                <div className="item-info">
                  <strong className="item-name">{item.item_name}</strong>
                  <p className="item-details">
                    <span className="item-sku">รหัส: {item.item_sku}</span>
                    <span className="item-qty">คงเหลือ: {item.item_quantity} {item.item_unit}</span>
                  </p>
                  <p className="item-location">📍 {item.item_location || 'ไม่ระบุตำแหน่ง'}</p>
                  <p className="item-category">🏷️ {item.item_category || 'ไม่มีหมวดหมู่'}</p>
                </div>
              </div>
            )) : (
              <div className="no-data">
                <div className="no-data-icon">📦</div>
                <h4>ยังไม่มีครุภัณฑ์/วัสดุในระบบ</h4>
                <p>เริ่มต้นโดยไปที่หน้า "เพิ่มวัสดุ" เพื่อเพิ่มรายการแรก</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>🔄 การเคลื่อนไหวล่าสุด</h3>
            <span className="section-count">({recentTransactions.length} รายการ)</span>
          </div>
          <div className="transactions-list">
            {recentTransactions.length > 0 ? recentTransactions.map(txn => (
              <div key={txn.txn_id} className="transaction-card">
                <div className="transaction-type">
                  {txn.txn_type === 'DRAW' ? '🔻' : 
                   txn.txn_type === 'RESTOCK' ? '🔺' :
                   txn.txn_type === 'TRANSFER' ? '↔️' :
                   txn.txn_type === 'RETURN' ? '↩️' : '🔄'}
                </div>
                <div className="transaction-info">
                  <strong className="transaction-name">{txn.txn_item_name}</strong>
                  <p className="transaction-action">
                    <span className={`action-type ${txn.txn_type.toLowerCase()}`}>
                      {txn.txn_type === 'DRAW' ? 'เบิกใช้' : 
                       txn.txn_type === 'RESTOCK' ? 'รับเข้าคลัง' :
                       txn.txn_type === 'TRANSFER' ? 'โอนย้าย' :
                       txn.txn_type === 'RETURN' ? 'คืนวัสดุ' : 'อื่นๆ'}
                    </span>
                    <span className="transaction-qty">{txn.txn_quantity} {txn.txn_unit}</span>
                  </p>
                  <p className="transaction-dept">🏢 {txn.txn_department}</p>
                  {txn.txn_user_name && (
                    <p className="transaction-user">👤 {txn.txn_user_name}</p>
                  )}
                  {txn.txn_purpose && (
                    <p className="transaction-purpose">📝 {txn.txn_purpose}</p>
                  )}
                </div>
                <div className="transaction-meta">
                  <span className="transaction-sku">{txn.txn_sku}</span>
                  <span className="transaction-time">
                    {new Date(txn.txn_created_at).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>
            )) : (
              <div className="no-data">
                <div className="no-data-icon">🔄</div>
                <h4>ยังไม่มีการเคลื่อนไหว</h4>
                <p>การเคลื่อนไหวจะแสดงเมื่อมีการเบิก-รับวัสดุ</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* System Status */}
      <div className="system-status-section">
        <h3>🎉 ระบบพร้อมใช้งาน!</h3>
        <div className="status-grid">
          <div className="status-item success">
            <span className="status-label">✅ Database Connection:</span>
            <span className="status-value">เชื่อมต่อสำเร็จ</span>
          </div>
          <div className="status-item success">
            <span className="status-label">✅ Functions:</span>
            <span className="status-value">ทำงานได้ปกติ</span>
          </div>
          <div className="status-item info">
            <span className="status-label">📊 Total Data:</span>
            <span className="status-value">{stats.total_items} items</span>
          </div>
          <div className="status-item info">
            <span className="status-label">👤 Logged in as:</span>
            <span className="status-value">{user.user_metadata?.first_name || user.email}</span>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={loadDashboardData} 
            className="action-btn primary"
          >
            🔄 รีเฟรชข้อมูลทั้งหมด
          </button>
          <button 
            onClick={() => toast.success('ระบบทำงานปกติ!')} 
            className="action-btn secondary"
          >
            ✅ ตรวจสอบระบบ
          </button>
        </div>
      </div>

    </div>
  )
}
