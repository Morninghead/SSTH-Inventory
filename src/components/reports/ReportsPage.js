@"
import React from 'react'

export default function ReportsPage() {
  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>รายงาน</h1>
      
      <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>ระบบรายงาน</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>ฟีเจอร์นี้จะเชื่อมต่อกับ Supabase ในขั้นตอนถัดไป</p>
      </div>
    </div>
  )
}
"@ | Out-File -FilePath "src/components/reports/ReportsPage.js" -Encoding UTF8
