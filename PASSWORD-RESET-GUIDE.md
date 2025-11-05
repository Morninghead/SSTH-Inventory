# Password Reset Guide - SSTH Inventory System

**User:** nopanat.aplus@gmail.com
**New Password:** 1234567890

---

## 🚀 Quick Reset Methods

Choose one of these methods to reset the password:

### ✅ Method 1: Automated Script (Recommended)

**Requirements:**
- Supabase Service Role Key

**Steps:**

1. **Get Your Service Role Key**
   - Go to https://supabase.com/dashboard
   - Select project: `viabjxdggrdarcveaxam`
   - Go to **Settings** → **API** → **Project API keys**
   - Copy the **`service_role`** key (starts with `eyJ...`)
   - ⚠️ This is different from the `anon` key!

2. **Run the Reset Script**

   **Option A: Using environment variable (Recommended)**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key npm run reset-password
   ```

   **Option B: Edit the script file**
   - Open `reset-password.js`
   - Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual key
   - Run: `npm run reset-password`

3. **Login with New Credentials**
   - Email: `nopanat.aplus@gmail.com`
   - Password: `1234567890`

---

### 📝 Method 2: Supabase Dashboard (Manual)

**Steps:**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam

2. **Navigate to Authentication**
   - Click **Authentication** in left sidebar
   - Click **Users** tab

3. **Find the User**
   - Look for `nopanat.aplus@gmail.com` in the user list
   - Click on the user row

4. **Reset Password**
   - In the user details panel (right side)
   - Find **Password** section
   - Click **Send Magic Link** OR **Reset Password**

   **Option A: Magic Link**
   - Click "Send Magic Link"
   - Check email inbox for nopanat.aplus@gmail.com
   - Click the link in the email
   - Set new password to: `1234567890`

   **Option B: Direct Reset**
   - If available, click "Reset Password"
   - Enter new password: `1234567890`
   - Confirm password: `1234567890`
   - Click "Update User"

5. **Test Login**
   - Go to http://localhost:5173/login (or your deployed URL)
   - Email: `nopanat.aplus@gmail.com`
   - Password: `1234567890`

---

### 🔧 Method 3: SQL Command (Advanced)

**Steps:**

1. **Go to SQL Editor**
   - Supabase Dashboard → **SQL Editor**

2. **Run This Query**
   ```sql
   -- Update user password using Supabase auth function
   SELECT
     id,
     email,
     created_at
   FROM auth.users
   WHERE email = 'nopanat.aplus@gmail.com';
   ```

3. **Note the User ID**, then run:
   ```sql
   -- This requires admin/service role access
   -- Use the Supabase Dashboard method instead for security
   ```

   **Note:** SQL password updates are restricted for security. Use Method 1 or 2 instead.

---

## ⚠️ Important Security Notes

1. **Service Role Key Security**
   - ⚠️ NEVER commit service role key to git
   - ⚠️ NEVER share service role key publicly
   - ✅ Use environment variables only
   - ✅ Keep it secret like a database password

2. **Password Strength**
   - Current password `1234567890` is WEAK
   - ✅ Change it after first login to something stronger
   - Recommended: 12+ characters, mix of letters/numbers/symbols

3. **After Reset**
   - Delete `reset-password.js` if service role key was hardcoded
   - Clear command history if key was in terminal
   - Consider using password manager

---

## 🧪 Testing the Password

After reset, test the login:

1. **Local Development**
   ```bash
   npm run dev
   ```
   - Visit: http://localhost:5173/login
   - Email: `nopanat.aplus@gmail.com`
   - Password: `1234567890`

2. **Production**
   - Visit your deployed URL
   - Use same credentials
   - Ensure you're redirected to dashboard

---

## 🐛 Troubleshooting

### Script Method Issues

**Error: "Service Role Key not provided"**
```bash
# Make sure you're using the service_role key, not anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... npm run reset-password
```

**Error: "User not found"**
- Verify email is exactly: `nopanat.aplus@gmail.com`
- Check in Supabase Dashboard → Authentication → Users
- User might have different email or be deleted

**Error: "Failed to update password"**
- Service role key might be invalid
- Project might be paused
- Check network connection

### Dashboard Method Issues

**Can't find user in list**
- Use search box to filter users
- Check if user was deleted
- Verify correct project selected

**Magic link not received**
- Check spam folder
- Verify email address is correct
- Try "Resend" option
- Email might be blocked by server

**Password won't update**
- Check password requirements (min 6 characters)
- Ensure password matches confirmation
- Try logging out and back into Supabase

### Login Issues After Reset

**Still can't login**
1. Clear browser cache and cookies
2. Try incognito/private window
3. Check browser console for errors
4. Verify Supabase project is active

**Redirected back to login**
- Check `user_profiles` table has record for this user
- Verify `is_active` is true in user_profiles
- Check browser console for errors

---

## 📋 Verification Checklist

After password reset:

- [ ] Password reset completed successfully
- [ ] Can login at http://localhost:5173/login
- [ ] Redirected to dashboard after login
- [ ] User profile loads correctly
- [ ] User name displays in header
- [ ] Navigation menu works
- [ ] Can access inventory page
- [ ] Dashboard KPIs load

---

## 🔐 Recommended Next Steps

1. **Login with new password** ✅
2. **Verify everything works** ✅
3. **Go to Settings** → Change password to something stronger
4. **Enable 2FA** (if available in Supabase)
5. **Delete reset-password.js** (if you hardcoded the service key)

---

## 📞 Still Need Help?

**Common Commands:**

```bash
# Check if Supabase is accessible
curl https://viabjxdggrdarcveaxam.supabase.co

# Run reset script with key
SUPABASE_SERVICE_ROLE_KEY=your-key npm run reset-password

# Start development server
npm run dev

# Build and test production
npm run build && npm run preview
```

**Resources:**
- Supabase Dashboard: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam
- Documentation: See `CLAUDE.md` and `README.md`
- Deployment: See `DEPLOYMENT.md`

---

**Last Updated:** November 5, 2025
**Status:** Ready to Reset Password
