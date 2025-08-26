@"
import React, { useState } from 'react'
import { AuthProvider, useAuth } from './components/auth/AuthProvider'
import LoginPage from './components/auth/LoginPage'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import AddItemForm from './components/inventory/AddItemForm'
import DrawRestockPage from './components/transactions/DrawRestockPage'
import ReportsPage from './components/reports/ReportsPage'
import './App.css'

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

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

  if (!user) {
    return <LoginPage />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'add-item':
        return <AddItemForm />
      case 'draw-restock':
        return <DrawRestockPage />
      case 'reports':
        return <ReportsPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
"@ | Out-File -FilePath "src/App.js" -Encoding UTF8
