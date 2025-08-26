@"
import React from 'react'

export default function Dashboard() {
  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>แดชบอร์ด</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ background: '#dbeafe', padding: '0.75rem', borderRadius: '0.5rem', marginRight: '1rem' }}>
              📦
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>จำนวนสินค้าทั้งหมด</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>0</p>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '0.5rem', marginRight: '1rem' }}>
              ⚠️
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>สินค้าใกล้หมด</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>0</p>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '0.5rem', marginRight: '1rem' }}>
              📈
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>ธุรกรรมวันนี้</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>0</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>ข้อมูลระบบ</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>ระบบ Inventory Management พร้อมใช้งาน</p>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>กรุณาเพิ่มสินค้าเพื่อเริ่มต้นใช้งาน</p>
      </div>
    </div>
  )
}
"@ | Out-File -FilePath "src/components/dashboard/Dashboard.js" -Encoding UTF8
