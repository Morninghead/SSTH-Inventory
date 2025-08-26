import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.log('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export const DEPARTMENTS = [
  'Admin',         // ฝ่ายบริหาร
  'Coating',       // ฝ่ายเคลือบผิว
  'Maintenance',   // ฝ่ายซ่อมบำรุง
  'Marketing',     // ฝ่ายการตลาด
  'Mold',          // ฝ่ายแม่พิมพ์
  'Production',    // ฝ่ายผลิต
  'Purchasing',    // ฝ่ายจัดซื้อ
  'QA',            // ฝ่ายประกันคุณภาพ
  'R&D',           // ฝ่ายวิจัยและพัฒนา
  'SCM',           // ฝ่ายห่วงโซ่อุปทาน
  'PI'             // ฝ่ายปรับปรุงกระบวนการ
]

export const TRANSACTION_TYPES = [
  { value: 'DRAW', label: 'เบิกใช้', icon: '🔻' },
  { value: 'RESTOCK', label: 'รับเข้าคลัง', icon: '🔺' },
  { value: 'TRANSFER', label: 'โอนย้าย', icon: '↔️' },
  { value: 'RETURN', label: 'คืนวัสดุ', icon: '↩️' },
  { value: 'MAINTENANCE', label: 'ส่งซ่อม', icon: '🔧' }
]

export const ITEM_CATEGORIES = [
  'Office Supplies',     // อุปกรณ์สำนักงาน
  'IT Equipment',        // อุปกรณ์คอมพิวเตอร์
  'Tools & Equipment',   // เครื่องมือ
  'Safety Equipment',    // อุปกรณ์ความปลอดภัย
  'Maintenance',         // วัสดุซ่อมบำรุง
  'Consumables',         // วัสดุสิ้นเปลือง
  'Furniture',           // เฟอร์นิเจอร์
  'Vehicles',            // ยานพาหนะ
  'Machinery',           // เครื่องจักร
  'Medical Supplies'     // อุปกรณ์การแพทย์
]

// Helper functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount || 0)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleString('th-TH')
}

export const getStockStatus = (item) => {
  if (item.quantity === 0) {
    return { status: 'out', label: 'หมดสต็อก', color: '#ef4444' }
  }
  if (item.quantity <= item.reorder_level && item.reorder_level > 0) {
    return { status: 'low', label: 'ใกล้หมด', color: '#f59e0b' }
  }
  return { status: 'ok', label: 'ปกติ', color: '#10b981' }
}
