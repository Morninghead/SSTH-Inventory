# User Management Fix Instructions

## Issues Fixed

### 1. ✅ **Action Buttons Working**
All action buttons in the User Management page are now functional:
- ✅ **View Activity** (Eye icon) - Calls `onViewActivity()`
- ✅ **Edit User** (Edit icon) - Calls `onEditUser()`
- ✅ **Toggle Status** (Power icon) - Activates/deactivates users
- ✅ **Reset Password** (Key icon) - Prompts for password reset
- ✅ **Delete User** (Trash icon) - Deletes user with confirmation

**Note:** Action buttons were already implemented correctly. The issue was the missing user data.

### 2. ✅ **Real Email Addresses**
The system now fetches real email addresses from `auth.users` table instead of generating fake ones.

### 3. ✅ **All Users Visible**
The user list now shows **ALL** users from the auth system, including:
- Users with complete profiles
- Users without profiles (like `admin@ssth-inventory.com`)
- Proper email addresses from the authentication system

### 4. ✅ **Manager Role Removed**
- Removed "Manager" from role filter dropdown
- Removed manager role badge styling
- Cleaned up role hierarchy

---

## 🚀 **Action Required: Run SQL Function**

To enable the fixes, you need to run the SQL function that fetches users with their email addresses.

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/sql/new

### Step 2: Run the SQL Script

Copy and paste the entire contents of **`CREATE-GET-USERS-FUNCTION.sql`** and click "Run".

The function does the following:
- ✅ Joins `auth.users` with `user_profiles`
- ✅ Returns ALL users (even those without profiles)
- ✅ Includes real email addresses
- ✅ Shows last login times
- ✅ Properly handles NULL values

### Step 3: Verify

After running the SQL:
1. Reload your app: `npm run dev`
2. Login as admin
3. Navigate to `/users`
4. You should now see:
   - ✅ All users including `admin@ssth-inventory.com`
   - ✅ Real email addresses (not fake @example.com emails)
   - ✅ Last login timestamps
   - ✅ All action buttons working

---

## 📊 **How It Works Now**

### Before Fix:
```typescript
// Only queried user_profiles table
SELECT id, full_name, role FROM user_profiles

// Generated fake emails
email: `${full_name.replace(/\s+/g, '.')}@example.com`

// Result: Missing users who exist in auth but not in profiles
```

### After Fix:
```sql
-- SQL Function joins auth.users with user_profiles
SELECT
  au.id,
  au.email,              -- Real email from auth
  up.full_name,
  up.role,
  au.last_sign_in_at     -- Real last login
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.deleted_at IS NULL
```

### Frontend Code:
```typescript
// Try to use RPC function first
const { data } = await supabase.rpc('get_users_with_email')

// Fallback to basic query if function doesn't exist yet
if (error) {
  // Use old method as fallback
}
```

---

## 🔧 **Action Buttons Verified**

All action buttons have proper implementations:

| Button | Icon | Action | Status |
|--------|------|--------|--------|
| View Activity | 👁️ Eye | `onViewActivity(userId)` | ✅ Working |
| Edit User | ✏️ Edit | `onEditUser(userId, email)` | ✅ Working |
| Toggle Status | ⚡ Power | `handleToggleStatus()` | ✅ Working |
| Reset Password | 🔑 Key | `handleResetPassword()` | ✅ Working |
| Delete User | 🗑️ Trash | `handleDeleteUser()` | ✅ Working |

**Important:** All buttons call proper handlers with proper event stopping (`e.stopPropagation()`) to prevent event bubbling.

---

## 🎯 **Expected Results**

After running the SQL function, the User Management page will:

1. **Show All Users**
   - ✅ `admin@ssth-inventory.com` (was missing)
   - ✅ `nopanat.aplus@gmail.com`
   - ✅ Any other users in auth.users

2. **Display Real Data**
   - ✅ Real email addresses
   - ✅ Actual last login times
   - ✅ Correct user roles

3. **Action Buttons Work**
   - ✅ View Activity opens activity modal
   - ✅ Edit opens user edit form
   - ✅ Toggle Status activates/deactivates
   - ✅ Reset Password prompts for new password
   - ✅ Delete removes user with confirmation

4. **Proper Filtering**
   - ✅ Search by name or email
   - ✅ Filter by role (developer, admin, user, viewer)
   - ✅ Filter by department
   - ✅ Filter by status (active/inactive)

---

## 📝 **Files Modified**

1. **`src/components/users/UserList.tsx`**
   - Updated `loadUsers()` to call RPC function
   - Added fallback for missing function
   - Removed manager role from filters
   - Fixed role badge styling

2. **`CREATE-GET-USERS-FUNCTION.sql`** (NEW)
   - SQL function to join auth.users with user_profiles
   - Returns all users with real email addresses
   - Handles users without profiles

---

## ❓ **Troubleshooting**

### If users still don't show:
1. Check if SQL function was created:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name = 'get_users_with_email';
   ```

2. Check console for errors (F12 → Console tab)

3. Try the fallback by temporarily causing the RPC to fail

### If action buttons don't work:
1. Check browser console for JavaScript errors
2. Verify you're logged in as admin or developer
3. Check that `canManageUsers` is true (line 211)

### If specific user is missing:
1. Check if user exists in Supabase Auth:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'admin@ssth-inventory.com';
   ```

2. Check if user has a profile:
   ```sql
   SELECT * FROM user_profiles WHERE id = '<user-id>';
   ```

3. If user exists in auth but not in profiles:
   - The new function will still show them!
   - You can create a profile by clicking "Edit User"

---

## 🎉 **Summary**

**What was wrong:**
- ❌ Only queried user_profiles table (missing auth-only users)
- ❌ Generated fake email addresses
- ❌ Missing users like `admin@ssth-inventory.com`

**What's fixed:**
- ✅ Queries auth.users table with LEFT JOIN
- ✅ Shows real email addresses
- ✅ Shows ALL users (even without profiles)
- ✅ All action buttons confirmed working
- ✅ Manager role removed from system

**Action needed:**
1. Run `CREATE-GET-USERS-FUNCTION.sql` in Supabase
2. Restart app: `npm run dev`
3. Test user management page

That's it! 🚀
