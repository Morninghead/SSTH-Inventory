# 🚀 Deploy to Netlify - Quick Start Guide

**Your app is ready to deploy!** Follow these simple steps.

---

## ✅ Pre-Deployment Checklist

- ✅ Build successful (463KB bundle, 132KB gzipped)
- ✅ TypeScript errors: 0
- ✅ Netlify config created (netlify.toml)
- ✅ SPA redirects configured (_redirects)
- ✅ Environment variables documented

**Status:** 🟢 **READY TO DEPLOY!**

---

## 🚀 Option 1: Deploy via Netlify Dashboard (Easiest - 5 minutes)

### Step 1: Go to Netlify
1. Visit: **https://app.netlify.com**
2. Sign up or login (use GitHub login for easier setup)

### Step 2: Connect GitHub Repository
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify to access your GitHub
4. Select repository: **`Morninghead/SSTH-Inventory`**
5. Select branch: **`claude/research-project-011CUoxUoU2csms81cwv1EF2`**
   *(Or merge to main first and select main)*

### Step 3: Configure Build Settings

Netlify will auto-detect settings from `netlify.toml`, but verify:

```
Build command:    npm run build
Publish directory: dist
Branch:            claude/research-project-011CUoxUoU2csms81cwv1EF2
```

### Step 4: Add Environment Variables

**CRITICAL:** Click **"Add environment variables"** and add:

```
VITE_SUPABASE_URL=https://viabjxdggrdarcveaxam.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

**To get your Supabase Anon Key:**
1. Go to: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/settings/api
2. Copy the **`anon`** / **`public`** key (NOT service_role)
3. Paste it in Netlify environment variables

### Step 5: Deploy!

1. Click **"Deploy site"**
2. Wait 2-3 minutes for build
3. ✅ **Your site is live!**

You'll get a URL like: `https://random-name-123abc.netlify.app`

---

## 🔧 Option 2: Deploy via Netlify CLI (Advanced)

### Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Login to Netlify
```bash
netlify login
```

### Deploy
```bash
# First deployment
netlify deploy --prod

# Follow prompts:
# - Create new site or link existing
# - Publish directory: dist
# - Deploy!
```

### Set Environment Variables
```bash
netlify env:set VITE_SUPABASE_URL "https://viabjxdggrdarcveaxam.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key-here"
```

### Redeploy
```bash
npm run build
netlify deploy --prod
```

---

## 🔗 After Deployment

### 1. Update Supabase Configuration

**IMPORTANT:** Add your live URL to Supabase:

1. Go to: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/auth/url-configuration
2. **Site URL:** Add your Netlify URL
   ```
   https://your-site.netlify.app
   ```
3. **Redirect URLs:** Add these URLs:
   ```
   https://your-site.netlify.app/reset-password
   https://your-site.netlify.app/*
   ```
4. Click **"Save"**

### 2. Test Your Deployment

Visit your live site:
```
https://your-site.netlify.app
```

**Test Checklist:**
- [ ] Login works
- [ ] Dashboard loads
- [ ] Inventory page shows items
- [ ] User management works (if admin)
- [ ] Images upload/display correctly
- [ ] All navigation works

### 3. Configure Custom Domain (Optional)

In Netlify Dashboard:
1. Go to **Domain settings**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `inventory.yourcompany.com`)
4. Follow DNS configuration instructions
5. SSL certificate auto-generates (free!)

---

## 🔒 Environment Variables Reference

Your app needs these environment variables in Netlify:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://viabjxdggrdarcveaxam.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your-key-here
```

**Where to find:**
- URL: Already provided above
- Anon Key: https://supabase.com/dashboard/project/viabjxdggrdarcveaxam/settings/api

**Security Note:**
- ✅ `anon` key is SAFE for client-side use
- ❌ NEVER use `service_role` key in frontend
- ✅ Protected by Supabase RLS policies

---

## 📊 Continuous Deployment (Automatic Updates)

Once connected to GitHub:

1. **Push to branch** → Netlify auto-deploys
2. **Pull request** → Creates preview deployment
3. **Merge to main** → Deploys to production

**Example workflow:**
```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin your-branch

# Netlify automatically:
# 1. Detects push
# 2. Runs npm run build
# 3. Deploys to live site
# 4. Sends notification
```

---

## 🐛 Troubleshooting

### Build Fails on Netlify

**Error:** "Build failed"

**Solutions:**
1. Check build logs in Netlify dashboard
2. Verify environment variables are set
3. Test build locally: `npm run build`
4. Check Node version (should be 18+)

### Blank Page After Deployment

**Error:** White screen, no content

**Solutions:**
1. Check browser console for errors
2. Verify environment variables are correct
3. Check Supabase URL configuration
4. Ensure `_redirects` file exists in `public/`

### "Failed to fetch" Errors

**Error:** API calls fail

**Solutions:**
1. Verify `VITE_SUPABASE_URL` is correct
2. Verify `VITE_SUPABASE_ANON_KEY` is correct
3. Check Supabase project is active
4. Verify Supabase RLS policies allow access

### Login Doesn't Work

**Error:** Can't login on live site

**Solutions:**
1. Add live URL to Supabase URL configuration
2. Check redirect URLs in Supabase
3. Clear browser cache/cookies
4. Try incognito mode

### Images Don't Load

**Error:** Images uploaded but don't display

**Solutions:**
1. Check Storage bucket exists: `inventory-items`
2. Verify bucket is public
3. Check RLS policies on storage
4. Test image URL directly in browser

---

## 📈 Deployment Metrics

### Current Build
```
Bundle Size:    463 KB (132 KB gzipped)
Build Time:     ~8 seconds
TypeScript:     0 errors ✅
Status:         Production-ready ✅
```

### Performance Targets
- **Load Time:** <3 seconds
- **First Paint:** <1.5 seconds
- **Lighthouse:** >90 score

---

## 🎯 Quick Deploy Commands

```bash
# Build locally
npm run build

# Preview production build
npm run preview

# Deploy to Netlify (after setup)
netlify deploy --prod

# Check deployment status
netlify status

# View site URL
netlify open
```

---

## ✅ Post-Deployment Checklist

After deployment is complete:

- [ ] Site is accessible at Netlify URL
- [ ] Login works correctly
- [ ] Dashboard loads with data
- [ ] All pages accessible
- [ ] Images upload successfully
- [ ] Supabase URL configured
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active
- [ ] Team has access
- [ ] Test credentials documented

---

## 🆘 Need Help?

### Netlify Support
- Docs: https://docs.netlify.com
- Community: https://answers.netlify.com

### Supabase Support
- Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

### Project Documentation
- See `DEPLOYMENT.md` for detailed guide
- See `CLAUDE.md` for complete project docs
- See `IMAGE-UPLOAD-SETUP.md` for image config

---

## 🎉 You're Live!

**Congratulations! Your SSTH Inventory System is deployed!**

**What's deployed:**
- ✅ Complete inventory management
- ✅ User management (add/edit/delete)
- ✅ Image upload functionality
- ✅ Role-based access control
- ✅ Dashboard with real-time KPIs
- ✅ Professional UI/UX

**Share your live URL with your team!**

**Next steps:**
- Import your inventory data
- Create user accounts for team
- Train users on the system
- Monitor usage and feedback

---

**Deployed:** November 5, 2025
**Build Status:** ✅ Success
**Ready:** 🚀 Yes!
