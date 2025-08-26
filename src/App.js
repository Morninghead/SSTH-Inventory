import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from './services/supabase'
import { Toaster } from 'react-hot-toast'
import LoginPage from './components/LoginPage'
import MainApp from './components/MainApp'
import './App.css'

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
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-icon">📦</div>
          <div className="loading-text">กำลังโหลดระบบ...</div>
          <div className="loading-spinner"></div>
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
