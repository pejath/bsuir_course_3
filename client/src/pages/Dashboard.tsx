import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bed, Calendar, Users, DollarSign } from 'lucide-react'
import api from '../lib/api'
import type { DashboardStats } from '../types'
import { formatCurrency } from '../utils/formatters'
import { useAuthStore } from '../store/authStore'
import { canViewAnalytics } from '../lib/roles'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    // Only fetch stats if user can view analytics
    if (!canViewAnalytics(user)) {
      setLoading(false)
      return
    }
    
    try {
      const response = await api.get('/analytics/dashboard')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
  }

  const cards = [
    { name: t('dashboard.totalRooms'), value: stats?.total_rooms || 0, icon: Bed, color: 'bg-blue-500' },
    { name: t('dashboard.availableRooms'), value: stats?.available_rooms || 0, icon: Bed, color: 'bg-green-500' },
    { name: t('dashboard.activeBookings'), value: stats?.active_bookings || 0, icon: Calendar, color: 'bg-yellow-500' },
    { name: t('dashboard.totalGuests'), value: stats?.total_guests || 0, icon: Users, color: 'bg-purple-500' },
    { name: t('dashboard.totalRevenue'), value: formatCurrency(stats?.total_revenue || 0), icon: DollarSign, color: 'bg-emerald-500' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('dashboard.title')}</h1>
      
      {canViewAnalytics(user) ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{card.name}</dt>
                          <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.quickStats')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.occupiedRooms')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.occupied_rooms || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.upcomingBookings')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.upcoming_bookings || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.totalBookings')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_bookings || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.occupancyRate')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.total_rooms ? Math.round((stats.occupied_rooms / stats.total_rooms) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.noAnalyticsAccess', 'You do not have permission to view analytics data.')}
          </p>
        </div>
      )}
    </div>
  )
}
