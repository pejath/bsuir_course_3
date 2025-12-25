import { useEffect, useState } from 'react'
import api from '../lib/api'

interface ActivityData {
  room_id: number
  room_number: string
  year: number
  start_date: string
  end_date: string
  activity: Record<string, string>
}

interface RoomActivityChartProps {
  roomId: number
}

export default function RoomActivityChart({ roomId }: RoomActivityChartProps) {
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true)
      try {
        const response = await api.get(`/rooms/${roomId}/activity`, {
          params: { year: selectedYear }
        })
        setActivityData(response.data)
      } catch (error) {
        console.error('Failed to fetch room activity:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchActivity()
  }, [roomId, selectedYear])

  if (loading) {
    return <div className="text-center py-4 text-sm text-gray-500">Loading activity...</div>
  }

  if (!activityData) {
    return <div className="text-center py-4 text-sm text-red-500">Failed to load activity data</div>
  }

  const startDate = new Date(activityData.start_date)
  const endDate = new Date(activityData.end_date)
  
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  
  const firstDayOfWeek = new Date(startDate)
  const dayOfWeek = firstDayOfWeek.getDay()
  if (dayOfWeek > 0) {
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push(new Date(0))
    }
  }
  
  const current = new Date(startDate)
  while (current <= endDate) {
    currentWeek.push(new Date(current))
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(0))
    }
    weeks.push(currentWeek)
  }

  const getColor = (date: Date): string => {
    if (date.getTime() === 0) return 'bg-transparent'
    
    const dateStr = date.toISOString().split('T')[0]
    const status = activityData.activity[dateStr] || 'available'
    
    switch (status) {
      case 'occupied':
        return 'bg-green-500 border border-green-600'
      case 'reserved':
        return 'bg-yellow-400 border border-yellow-500'
      case 'maintenance':
        return 'bg-orange-400 border border-orange-500'
      case 'available':
        return 'bg-gray-100 border border-gray-200'
      default:
        return 'bg-gray-100 border border-gray-200'
    }
  }

  const getTooltip = (date: Date): string => {
    if (date.getTime() === 0) return ''
    
    const dateStr = date.toISOString().split('T')[0]
    const status = activityData.activity[dateStr] || 'available'
    
    const statusText = {
      'occupied': 'Occupied',
      'reserved': 'Reserved',
      'available': 'Available',
      'maintenance': 'Maintenance'
    }[status] || status
    
    return `${dateStr}: ${statusText}`
  }

  const months: string[] = []
  const monthPositions: number[] = []
  
  months.push(startDate.toLocaleString('en', { month: 'short' }))
  monthPositions.push(0)
  
  let currentMonth = startDate.getMonth()
  
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i]
    for (const date of week) {
      if (date.getTime() !== 0) {
        const month = date.getMonth()
        if (month !== currentMonth) {
          currentMonth = month
          months.push(date.toLocaleString('en', { month: 'short' }))
          monthPositions.push(i)
        }
        break
      }
    }
  }

  const totalDays = Object.keys(activityData.activity).length
  const occupiedDays = Object.values(activityData.activity).filter(v => v === 'occupied').length
  const reservedDays = Object.values(activityData.activity).filter(v => v === 'reserved').length
  const occupancyRate = totalDays > 0 ? ((occupiedDays / totalDays) * 100).toFixed(1) : '0.0'

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="py-6 px-8 bg-gray-50 border-t border-gray-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            Room {activityData.room_number} - Occupancy Activity
          </h4>
          <p className="text-xs text-gray-600">
            <span className="font-medium text-green-600">{occupiedDays}</span> occupied, 
            <span className="font-medium text-yellow-600 ml-1">{reservedDays}</span> reserved, 
            <span className="font-medium text-gray-600 ml-1">{totalDays - occupiedDays - reservedDays}</span> available
            <span className="ml-2 text-gray-700">({occupancyRate}% occupancy rate)</span>
          </p>
        </div>
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1 mb-2 text-xs text-gray-500">
            {months.map((month, idx) => (
              <div
                key={idx}
                style={{ 
                  marginLeft: idx === 0 
                    ? '0' 
                    : `${(monthPositions[idx] - monthPositions[idx - 1]) * 10}px` 
                }}
              >
                {month}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            <div className="flex flex-col gap-1 text-xs text-gray-500 pr-2">
              <div style={{ height: '12px' }}>Mon</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px' }}>Wed</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px' }}>Fri</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px' }}>Sun</div>
            </div>

            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((date, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`w-3 h-3 rounded-sm ${getColor(date)} cursor-pointer transition-all hover:ring-2 hover:ring-gray-400`}
                      title={getTooltip(date)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 border border-yellow-500 rounded-sm" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 border border-orange-500 rounded-sm" />
              <span>Maintenance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
