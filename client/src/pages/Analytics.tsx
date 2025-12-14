import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Analytics() {
  const [occupancyData, setOccupancyData] = useState<any>(null)
  const [roomStats, setRoomStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const [occupancyResponse, roomStatsResponse] = await Promise.all([
        api.get('/analytics/occupancy_rate'),
        api.get('/analytics/room_statistics'),
      ])
      setOccupancyData(occupancyResponse.data)
      setRoomStats(roomStatsResponse.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Occupancy Rate</h2>
          {occupancyData && (
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {occupancyData.occupancy_rate}%
              </div>
              <p className="text-sm text-gray-500">
                {occupancyData.occupied_days} / {occupancyData.total_capacity} days occupied
              </p>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Room Statistics</h2>
          <div className="space-y-3">
            {roomStats.map((stat) => (
              <div key={stat.id} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{stat.name}</span>
                <div className="text-right">
                  <div className="text-sm text-gray-900">
                    {stat.available}/{stat.total_rooms} available
                  </div>
                  <div className="text-xs text-gray-500">${stat.base_price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
