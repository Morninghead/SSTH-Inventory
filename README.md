# SSTH Inventory System v2.0

🎉 **Clean, rebuilt inventory management system with proper TypeScript and modern architecture**

## ✨ What's New in V2

- ✅ Clean Vite + React + TypeScript setup
- ✅ Proper type safety throughout
- ✅ Working authentication system
- ✅ Tailwind CSS v3 for styling
- ✅ React Router for navigation
- ✅ Supabase integration
- ✅ Production-ready build process
- ✅ No TypeScript errors!

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (existing database preserved)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### First Login

Use your existing credentials:
- Email: `nopanat.aplus@gmail.com`
- Password: (your password - reset if needed)

---

## 📁 Project Structure

```
ssth-inventory-v2/
├── src/
│   ├── components/       # React components organized by feature
│   ├── contexts/         # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core libraries (Supabase client)
│   ├── pages/            # Page components
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main app with routing
│
├── .env                  # Environment variables (configured)
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🎯 Current Features

### ✅ Completed
- [x] Authentication system
  - [x] Login/Logout
  - [x] Password reset email flow
  - [x] Role-based access control (5 roles: developer/admin/manager/user/viewer)
- [x] Protected routes
- [x] User profile management
- [x] Dashboard page
- [x] Responsive design

### 🔨 Next to Build
- [ ] Inventory management pages
- [ ] Transaction forms (Issue/Receive)
- [ ] Purchase order management
- [ ] Reports & analytics

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite 7
- **Styling:** Tailwind CSS 3
- **Routing:** React Router 6
- **Backend:** Supabase (PostgreSQL + Auth)
- **Charts:** Chart.js 4
- **Icons:** Lucide React

---

## 📝 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## 🚢 Deployment to Netlify

1. Connect GitHub repo to Netlify
2. Build settings:
   - Command: `npm run build`
   - Publish directory: `dist`
3. Set environment variables in Netlify dashboard

---

## 📚 Documentation

- **Migration Plan:** `../SSTH-Inventory/MIGRATION-PLAN.md`
- **Business Logic:** `../SSTH-Inventory/BUSINESS-LOGIC.md`
- **Supabase Config:** `../SSTH-Inventory/SUPABASE-CONFIG.md`

---

## 👥 User Roles

| Role | Level | Access |
|------|-------|--------|
| **Developer** | 4 | Full system access |
| **Admin** | 3 | User management, all features |
| **Manager** | 2 | Purchasing, auditing |
| **User** | 1 | Inventory operations |
| **Viewer** | 0 | Read-only access |

---

**Built with ❤️ for Software Solutions Thailand**
