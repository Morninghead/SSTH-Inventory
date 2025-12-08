import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 500, // Reduced from 1000 to 500KB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core vendor chunks - keep them separate and small
          if (id.includes('react')) {
            return 'vendor-react-core'
          }
          if (id.includes('react-dom')) {
            return 'vendor-react-dom'
          }
          if (id.includes('react-router-dom')) {
            return 'vendor-router'
          }
          if (id.includes('supabase')) {
            return 'vendor-supabase'
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }
          if (id.includes('date-fns')) {
            return 'vendor-date'
          }
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'vendor-charts'
          }
          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'vendor-pdf'
          }
          if (id.includes('xlsx')) {
            return 'vendor-excel'
          }

          // Split UI components into smaller chunks
          if (id.includes('/components/ui/Input') || id.includes('/components/ui/Button') || id.includes('/components/ui/Card')) {
            return 'ui-base'
          }
          if (id.includes('/components/ui/Modal') || id.includes('/components/ui/ConfirmDialog')) {
            return 'ui-modals'
          }
          if (id.includes('/components/ui/')) {
            return 'ui-other'
          }

          // Feature-based chunks - keep them small
          if (id.includes('/contexts/AuthContext') || id.includes('/components/auth/') || id.includes('/pages/LoginPage')) {
            return 'feature-auth'
          }
          if (id.includes('/pages/ResetPasswordPage')) {
            return 'feature-password'
          }
          if (id.includes('/pages/InventoryPage')) {
            return 'feature-inventory-page'
          }
          if (id.includes('/components/inventory/ItemFormModal')) {
            return 'feature-inventory-form'
          }
          if (id.includes('/components/inventory/') && !id.includes('ItemFormModal')) {
            return 'feature-inventory-other'
          }
          if (id.includes('/pages/TransactionsPage')) {
            return 'feature-transactions-page'
          }
          if (id.includes('/components/transactions/')) {
            return 'feature-transactions-components'
          }
          if (id.includes('/pages/PurchasingPage')) {
            return 'feature-purchasing-page'
          }
          if (id.includes('/components/purchasing/')) {
            return 'feature-purchasing-components'
          }
          if (id.includes('/components/layout/MainLayout')) {
            return 'feature-layout'
          }
          if (id.includes('/pages/DashboardPage')) {
            return 'feature-dashboard'
          }
          if (id.includes('/contexts/LanguageContext')) {
            return 'feature-i18n'
          }

          // Types chunk - database types are large
          if (id.includes('/types/database.types')) {
            return 'types-database'
          }
        }
      }
    },
    target: 'esnext', // Better optimization
    minify: 'esbuild', // Use esbuild for faster builds
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
