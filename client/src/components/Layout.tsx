import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Bed, Calendar, Users, BarChart3, LogOut, Menu, X, Briefcase, UserCog, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { canViewAnalytics, canManageGuests, canManageServices, canManageUsers, canManageRooms, canManageBookings } from '../lib/roles'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeSwitcher from './ThemeSwitcher'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuOpen && !(event.target as Element).closest('.relative')) {
        setMoreMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [moreMenuOpen])

  const allNavigation = [
    { name: t('navigation.dashboard'), href: '/admin/', icon: Home, show: canViewAnalytics(user), priority: 'high' },
    { name: t('navigation.rooms'), href: '/admin/rooms', icon: Bed, show: canManageRooms(user), priority: 'high' },
    { name: t('navigation.bookings'), href: '/admin/bookings', icon: Calendar, show: canManageBookings(user), priority: 'high' },
    { name: t('navigation.guests'), href: '/admin/guests', icon: Users, show: canManageGuests(user), priority: 'medium' },
    { name: t('navigation.services'), href: '/admin/services', icon: Briefcase, show: canManageServices(user), priority: 'medium' },
    { name: t('navigation.analytics'), href: '/admin/analytics', icon: BarChart3, show: canViewAnalytics(user), priority: 'medium' },
    { name: t('navigation.users'), href: '/admin/users', icon: UserCog, show: canManageUsers(user), priority: 'low' },
  ]
  
  const navigation = allNavigation.filter(item => item.show)
  
  // Show "More" dropdown only if there are more than 5 navigation items
  const primaryNav = navigation.length > 5 ? navigation.slice(0, 5) : navigation
  const secondaryNav = navigation.length > 5 ? navigation.slice(5) : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 md:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{t('navigation.hotelAnalytics')}</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="border-t dark:border-gray-700 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({user?.role})
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('navigation.logout')}
          </button>
        </div>
      </div>
      
      {/* Desktop navigation */}
      <nav className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Mobile menu button */}
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{t('navigation.hotelAnalytics')}</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 sm:items-center">
                {primaryNav.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-primary-500 text-gray-900 dark:text-gray-100'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
                
                {secondaryNav.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        secondaryNav.some(item => location.pathname === item.href)
                          ? 'border-primary-500 text-gray-900 dark:text-gray-100'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      {t('navigation.more', 'More')}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                    
                    {moreMenuOpen && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          {secondaryNav.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.href
                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setMoreMenuOpen(false)}
                                className={`flex items-center px-4 py-2 text-sm ${
                                  isActive
                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                              >
                                <Icon className="w-4 h-4 mr-3" />
                                {item.name}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-2 md:pr-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
              <span className="text-sm text-gray-700 dark:text-gray-300 hidden lg:block">
                {user?.first_name} {user?.last_name} ({user?.role})
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center px-2 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:block ml-2">{t('navigation.logout')}</span>
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
