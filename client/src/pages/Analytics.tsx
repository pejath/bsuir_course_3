import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import type { DashboardStats, OccupancyRateStats, RevenueReport, RoomStatistics } from '../types'

function formatDateForInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function Analytics() {
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

  const [startDate, setStartDate] = useState(formatDateForInput(defaultStart))
  const [endDate, setEndDate] = useState(formatDateForInput(defaultEnd))

  const [loading, setLoading] = useState(true)
  const [revenueLoading, setRevenueLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [dashboardRes, occupancyRes, roomStatsRes, revenueRes] = await Promise.all([
        api.get<DashboardStats>('/analytics/dashboard'),
        api.get<OccupancyRateStats>('/analytics/occupancy_rate'),
        api.get<RoomStatistics>('/analytics/room_statistics'),
        api.get<RevenueReport>('/analytics/revenue_report', { params: { start_date: startDate, end_date: endDate } }),
      ])
      setDashboard(dashboardRes.data)
      setOccupancy(occupancyRes.data)
      setRoomStatistics(roomStatsRes.data)
      setRevenueReport(revenueRes.data)
    } catch (e) {
      console.error('Failed to fetch analytics:', e)
      setError('Failed to load analytics')
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
      setError('Failed to load revenue report')
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <button
          onClick={fetchAll}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Rooms</p>
          <p className="text-3xl font-bold text-gray-900">{dashboard?.total_rooms ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Available: {dashboard?.available_rooms ?? 0}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Occupancy</p>
          <p className="text-3xl font-bold text-gray-900">{occupancy?.occupancy_rate ?? 0}%</p>
          <p className="text-sm text-gray-500 mt-1">
            {occupancy?.occupied_rooms ?? 0} / {occupancy?.total_rooms ?? 0} occupied
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Bookings</p>
          <p className="text-3xl font-bold text-gray-900">{dashboard?.total_bookings ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Active: {dashboard?.active_bookings ?? 0}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Revenue (period)</p>
          <p className="text-3xl font-bold text-gray-900">${revenueReport?.total_revenue ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Payments: {revenueReport?.total_payments ?? 0}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Room status statistics</h2>
          {roomStatisticsRows.length === 0 ? (
            <div className="text-gray-500">No data</div>
          ) : (
            <div className="space-y-3">
              {roomStatisticsRows.map((row) => (
                <div key={row.status} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{row.status}</span>
                  <span className="text-sm text-gray-900">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Revenue report</h2>
            <button
              onClick={fetchRevenue}
              disabled={revenueLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {revenueLoading ? 'Loading...' : 'Apply'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Total revenue</p>
              <p className="text-2xl font-bold text-gray-900">${revenueReport?.total_revenue ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payments</p>
              <p className="text-2xl font-bold text-gray-900">{revenueReport?.total_payments ?? 0}</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-2">By payment method</h3>
          {paymentMethodRows.length === 0 ? (
            <div className="text-gray-500">No data</div>
          ) : (
            <div className="space-y-2">
              {paymentMethodRows.map((row) => (
                <div key={row.method} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{row.method}</span>
                  <span className="text-sm text-gray-900">${row.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
