# 🚀 SSTH Inventory - Live Deployment

**Live URL:** https://ssth-inventory.netlify.app/
**Deployed:** November 5, 2025
**Status:** ✅ Live on Netlify

---

## 🔧 Required Supabase Configuration

### 1. Authentication URLs (REQUIRED)

**URL:** https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/auth/url-configuration

**Site URL:**
```
https://ssth-inventory.netlify.app
```

**Redirect URLs:** (Add all three)
```
https://ssth-inventory.netlify.app/*
https://ssth-inventory.netlify.app/reset-password
http://localhost:5173/*
```

**Action:** Click "Save"

---

### 2. Storage CORS Configuration

**URL:** https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/storage/buckets/inventory-items

**Allowed Origins:**
```
https://ssth-inventory.netlify.app
http://localhost:5173
```

**Action:** Click "Save"

---

## 🔐 Login Credentials

**Admin Account:**
```
Email:    nopanat.aplus@gmail.com
Password: 1234567890
```

---

## ✅ Testing Checklist

After configuring Supabase, test these features:

- [ ] **Login Page:** Visit https://ssth-inventory.netlify.app/ - Should show login form
- [ ] **Authentication:** Login with credentials above
- [ ] **Dashboard:** View real-time KPIs (Total Items, Low Stock, etc.)
- [ ] **Inventory:** View items list with images
- [ ] **Add Item:** Create new item with image upload
- [ ] **User Management:** View and manage users
- [ ] **Transactions:** Access Issue/Receive forms
- [ ] **Navigation:** All sidebar menu items work
- [ ] **Logout:** Sign out and login again

---

## 🎯 What's Deployed

### ✅ Complete Features (100%)
- Authentication & Authorization (5 user roles)
- Dashboard with real-time KPIs
- Inventory Management (full CRUD)
- Item Image Upload (Supabase Storage)
- User Management (add/edit/delete/activate)
- Navigation & Layout

### 🔨 Partial Features (40%)
- Transaction Forms (Issue/Receive - forms created, logic pending)

### 🔜 Planned Features (0%)
- Complete Transaction Processing (stock updates, validation)
- Purchasing Module (Purchase Orders)
- Reports Module (charts, exports)
- Settings Module

---

## 📊 Deployment Details

**Platform:** Netlify
**Repository:** https://github.com/Morninghead/SSTH-Inventory
**Branch:** main
**Build Command:** `npm run build`
**Publish Directory:** `dist`
**Node Version:** 18

**Environment Variables:**
```
VITE_SUPABASE_URL=https://viabjxdggrdarcveaxam.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...truncated
```

---

## 🔄 Updating the Live Site

### Automatic Deployment (Configured)
Any push to the `main` branch will automatically trigger a new deployment on Netlify.

**Workflow:**
1. Make changes locally
2. Test with `npm run dev`
3. Commit changes: `git add . && git commit -m "Description"`
4. Push to GitHub: `git push origin main`
5. Netlify auto-deploys in 2-3 minutes ✨

### Manual Deployment
```bash
# Build locally
npm run build

# Deploy via Netlify CLI
netlify deploy --prod --dir=dist
```

---

## 🐛 Troubleshooting

### Login Issues
**Problem:** Can't login, "Invalid credentials" or "Unauthorized"
**Solution:**
1. Verify Supabase URLs are configured correctly (Step 1 above)
2. Wait 1-2 minutes for Supabase to update
3. Clear browser cache and try again

### Images Not Loading
**Problem:** Item images show placeholder instead of actual image
**Solution:**
1. Configure Storage CORS (Step 2 above)
2. Verify bucket is public or has proper RLS policies
3. Check browser console for CORS errors

### Build Failures
**Problem:** Netlify build fails
**Solution:**
1. Check build log in Netlify dashboard
2. Verify environment variables are set
3. Test build locally: `npm run build`
4. Push fix to main branch

### 404 on Page Refresh
**Problem:** Refreshing page shows 404 error
**Solution:** Already configured! The `_redirects` file handles SPA routing.

---

## 📞 Support

**Supabase Dashboard:** https://supabase.com/dashboard/project/viabjxdggrdarcveaxam
**Netlify Dashboard:** https://app.netlify.com/sites/ssth-inventory
**GitHub Repository:** https://github.com/Morninghead/SSTH-Inventory

**Documentation:**
- `CLAUDE.md` - Complete project documentation
- `DEPLOY-NOW.md` - Deployment guide
- `IMAGE-UPLOAD-SETUP.md` - Image upload configuration
- `PASSWORD-RESET-GUIDE.md` - Password reset instructions

---

## 🎉 Success!

Your SSTH Inventory System is now live and accessible worldwide at:
**https://ssth-inventory.netlify.app/**

**Next Steps:**
1. Configure Supabase (above)
2. Test all features (checklist above)
3. Complete Transaction module
4. Build Purchasing & Reports modules

---

**Last Updated:** November 5, 2025
**Version:** 2.0 Production
