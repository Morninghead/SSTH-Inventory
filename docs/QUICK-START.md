# Quick Start - Login Instructions

## 🔐 Test User Credentials

### Option 1: Use Existing User (Reset Password First)
1. Go to http://localhost:5173/login
2. Click "Forgot your password?"
3. Enter: `nopanat.aplus@gmail.com`
4. Check your email for reset link
5. Set new password (e.g., `Password123`)
6. Login!

### Option 2: Create New Test User via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `viabjxdggrdarcveaxam`
3. Go to **Authentication** → **Users**
4. Click "**Add User**"
5. Enter:
   - Email: `admin@test.com`
   - Password: `admin123`
6. Go to **Table Editor** → **user_profiles**
7. Click "**Insert**" → "**Insert row**"
8. Fill in:
   - id: (copy the user ID from Authentication page)
   - full_name: "Admin User"
   - role: "admin"
   - is_active: true
9. Save!

### Option 3: Simple Test Credentials (If Already Created)
```
Email: admin@test.com
Password: admin123
```

---

## 🚀 After Login

Once logged in, you can:

### Dashboard (/)
- View system overview
- See KPI cards
- Check system status

### Inventory (/inventory)
- ✅ View all items
- ✅ Search items
- ✅ Create new items
- ✅ Edit existing items
- ✅ Delete items (soft delete)
- ✅ Pagination (20 items per page)

### Coming Soon
- Transactions (Issue/Receive)
- Purchase Orders
- Reports & Analytics
- User Management

---

## 🎯 Quick Test Workflow

1. **Login** at http://localhost:5173
2. Click **"Inventory"** in sidebar
3. Click **"Add Item"** button
4. Create a test item:
   - Item Code: TEST-001
   - Description: Test Product
   - Unit Cost: 10.00
5. **Edit** the item
6. **Delete** the item
7. Explore!

---

**Current URL:** http://localhost:5173
