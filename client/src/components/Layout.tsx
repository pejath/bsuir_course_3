import { Link, useLocation } from 'react-router-dom'
import { Home, Bed, Calendar, Users, BarChart3, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { canViewAnalytics, canManageGuests } from '../lib/roles'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const allNavigation = [
    { name: 'Dashboard', href: '/admin/', icon: Home, show: canViewAnalytics(user) },
    { name: 'Rooms', href: '/admin/rooms', icon: Bed, show: true },
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar, show: true },
    { name: 'Guests', href: '/admin/guests', icon: Users, show: canManageGuests(user) },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, show: canViewAnalytics(user) },
  ]
  
  const navigation = allNavigation.filter(item => item.show)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600">Hotel Analytics</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {user?.first_name} {user?.last_name} ({user?.role})
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
