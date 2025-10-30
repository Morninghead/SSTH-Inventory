import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { useState } from 'react'
import Button from '../ui/Button'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'viewer' },
    { path: '/inventory', label: 'Inventory', icon: Package, minRole: 'user' },
    { path: '/purchasing', label: 'Purchasing', icon: ShoppingCart, minRole: 'manager' },
    { path: '/reports', label: 'Reports', icon: BarChart3, minRole: 'viewer' },
    { path: '/users', label: 'Users', icon: Users, minRole: 'admin' },
    { path: '/settings', label: 'Settings', icon: Settings, minRole: 'admin' },
  ]

  const isActivePath = (path: string) => {
    return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
  }

  const SidebarNav = () => (
    <nav className="flex flex-col space-y-1 p-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActivePath(item.path)

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              active
                ? 'bg-okabe-ito-blue text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/dashboard" className="flex items-center">
                <span className="text-2xl">📦</span>
                <span className="ml-2 text-lg font-bold text-gray-800">SSTH Inventory</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{profile?.full_name || 'User'}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full">
                  {profile?.role}
                </span>
              </div>
              <Button onClick={() => signOut()} variant="secondary" size="sm">
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto lg:flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-gray-200 bg-white py-4 min-h-[calc(100vh-4rem)]">
          <SidebarNav />
        </aside>

        {/* Mobile Sidebar */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)} />
            <aside className="fixed top-0 left-0 w-64 h-full bg-white z-50 p-4">
              <SidebarNav />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
