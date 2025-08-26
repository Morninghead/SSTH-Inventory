import React, { useState } from 'react'
// ✅ แก้ไข: ลบ imports ที่ไม่ใช้
// import { supabase } from '../services/supabase'
// import toast from 'react-hot-toast'

export default function TransactionPage({ user }) {
  const [activeTab, setActiveTab] = useState('draw')

  return (
    <div className="transaction-page">
      <div className="page-header">
        <h2>🔄 การเคลื่อนไหวสินค้า</h2>
        <p>จัดการการเบิก รับเข้า และโอนย้ายสินค้า</p>
      </div>

      <div className="transaction-tabs">
        <button 
          className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
          onClick={() => setActiveTab('draw')}
        >
          🔻 เบิกสินค้า
        </button>
        <button 
          className={`tab-btn ${activeTab === 'restock' ? 'active' : ''}`}
          onClick={() => setActiveTab('restock')}
        >
          🔺 รับเข้าสินค้า
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          ↔️ โอนย้าย
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 ประวัติ
        </button>
      </div>

      <div className="transaction-content">
        {activeTab === 'draw' && (
          <div className="transaction-form">
            <h3>เบิกสินค้า</h3>
            <p>ฟอร์มเบิกสินค้าจะพัฒนาในเร็วๆ นี้</p>
          </div>
        )}
        
        {activeTab === 'restock' && (
          <div className="transaction-form">
            <h3>รับเข้าสินค้า</h3>
            <p>ฟอร์มรับเข้าสินค้าจะพัฒนาในเร็วๆ นี้</p>
          </div>
        )}
        
        {activeTab === 'transfer' && (
          <div className="transaction-form">
            <h3>โอนย้ายสินค้า</h3>
            <p>ฟอร์มโอนย้ายสินค้าจะพัฒนาในเร็วๆ นี้</p>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="transaction-history">
            <h3>ประวัติการเคลื่อนไหว</h3>
            <p>ประวัติการทำงานจะพัฒนาในเร็วๆ นี้</p>
          </div>
        )}
      </div>
    </div>
  )
}
