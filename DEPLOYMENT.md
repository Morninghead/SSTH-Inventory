# Deployment Guide - SSTH Inventory System

**Last Updated:** November 5, 2025
**Build Status:** ✅ Production-Ready
**Bundle Size:** 447KB (129KB gzipped)

---

## 🚀 Quick Deployment

### Recommended Platforms
- **Netlify** (Easiest) - Free tier available
- **Vercel** (Fast) - Free tier available
- **GitHub Pages** (Free) - Requires additional config

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Ensure you have these Supabase credentials ready:

```bash
VITE_SUPABASE_URL=https://viabjxdggrdarcveaxam.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get them from:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy Project URL and anon/public key

### 2. Test Local Build
```bash
npm run build
npm run preview
```

Visit http://localhost:4173 to test production build locally.

### 3. Verify Build Output
Check that `dist/` folder contains:
- `index.html`
- `assets/` folder with JS and CSS files

---

## 🌐 Deploy to Netlify (Recommended)

### Method 1: GitHub Integration (Continuous Deployment)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and authorize
   - Select your repository

3. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

4. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add:
     - `VITE_SUPABASE_URL` = your-supabase-url
     - `VITE_SUPABASE_ANON_KEY` = your-anon-key

5. **Deploy**
   - Click "Deploy site"
   - Wait 2-3 minutes
   - Your site will be live at `https://random-name.netlify.app`

6. **Custom Domain (Optional)**
   - Go to Domain settings
   - Add your custom domain
   - Follow DNS configuration instructions

### Method 2: Manual Deployment

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify Drop**
   - Go to https://app.netlify.com/drop
   - Drag and drop the `dist` folder
   - Site goes live immediately

3. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add Supabase credentials
   - Redeploy from Deploys tab

---

## ⚡ Deploy to Vercel

### Method 1: GitHub Integration

1. **Push to GitHub** (if not already done)
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure Project**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **Deploy**
   - Click "Deploy"
   - Your site will be live at `https://your-project.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## 🔒 Security Considerations

### Environment Variables
- ✅ **NEVER** commit `.env` file to Git
- ✅ Always use `.env.example` for reference
- ✅ Add environment variables in hosting platform settings
- ✅ Supabase `anon` key is safe for client-side use (protected by RLS)

### Supabase RLS Policies
Ensure Row Level Security (RLS) policies are enabled:
1. Go to Supabase Dashboard → Authentication → Policies
2. Verify policies exist for:
   - `items` table
   - `inventory_status` table
   - `transactions` table
   - `user_profiles` table

### Authentication
- ✅ Users must login to access the system
- ✅ Protected routes check authentication
- ✅ Role-based access control active

---

## 🧪 Testing Deployment

### After Deployment

1. **Test Authentication**
   - Visit your live URL
   - Try logging in with test credentials
   - Verify redirect to dashboard

2. **Test Core Features**
   - Dashboard: Check if KPIs load
   - Inventory: View/Create/Edit/Delete items
   - Navigation: Test all menu items
   - Mobile: Test responsive design

3. **Check Console**
   - Open browser DevTools
   - Look for errors in Console
   - Verify API calls to Supabase work

4. **Performance Check**
   - Use Lighthouse in Chrome DevTools
   - Target scores:
     - Performance: >90
     - Accessibility: >90
     - Best Practices: >90
     - SEO: >80

---

## 🔄 Continuous Deployment

### Automatic Deployments (Netlify/Vercel)

Once GitHub is connected:
1. Push to `main` branch → Auto-deploys to production
2. Push to other branches → Creates preview deployment
3. Pull Requests → Auto-generates preview URLs

### Manual Redeployment

**Netlify:**
```bash
netlify deploy --prod
```

**Vercel:**
```bash
vercel --prod
```

---

## 📊 Monitoring & Analytics

### Netlify Analytics
- Go to Site → Analytics
- View page views, unique visitors, bandwidth

### Vercel Analytics
- Go to Project → Analytics
- View performance metrics, visitor data

### Supabase Logs
- Dashboard → Logs
- Monitor database queries
- Check authentication events

---

## 🐛 Troubleshooting

### Build Fails

**Issue:** TypeScript errors
```bash
# Check errors locally
npm run build

# Fix and retry
git add .
git commit -m "Fix build errors"
git push
```

**Issue:** Missing dependencies
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

**Symptoms:** Blank page, Supabase connection errors

**Solution:**
1. Check environment variables in hosting platform
2. Ensure they start with `VITE_`
3. Redeploy after adding variables
4. Clear browser cache

### 404 Errors on Refresh

**Issue:** React Router routes return 404

**Netlify Solution:**
Create `public/_redirects`:
```
/*    /index.html   200
```

**Vercel Solution:**
Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Authentication Issues

**Issue:** Can't login after deployment

**Checklist:**
1. Verify Supabase URL and key in env variables
2. Check Supabase → Authentication → URL Configuration
3. Add deployment URL to allowed redirect URLs
4. Clear browser cookies and localStorage

---

## 🎯 Post-Deployment Tasks

### 1. Update Supabase Configuration
Add your live URL to Supabase:
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://your-site.netlify.app`
3. Redirect URLs: Add your live URL

### 2. Test All User Roles
Login with different roles to verify:
- Developer (all access)
- Admin (user management)
- Manager (purchasing)
- User (inventory operations)
- Viewer (read-only)

### 3. Create Production Users
1. Supabase → Authentication → Users
2. Create admin account for production
3. Add user_profile record
4. Test login

### 4. Monitor Performance
- Set up monitoring alerts
- Check error logs daily (first week)
- Monitor Supabase usage

---

## 📈 Scaling Considerations

### Current Limits (Free Tiers)
- **Netlify:** 100GB bandwidth/month, 300 build minutes
- **Vercel:** 100GB bandwidth/month, 6000 build minutes
- **Supabase:** 500MB database, 2GB file storage, 50,000 monthly active users

### When to Upgrade
- Database > 400MB → Upgrade Supabase
- Traffic > 80GB/month → Upgrade hosting
- Need custom domain SSL → Usually included in paid plans

---

## 🔗 Useful Links

### Hosting Documentation
- **Netlify:** https://docs.netlify.com/
- **Vercel:** https://vercel.com/docs
- **Supabase:** https://supabase.com/docs

### Build Configuration
- **Vite:** https://vitejs.dev/guide/static-deploy.html
- **React Router:** https://reactrouter.com/en/main/guides/deployment

---

## ✅ Deployment Checklist

Before going live, ensure:

- [ ] Build succeeds locally (`npm run build`)
- [ ] Preview works (`npm run preview`)
- [ ] Environment variables configured
- [ ] Supabase RLS policies active
- [ ] Test user created
- [ ] Repository pushed to GitHub
- [ ] Hosting platform connected
- [ ] Environment variables added to platform
- [ ] Deployment successful
- [ ] Live site tested (login, features)
- [ ] Mobile responsive verified
- [ ] Console has no errors
- [ ] Supabase URL configuration updated
- [ ] Performance tested (Lighthouse)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Team members can access

---

## 🎉 You're Live!

**Your SSTH Inventory System is now deployed and ready for use!**

### Share Your Live URL:
- Development: `https://your-dev-site.netlify.app`
- Production: `https://your-domain.com`

### Next Steps:
1. Train users on the system
2. Import existing inventory data
3. Monitor usage and feedback
4. Plan for remaining features (Transactions, Purchasing, Reports)

---

**Need Help?**
- Check documentation in `CLAUDE.md`
- Review `README.md` for project overview
- Contact: nopanat.aplus@gmail.com

---

**Last Updated:** November 5, 2025
**Status:** 🟢 Ready for Production Deployment
