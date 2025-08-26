import React, { useState } from 'react'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    confirmPassword: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      toast.success('เข้าสู่ระบบสำเร็จ!')
    } catch (error) {
      toast.error('เข้าสู่ระบบไม่สำเร็จ: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.firstName) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน')
      return
    }

    if (formData.password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
          }
        }
      })

      if (error) throw error

      toast.success('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยัน')
    } catch (error) {
      toast.error('สมัครสมาชิกไม่สำเร็จ: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        
        {/* Header */}
        <div className="login-header">
          <div className="logo">📦</div>
          <h1>Inventory System</h1>
          <p>ระบบจัดการคลังภายในองค์กร</p>
        </div>

        {/* Login Form */}
        <div className="login-card">
          <div className="form-tabs">
            <button 
              className={`tab-btn ${!isSignUp ? 'active' : ''}`}
              onClick={() => setIsSignUp(false)}
            >
              🔑 เข้าสู่ระบบ
            </button>
            <button 
              className={`tab-btn ${isSignUp ? 'active' : ''}`}
              onClick={() => setIsSignUp(true)}
            >
              📝 สมัครสมาชิก
            </button>
          </div>

          {!isSignUp ? (
            // Login Form
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">อีเมล</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@company.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">รหัสผ่าน</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="auth-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner small"></span>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  '🚪 เข้าสู่ระบบ'
                )}
              </button>

              <div className="form-footer">
                <p>
                  ยังไม่เป็นสมาชิก? {' '}
                  <button 
                    type="button"
                    className="link-btn"
                    onClick={() => setIsSignUp(true)}
                  >
                    สมัครสมาชิก
                  </button>
                </p>
              </div>
            </form>
          ) : (
            // Sign Up Form
            <form onSubmit={handleSignUp} className="auth-form">
              <div className="form-group">
                <label htmlFor="firstName">ชื่อ</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="ชื่อของคุณ"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">อีเมล</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@company.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">รหัสผ่าน</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="auth-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner small"></span>
                    กำลังสมัครสมาชิก...
                  </>
                ) : (
                  '✨ สมัครสมาชิก'
                )}
              </button>

              <div className="form-footer">
                <p>
                  เป็นสมาชิกแล้ว? {' '}
                  <button 
                    type="button"
                    className="link-btn"
                    onClick={() => setIsSignUp(false)}
                  >
                    เข้าสู่ระบบ
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>🔒 ระบบปลอดภัยด้วย Supabase Authentication</p>
          <p className="version">v1.0.0 - Inventory Management System</p>
        </div>
      </div>
    </div>
  )
}
