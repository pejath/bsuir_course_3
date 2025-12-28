import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../lib/api'
import type { DashboardStats, OccupancyRateStats, RoomStatistics, RevenueReport, RevenueTrendData, BookingsTrendData } from '../types'
import { formatCurrency, formatStatus, formatPaymentMethod } from '../utils/formatters'

function formatDateForInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function Analytics() {
  const { t } = useTranslation()
  const defaultStart = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    return d
  }, [])

  const defaultEnd = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    d.setDate(0)
    return d
  }, [])

  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [occupancy, setOccupancy] = useState<OccupancyRateStats | null>(null)
  const [roomStatistics, setRoomStatistics] = useState<RoomStatistics | null>(null)
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null)
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendData[]>([])
  const [bookingsTrend, setBookingsTrend] = useState<BookingsTrendData | null>(null)
  const [occupancyTrend, setOccupancyTrend] = useState<RevenueTrendData[]>([])
  const [leadTimeStats, setLeadTimeStats] = useState<{ average_lead_time: number } | null>(null)
  const [topRoomTypes, setTopRoomTypes] = useState<{ room_type: string; revenue: number; bookings: number }[]>([])
  const [guestCountries, setGuestCountries] = useState<{ country: string; count: number }[]>([])

  const [startDate, setStartDate] = useState(formatDateForInput(defaultStart))
  const [endDate, setEndDate] = useState(formatDateForInput(defaultEnd))

  const [loading, setLoading] = useState(true)
  const [revenueLoading, setRevenueLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [dashboardRes, occupancyRes, roomStatsRes, revenueRes, revenueTrendRes, bookingsTrendRes, occupancyTrendRes, leadTimeRes, topRoomTypesRes, guestCountriesRes] = await Promise.all([
        api.get<DashboardStats>('/analytics/dashboard'),
        api.get<OccupancyRateStats>('/analytics/occupancy_rate'),
        api.get<RoomStatistics>('/analytics/room_statistics'),
        api.get<RevenueReport>('/analytics/revenue_report', { params: { start_date: startDate, end_date: endDate } }),
        api.get<RevenueTrendData[]>('/analytics/revenue_trend'),
        api.get<BookingsTrendData>('/analytics/bookings_trend'),
        api.get<RevenueTrendData[]>('/analytics/occupancy_trend'),
        api.get<{ average_lead_time: number }>('/analytics/lead_time_stats'),
        api.get<{ room_type: string; revenue: number; bookings: number }[]>('/analytics/top_room_types'),
        api.get<{ country: string; count: number }[]>('/analytics/guest_countries'),
      ])
      setDashboard(dashboardRes.data)
      setOccupancy(occupancyRes.data)
      setRoomStatistics(roomStatsRes.data)
      setRevenueReport(revenueRes.data)
      setRevenueTrend(revenueTrendRes.data)
      setBookingsTrend(bookingsTrendRes.data)
      setOccupancyTrend(occupancyTrendRes.data)
      setLeadTimeStats(leadTimeRes.data)
      setTopRoomTypes(topRoomTypesRes.data)
      setGuestCountries(guestCountriesRes.data)
    } catch (e) {
      console.error('Failed to fetch analytics:', e)
      setError(t('analytics.loadError'))
    } finally {
      setLoading(false)
    }
  }, [endDate, startDate])

  const fetchRevenue = useCallback(async () => {
    setError(null)
    setRevenueLoading(true)
    try {
      const revenueRes = await api.get<RevenueReport>('/analytics/revenue_report', {
        params: { start_date: startDate, end_date: endDate },
      })
      setRevenueReport(revenueRes.data)
    } catch (e) {
      console.error('Failed to fetch revenue report:', e)
      setError(t('analytics.revenueLoadError'))
    } finally {
      setRevenueLoading(false)
    }
  }, [endDate, startDate])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const roomStatisticsRows = useMemo(() => {
    if (!roomStatistics) return []
    return Object.entries(roomStatistics)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
  }, [roomStatistics])

  const paymentMethodRows = useMemo(() => {
    if (!revenueReport) return []
    return Object.entries(revenueReport.payment_methods || {})
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [revenueReport])

  const bookingsByStatusData = useMemo(() => {
    if (!bookingsTrend?.by_status) return []
    return Object.entries(bookingsTrend.by_status)
      .map(([status, count]) => ({ name: formatStatus(status), value: count }))
  }, [bookingsTrend])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('analytics.title')}</h1>
        <button
          onClick={fetchAll}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          {t('analytics.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('dashboard.totalRooms')}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.total_rooms || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('dashboard.availableRooms')}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.available_rooms || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('dashboard.activeBookings')}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.active_bookings || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('dashboard.totalGuests')}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.total_guests || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.bookings')}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard?.total_bookings ?? 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('analytics.active')}: {dashboard?.active_bookings ?? 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.occupancy')}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{occupancy?.occupancy_rate ?? 0}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {occupancy?.occupied_rooms ?? 0} / {occupancy?.total_rooms ?? 0} {t('analytics.occupied')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.revenuePeriod')}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(revenueReport?.total_revenue ?? 0)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('analytics.payments')}: {revenueReport?.total_payments ?? 0}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.roomStatusStatistics')}</h2>
          {roomStatisticsRows.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">{t('analytics.noData')}</div>
          ) : (
            <div className="space-y-3">
              {roomStatisticsRows.map((row) => (
                <div key={row.status} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatStatus(row.status)}</span>
                  <span className="text-sm text-gray-900 dark:text-white">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('analytics.revenueReport')}</h2>
            <button
              onClick={fetchRevenue}
              disabled={revenueLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {revenueLoading ? t('common.loading') : t('analytics.apply')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('analytics.startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('analytics.endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.totalRevenue')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(revenueReport?.total_revenue ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.payments')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{revenueReport?.total_payments ?? 0}</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('analytics.byPaymentMethod')}</h3>
          {paymentMethodRows.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">{t('analytics.noData')}</div>
          ) : (
            <div className="space-y-2">
              {paymentMethodRows.map((row) => (
                <div key={row.method} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formatPaymentMethod(row.method)}</span>
                  <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(row.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.revenueTrend')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgb(31 41 55)', 
                  border: '1px solid rgb(75 85 99)',
                  borderRadius: '0.5rem'
                }}
                labelStyle={{ color: 'rgb(243 244 246)' }}
                itemStyle={{ color: 'rgb(243 244 246)' }}
                formatter={(value) => formatCurrency(Number(value))} 
              />
              <Legend wrapperStyle={{ color: 'rgb(243 244 246)' }} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.occupancyTrend')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={occupancyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgb(31 41 55)', 
                  border: '1px solid rgb(75 85 99)',
                  borderRadius: '0.5rem'
                }}
                labelStyle={{ color: 'rgb(243 244 246)' }}
                itemStyle={{ color: 'rgb(243 244 246)' }}
                formatter={(value) => `${Number(value).toFixed(1)}%`} 
              />
              <Legend wrapperStyle={{ color: 'rgb(243 244 246)' }} />
              <Line type="monotone" dataKey="occupancy_rate" stroke="#10b981" strokeWidth={2} name="Occupancy Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.averageLeadTime')}</h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{leadTimeStats?.average_lead_time ?? 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('analytics.days')}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.topRoomTypes')}</h2>
          {topRoomTypes.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">{t('analytics.noData')}</div>
          ) : (
            <div className="space-y-3">
              {topRoomTypes.map((roomType, index) => (
                <div key={roomType.room_type} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">#{index + 1}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{roomType.room_type}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(roomType.revenue)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{roomType.bookings} {t('analytics.bookings')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.guestDistribution')}</h2>
          {guestCountries.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">{t('analytics.noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={guestCountries}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {guestCountries.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(31 41 55)', 
                    border: '1px solid rgb(75 85 99)',
                    borderRadius: '0.5rem'
                  }}
                  labelStyle={{ color: 'rgb(243 244 246)' }}
                  itemStyle={{ color: 'rgb(243 244 246)' }}
                />
                <Legend wrapperStyle={{ color: 'rgb(243 244 246)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.bookingsByMonth')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingsTrend?.by_month || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgb(31 41 55)', 
                  border: '1px solid rgb(75 85 99)',
                  borderRadius: '0.5rem'
                }}
                labelStyle={{ color: 'rgb(243 244 246)' }}
                itemStyle={{ color: 'rgb(243 244 246)' }}
              />
              <Legend wrapperStyle={{ color: 'rgb(243 244 246)' }} />
              <Bar dataKey="count" fill="#10b981" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.bookingsByStatus')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingsByStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {bookingsByStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgb(31 41 55)', 
                  border: '1px solid rgb(75 85 99)',
                  borderRadius: '0.5rem'
                }}
                labelStyle={{ color: 'rgb(243 244 246)' }}
                itemStyle={{ color: 'rgb(243 244 246)' }}
              />
              <Legend wrapperStyle={{ color: 'rgb(243 244 246)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
