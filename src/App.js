import React, { useState, useEffect } from 'react'
import { supabase } from './services/supabase'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

// Constants ที่จำเป็น
const DEPARTMENTS = [
  'Admin', 'Coating', 'Maintenance', 'Marketing', 'Mold',
  'Production', 'Purchasing', 'QA', 'R&D', 'SCM', 'PI'
]

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <div>กำลังโหลด...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {user ? <MainApp user={user} /> : <LoginPage />}
      <Toaster position="top-right" />
    </>
  )
}

// Login Component
function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: ''
  })

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              department: formData.department
            }
          }
        })
        if (error) throw error
        toast.success('สร้างบัญชีสำเร็จ! กรุณาตรวจสอบอีเมล')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        toast.success('เข้าสู่ระบบสำเร็จ!')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>📦 Inventory System</h1>
        <p>{isSignUp ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}</p>
        
        <form onSubmit={handleAuth}>
          {isSignUp && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="ชื่อ"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="นามสกุล"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                required
              >
                <option value="">เลือกแผนก</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </>
          )}
          
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'กำลังดำเนินการ...' : (isSignUp ? 'สร้างบัญชี' : 'เข้าสู่ระบบ')}
          </button>
        </form>
        
        <p>
          {isSignUp ? 'มีบัญชีแล้ว? ' : 'ยังไม่มีบัญชี? '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
          >
            {isSignUp ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
          </button>
        </p>
      </div>
    </div>
  )
}

// Main App with Navigation
function MainApp({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard')

  const signOut = async () => {
    await supabase.auth.signOut()
    toast.success('ออกจากระบบแล้ว')
  }

  const tabs = [
    { id: 'dashboard', label: '📊 แดชบอร์ด', icon: '📊' },
    { id: 'inventory', label: '📦 จัดการสินค้า', icon: '📦' },
    { id: 'add-item', label: '➕ เพิ่มสินค้า', icon: '➕' },
    { id: 'transactions', label: '🔄 เบิก/รับสินค้า', icon: '🔄' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'inventory':
        return <InventoryPage user={user} />
      case 'add-item':
        return <AddItemPage user={user} />
      case 'transactions':
        return <TransactionPage user={user} />
      default:
        return <Dashboard user={user} />
    }
  }

  return (
    <div className="main-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>📦 Inventory Management System</h1>
          <div className="user-info">
            <span>สวัสดี {user.user_metadata?.first_name || user.email}</span>
            <span className="department">({user.user_metadata?.department || 'Admin'})</span>
            <button onClick={signOut} className="sign-out-btn">ออกจากระบบ</button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        <div className="nav-content">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  )
}

// Dashboard Component
function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    todayTransactions: 0,
    totalValue: 0
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

      // Load inventory items
      const { data: items } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })

      // Load recent transactions  
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Calculate stats
      const totalItems = items?.length || 0
      const lowStock = items?.filter(item => 
        item.quantity <= item.reorder_level && item.reorder_level > 0
      ) || []

      const today = new Date().toISOString().split('T')[0]
      const todayTxns = transactions?.filter(txn => 
        txn.created_at?.startsWith(today)
      )?.length || 0

      const totalValue = items?.reduce((sum, item) => 
        sum + (item.quantity * (item.cost || 0)), 0
      ) || 0

      setStats({
        totalItems,
        lowStockItems: lowStock.length,
        todayTransactions: todayTxns,
        totalValue
      })

      setRecentItems(items?.slice(0, 5) || [])
      setRecentTransactions(transactions?.slice(0, 5) || [])

    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>แดชบอร์ด</h2>
        <button onClick={loadDashboardData} className="refresh-btn">
          🔄 รีเฟรช
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>สินค้าทั้งหมด</h3>
            <p className="stat-number">{stats.totalItems}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>สินค้าใกล้หมด</h3>
            <p className={`stat-number ${stats.lowStockItems > 0 ? 'warning' : 'success'}`}>
              {stats.lowStockItems}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>ธุรกรรมวันนี้</h3>
            <p className="stat-number">{stats.todayTransactions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>มูลค่าสินค้าคงเหลือ</h3>
            <p className="stat-number">
              {new Intl.NumberFormat('th-TH', {
                style: 'currency',
                currency: 'THB'
              }).format(stats.totalValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Items */}
        <div className="dashboard-section">
          <h3>สินค้าที่เพิ่มล่าสุด</h3>
          <div className="items-list">
            {recentItems.length > 0 ? recentItems.map(item => (
              <div key={item.id} className="item-card">
                <div className="item-info">
                  <strong>{item.name}</strong>
                  <p>SKU: {item.sku} | คงเหลือ: {item.quantity} {item.unit}</p>
                  <p className="item-location">📍 {item.location || 'ไม่ระบุตำแหน่ง'}</p>
                </div>
              </div>
            )) : (
              <p className="no-data">ยังไม่มีสินค้าในระบบ</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="dashboard-section">
          <h3>ธุรกรรมล่าสุด</h3>
          <div className="transactions-list">
            {recentTransactions.length > 0 ? recentTransactions.map(txn => (
              <div key={txn.id} className="transaction-card">
                <div className="transaction-type">
                  {txn.transaction_type === 'DRAW' ? '🔻' : '🔺'}
                </div>
                <div className="transaction-info">
                  <strong>{txn.item_name}</strong>
                  <p>
                    {txn.transaction_type === 'DRAW' ? 'เบิก' : 'รับ'} {txn.quantity} {txn.unit}
                  </p>
                  <p className="transaction-dept">🏢 {txn.department}</p>
                </div>
              </div>
            )) : (
              <p className="no-data">ยังไม่มีธุรกรรม</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="quick-actions">
        <h3>🎉 ระบบพร้อมใช้งาน!</h3>
        <p>✅ เชื่อมต่อ Supabase สำเร็จ | ✅ Authentication ทำงานได้ | ✅ Database มี {stats.totalItems} รายการ</p>
      </div>
    </div>
  )
}

// Placeholder components สำหรับ tabs อื่น
function InventoryPage({ user }) {
  return (
    <div className="page-container">
      <h2>📦 จัดการสินค้า</h2>
      <p>ฟีเจอร์จัดการสินค้า (กำลังพัฒนา)</p>
      <div style={{ background: '#f0f9ff', padding: '2rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
        <h3>📋 ฟีเจอร์ที่จะมี:</h3>
        <ul>
          <li>✅ ดูรายการสินค้าทั้งหมด</li>
          <li>✅ ค้นหาและกรองสินค้า</li>
          <li>✅ แก้ไขข้อมูลสินค้า</li>
          <li>✅ ลบสินค้า (พร้อมการยืนยัน)</li>
        </ul>
      </div>
    </div>
  )
}

function AddItemPage({ user }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
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
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('inventory_items')
        .insert([{
          ...formData,
          quantity: parseFloat(formData.quantity) || 0,
          reorder_level: parseFloat(formData.reorder_level) || 0,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          status: 'Active',
          created_by: user.id
        }])

      if (error) throw error

      toast.success('เพิ่มสินค้าใหม่สำเร็จ!')
      
      // Reset form
      setFormData({
        sku: '',
        name: '',
        description: '',
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

  return (
    <div className="page-container">
      <h2>➕ เพิ่มสินค้าใหม่</h2>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              ชื่อสินค้า *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            รายละเอียด
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows="3"
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              หมวดหมู่
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              จำนวน *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              หน่วย
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            >
              <option value="EA">EA</option>
              <option value="Box">Box</option>
              <option value="Pack">Pack</option>
              <option value="Set">Set</option>
              <option value="Kg">Kg</option>
              <option value="L">L</option>
              <option value="M">M</option>
              <option value="Dozen">Dozen</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              จุดสั่งซื้อใหม่
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.reorder_level}
              onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              ตำแหน่ง
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              ผู้จัดจำหน่าย
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              ราคาต้นทุน
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({...formData, cost: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              ราคาขาย
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            หมายเหตุ
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows="2"
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            padding: '0.875rem 2rem',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'กำลังบันทึก...' : '💾 บันทึกสินค้า'}
        </button>
      </form>
    </div>
  )
}

function TransactionPage({ user }) {
  return (
    <div className="page-container">
      <h2>🔄 เบิก/รับสินค้า</h2>
      <p>ระบบเบิก/รับสินค้า (กำลังพัฒนา)</p>
      <div style={{ background: '#fefce8', padding: '2rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
        <h3>📦 ฟีเจอร์ที่จะมี:</h3>
        <ul>
          <li>✅ เบิกสินค้าตามแผนก</li>
          <li>✅ รับสินค้าเข้าคลัง</li>
          <li>✅ ตรวจสอบ stock แบบ real-time</li>
          <li>✅ ระบบ Back Order เมื่อสินค้าไม่พอ</li>
          <li>✅ ประวัติการเคลื่อนไหวทั้งหมด</li>
        </ul>
      </div>
    </div>
  )
}
