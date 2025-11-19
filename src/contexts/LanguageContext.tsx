import React, { createContext, useContext, useState } from 'react'

type Language = 'en' | 'th'

interface Translations {
  [key: string]: {
    en: string
    th: string
  }
}

const translations: Translations = {
  // App Title
  appTitle: {
    en: 'SSTH Inventory',
    th: 'ระบบคงคลัง SSTH'
  },

  // Navigation
  dashboard: {
    en: 'Dashboard',
    th: 'แดชบอร์ด'
  },
  inventory: {
    en: 'Inventory',
    th: 'คลังสินค้า'
  },
  transactions: {
    en: 'Transactions',
    th: 'ธุรกรรม'
  },
  purchasing: {
    en: 'Purchasing',
    th: 'การจัดซื้อ'
  },
  reports: {
    en: 'Reports',
    th: 'รายงาน'
  },
  users: {
    en: 'Users',
    th: 'ผู้ใช้งาน'
  },
  settings: {
    en: 'Settings',
    th: 'การตั้งค่า'
  },

  // Login
  signIn: {
    en: 'Sign In',
    th: 'เข้าสู่ระบบ'
  },
  emailAddress: {
    en: 'Email address',
    th: 'อีเมล'
  },
  password: {
    en: 'Password',
    th: 'รหัสผ่าน'
  },
  loading: {
    en: 'Loading...',
    th: 'กำลังโหลด...'
  },

  // Dashboard
  totalItems: {
    en: 'Total Items',
    th: 'รายการทั้งหมด'
  },
  lowStock: {
    en: 'Low Stock Items',
    th: 'สินค้าใกล้หมด'
  },
  totalValue: {
    en: 'Total Inventory Value',
    th: 'มูลค่าคงคลังทั้งหมด'
  },
  outOfStock: {
    en: 'Out of Stock',
    th: 'สินค้าหมด'
  },

  // Inventory
  addItem: {
    en: 'Add Item',
    th: 'เพิ่มรายการ'
  },
  edit: {
    en: 'Edit',
    th: 'แก้ไข'
  },
  delete: {
    en: 'Delete',
    th: 'ลบ'
  },
  itemCode: {
    en: 'Item Code',
    th: 'รหัสสินค้า'
  },
  description: {
    en: 'Description',
    th: 'รายละเอียด'
  },
  category: {
    en: 'Category',
    th: 'หมวดหมู่'
  },
  quantity: {
    en: 'Quantity',
    th: 'จำนวน'
  },
  unitCost: {
    en: 'Unit Cost',
    th: 'ราคาต่อหน่วย'
  },

  // Transactions
  issueTransaction: {
    en: 'Issue Transaction',
    th: 'เบิกจ่าย'
  },
  receiveTransaction: {
    en: 'Receive Transaction',
    th: 'รับเข้า'
  },
  adjustment: {
    en: 'Adjustment',
    th: 'ปรับยอด'
  },
  transactionHistory: {
    en: 'Transaction History',
    th: 'ประวัติธุรกรรม'
  },
  department: {
    en: 'Department',
    th: 'แผนก'
  },
  referenceNumber: {
    en: 'Reference Number',
    th: 'เลขที่อ้างอิง'
  },
  notes: {
    en: 'Notes',
    th: 'บันทึก'
  },
  createIssueTransaction: {
    en: 'Create Issue Transaction',
    th: 'สร้างรายการเบิกจ่าย'
  },
  createReceiveTransaction: {
    en: 'Create Receive Transaction',
    th: 'สร้างรายการรับเข้า'
  },
  createAdjustment: {
    en: 'Create Adjustment',
    th: 'สร้างรายการปรับยอด'
  },

  // Common
  save: {
    en: 'Save',
    th: 'บันทึก'
  },
  cancel: {
    en: 'Cancel',
    th: 'ยกเลิก'
  },
  close: {
    en: 'Close',
    th: 'ปิด'
  },
  confirm: {
    en: 'Confirm',
    th: 'ยืนยัน'
  },
  success: {
    en: 'Success',
    th: 'สำเร็จ'
  },
  error: {
    en: 'Error',
    th: 'ข้อผิดพลาด'
  },
  warning: {
    en: 'Warning',
    th: 'คำเตือน'
  },

  // Search
  search: {
    en: 'Search',
    th: 'ค้นหา'
  },
  filter: {
    en: 'Filter',
    th: 'กรอง'
  },

  // Status
  inStock: {
    en: 'In Stock',
    th: 'มีสินค้า'
  },
  lowStockItems: {
    en: 'Low Stock Items',
    th: 'สินค้าใกล้หมด'
  },

  // Additional translations for complete bilingual support
  home: {
    en: 'Home',
    th: 'หน้าแรก'
  },
  logout: {
    en: 'Logout',
    th: 'ออกจากระบบ'
  },
  welcome: {
    en: 'Welcome',
    th: 'ยินดีต้อนรับ'
  },
  selectDepartment: {
    en: 'Select department',
    th: 'เลือกแผนก'
  },
  addNewItem: {
    en: 'Add Item',
    th: 'เพิ่มรายการ'
  },
  editItem: {
    en: 'Edit Item',
    th: 'แก้ไขรายการ'
  },
  deleteItem: {
    en: 'Delete Item',
    th: 'ลบรายการ'
  },
  itemName: {
    en: 'Item Name',
    th: 'ชื่อรายการ'
  },
  searchItems: {
    en: 'Search items...',
    th: 'ค้นหารายการ...'
  },
  allCategories: {
    en: 'All Categories',
    th: 'ทุกหมวดหมู่'
  },
  createTransaction: {
    en: 'Create Transaction',
    th: 'สร้างธุรกรรม'
  },
  stockAdjustment: {
    en: 'Adjustment',
    th: 'ปรับยอด'
  },
  history: {
    en: 'History',
    th: 'ประวัติ'
  },
  selectItem: {
    en: 'Select item...',
    th: 'เลือกรายการ...'
  },
  available: {
    en: 'Available',
    th: 'ที่มี'
  },
  unit: {
    en: 'Unit',
    th: 'หน่วย'
  },
  actions: {
    en: 'Actions',
    th: 'การดำเนินการ'
  },
  clear: {
    en: 'Clear',
    th: 'ล้าง'
  },
  reset: {
    en: 'Reset',
    th: 'รีเซ็ต'
  },
  submit: {
    en: 'Submit',
    th: 'ส่ง'
  },
  closeModal: {
    en: 'Close',
    th: 'ปิด'
  },
  back: {
    en: 'Back',
    th: 'กลับ'
  },
  next: {
    en: 'Next',
    th: 'ถัดไป'
  },
  previous: {
    en: 'Previous',
    th: 'ก่อนหน้า'
  },
  page: {
    en: 'Page',
    th: 'หน้า'
  },
  of: {
    en: 'of',
    th: 'จาก'
  },
  noDataFound: {
    en: 'No data found',
    th: 'ไม่พบข้อมูล'
  },
  pleaseSelect: {
    en: 'Please select...',
    th: 'กรุณาเลือก...'
  },
  optional: {
    en: '(optional)',
    th: '(ไม่จำเป็น)'
  },
  required: {
    en: 'Required',
    th: 'จำเป็น'
  },
  yes: {
    en: 'Yes',
    th: 'ใช่'
  },
  no: {
    en: 'No',
    th: 'ไม่'
  },
  confirmDelete: {
    en: 'Are you sure you want to delete this item?',
    th: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?'
  },
  transactionCreated: {
    en: 'Transaction created successfully',
    th: 'สร้างธุรกรรมสำเร็จ'
  },
  transactionFailed: {
    en: 'Failed to create transaction',
    th: 'สร้างธุรกรรมไม่สำเร็จ'
  },
  itemCreated: {
    en: 'Item created successfully',
    th: 'สร้างรายการสำเร็จ'
  },
  itemUpdated: {
    en: 'Item updated successfully',
    th: 'อัปเดตรายการสำเร็จ'
  },
  itemDeleted: {
    en: 'Item deleted successfully',
    th: 'ลบรายการสำเร็จ'
  },
  insufficientStock: {
    en: 'Insufficient stock',
    th: 'สินค้าไม่เพียงพอ'
  },
  selectADepartment: {
    en: 'Please select a department',
    th: 'กรุณาเลือกแผนก'
  },
  selectAnItem: {
    en: 'Please select an item',
    th: 'กรุณาเลือกรายการ'
  },
  enterValidQuantity: {
    en: 'Please enter a valid quantity',
    th: 'กรุณาป้อนจำนวนที่ถูกต้อง'
  },
  quantityGreaterThanZero: {
    en: 'Quantity must be greater than 0',
    th: 'จำนวนต้องมากกว่า 0'
  },
  addAtLeastOneItem: {
    en: 'Please add at least one item',
    th: 'กรุณาเพิ่มอย่างน้อย 1 รายการ'
  },
    confirmAction: {
    en: 'Confirm Action',
    th: 'ยืนยันการดำเนินการ'
  },
  areYouSure: {
    en: 'Are you sure you want to proceed?',
    th: 'คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?'
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en')

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}