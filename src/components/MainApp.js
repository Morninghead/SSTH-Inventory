import React, { useState } from 'react'
import { supabase } from '../services/supabase'
import Dashboard from './Dashboard'
import AddItemPage from './AddItemPage'
import InventoryPage from './InventoryPage'
import TransactionPage from './TransactionPage'
import toast from 'react-hot-toast'

export default function MainApp({ user }) {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ✅ แก้ไข handleLogout function
  const handleLogout = async () => {
    try {
      // Method 1: ใช้ local scope แทน global
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      
      if (error) {
        console.warn('Logout error:', error)
        // ถ้า error ให้ clear session manually
        await clearLocalSession()
      }
      
      toast.success('ออกจากระบบสำเร็จ')
    } catch (error) {
      console.warn('Logout failed, clearing session manually:', error)
      await clearLocalSession()
      toast.success('ออกจากระบบสำเร็จ')
    }
  }

  // ✅ Function สำหรับ clear session manually
  const clearLocalSession = async () => {
    try {
      // Clear localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      })

      // Clear cookies
      const cookieNames = document.cookie.split(';').map(c => c.split('=')[0].trim())
      cookieNames.forEach(name => {
        if (name.startsWith('sb-')) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        }
      })

      // Force page reload to clear all states
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.warn('Manual session clear error:', error)
      // Force reload as last resort
      window.location.reload()
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวมระบบ', icon: '📊' },
    { id: 'inventory', label: 'คลังสินค้า', icon: '📦' },
    { id: 'add-item', label: 'เพิ่มวัสดุ', icon: '➕' },
    { id: 'transactions', label: 'การเคลื่อนไหว', icon: '🔄' }
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'add-item':
        return <AddItemPage user={user} />
      case 'inventory':
        return <InventoryPage user={user} />
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
        <div className="header-left">
          <button 
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="app-title">📦 Inventory System</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">
              👤 {user.user_metadata?.first_name || user.email}
            </span>
            {/* ✅ ปุ่ม logout ที่แก้ไขแล้ว */}
            <button onClick={handleLogout} className="logout-btn">
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <nav className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-content">
            <ul className="nav-menu">
              {menuItems.map(item => (
                <li key={item.id}>
                  <button
                    className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentPage(item.id)
                      setSidebarOpen(false)
                    }}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {renderPage()}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
