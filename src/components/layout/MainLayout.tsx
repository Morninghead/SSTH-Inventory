import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../i18n/I18nProvider'
import LanguageSwitcher from '../i18n/LanguageSwitcher'
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  Building2,
  LogOut,
  Menu,
  X,
  Calendar,
} from 'lucide-react'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const navItems = [
    { path: '/dashboard', labelKey: 'navigation.dashboard', icon: LayoutDashboard, minRole: 'viewer' },
    { path: '/inventory', labelKey: 'navigation.inventory', icon: Package, minRole: 'user' },
    { path: '/transactions', labelKey: 'navigation.transactions', icon: ArrowRightLeft, minRole: 'user' },
    { path: '/purchasing', labelKey: 'navigation.purchasing', icon: ShoppingCart, minRole: 'admin' },
    { path: '/planning', labelKey: 'navigation.planning', icon: Calendar, minRole: 'user' },
    { path: '/vendors', labelKey: 'navigation.vendors', icon: Building2, minRole: 'admin' },
    { path: '/reports', labelKey: 'navigation.reports', icon: BarChart3, minRole: 'viewer' },
    { path: '/users', labelKey: 'navigation.users', icon: Users, minRole: 'admin' },
    { path: '/settings', labelKey: 'navigation.settings', icon: Settings, minRole: 'admin' },
  ]

  // Detect screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isSidebarOpen])

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button - Mobile Only */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>

              <div className="flex items-center">
                <span className="text-2xl">📦</span>
                <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900 hidden sm:inline">
                  {t('appTitle')}
                </span>
                <span className="ml-2 text-lg font-bold text-gray-900 sm:hidden">
                  SSTH
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Language Toggle */}
              <LanguageSwitcher />


              {/* User Info - Hidden on very small screens */}
              <div className="hidden sm:block text-sm text-gray-700">
                <span className="font-medium">{profile?.full_name || 'User'}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {profile?.role}
                </span>
              </div>


              {/* Sign Out Button */}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('navigation.signOut')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 z-40
            w-64 bg-white shadow-lg lg:shadow-sm
            min-h-[calc(100vh-4rem)]
            transform transition-transform duration-300 ease-in-out
            ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
            lg:translate-x-0
          `}
        >
          <nav className="px-4 py-6 space-y-1">
            {/* Mobile User Info */}
            <div className="lg:hidden pb-4 mb-4 border-b border-gray-200">
              <div className="text-sm text-gray-700">
                <div className="font-medium">{profile?.full_name || 'User'}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {profile?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActivePath(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
