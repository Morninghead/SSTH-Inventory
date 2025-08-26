import React, { useState } from 'react'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

export default function TransactionPage({ user }) {
  const [activeTab, setActiveTab] = useState('draw')

  const tabs = [
    { id: 'draw', label: '🔻 เบิกวัสดุ', icon: '🔻' },
    { id: 'restock', label: '🔺 รับเข้าคลัง', icon: '🔺' },
    { id: 'transfer', label: '↔️ โอนย้าย', icon: '↔️' },
    { id: 'history', label: '📋 ประวัติ', icon: '📋' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'draw':
        return <DrawForm user={user} />
      case 'restock':
        return <RestockForm user={user} />
      case 'transfer':
        return <TransferForm user={user} />
      case 'history':
        return <TransactionHistory user={user} />
      default:
        return <DrawForm user={user} />
    }
  }

  return (
    <div className="transaction-page">
      <div className="transaction-header">
        <h2>🔄 การเบิก/รับวัสดุ</h2>
        <p>ระบบจัดการการเคลื่อนไหวครุภัณฑ์/วัสดุภายในบริษัท</p>
      </div>

      {/* Transaction Tabs */}
      <div className="transaction-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  )
}

function DrawForm({ user }) {
  return (
    <div className="transaction-form">
      <h3>🔻 เบิกวัสดุ</h3>
      <p>ฟอร์มสำหรับเบิกครุภัณฑ์/วัสดุออกจากคลัง</p>
      
      <div style={{ 
        background: '#fefce8', 
        padding: '2rem', 
        borderRadius: '0.5rem', 
        marginTop: '1rem',
        border: '1px solid #f59e0b'
      }}>
        <h4 style={{ color: '#d97706', margin: '0 0 1rem 0' }}>🔧 กำลังพัฒนา</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
          <li>ฟอร์มเบิกวัสดุตามแผนก</li>
          <li>ตรวจสอบสต็อกแบบ real-time</li>
          <li>ระบบอนุมัติการเบิก</li>
          <li>บันทึกผู้เบิกและวัตถุประสงค์</li>
        </ul>
      </div>
    </div>
  )
}

function RestockForm({ user }) {
  return (
    <div className="transaction-form">
      <h3>🔺 รับเข้าคลัง</h3>
      <p>ฟอร์มสำหรับรับครุภัณฑ์/วัสดุเข้าคลัง</p>
      
      <div style={{ 
        background: '#f0fdf4', 
        padding: '2rem', 
        borderRadius: '0.5rem', 
        marginTop: '1rem',
        border: '1px solid #10b981'
      }}>
        <h4 style={{ color: '#059669', margin: '0 0 1rem 0' }}>📦 ฟีเจอร์ที่จะมี</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#065f46' }}>
          <li>รับของจากการสั่งซื้อ</li>
          <li>รับของคืนจากแผนกต่างๆ</li>
          <li>อัปเดตจำนวนคงเหลือทันที</li>
          <li>บันทึกผู้ส่งและเอกสารอ้างอิง</li>
        </ul>
      </div>
    </div>
  )
}

function TransferForm({ user }) {
  return (
    <div className="transaction-form">
      <h3>↔️ โอนย้าย</h3>
      <p>ฟอร์มสำหรับโอนย้ายครุภัณฑ์/วัสดุระหว่างแผนก</p>
      
      <div style={{ 
        background: '#eff6ff', 
        padding: '2rem', 
        borderRadius: '0.5rem', 
        marginTop: '1rem',
        border: '1px solid #3b82f6'
      }}>
        <h4 style={{ color: '#1d4ed8', margin: '0 0 1rem 0' }}>🔄 การโอนย้าย</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e3a8a' }}>
          <li>โอนระหว่างแผนกภายในบริษัท</li>
          <li>เปลี่ยนตำแหน่งจัดเก็บ</li>
          <li>ติดตามการเคลื่อนไหว</li>
          <li>อัปเดตผู้รับผิดชอบ</li>
        </ul>
      </div>
    </div>
  )
}

function TransactionHistory({ user }) {
  return (
    <div className="transaction-history">
      <h3>📋 ประวัติการเคลื่อนไหว</h3>
      <p>รายการทรานแซคชันทั้งหมดในระบบ</p>
      
      <div style={{ 
        background: '#f8fafc', 
        padding: '2rem', 
        borderRadius: '0.5rem', 
        marginTop: '1rem',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ color: '#475569', margin: '0 0 1rem 0' }}>📊 รายงานที่จะมี</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155' }}>
          <li>ประวัติการเบิก-รับ ทั้งหมด</li>
          <li>กรองตามวันที่ แผนก ประเภท</li>
          <li>สถิติการใช้งานรายเดือน</li>
          <li>Export รายงานเป็น Excel/PDF</li>
        </ul>
      </div>
    </div>
  )
}
