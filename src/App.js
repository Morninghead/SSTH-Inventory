import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      <Toaster position="top-right" />
    </AuthProvider>
  )
}
