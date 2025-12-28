import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search, Calendar, Users, MapPin, ChevronRight } from 'lucide-react'
import publicApi from '../lib/publicApi'
import type { Room, RoomType } from '../types'

interface PaginationMeta {
  page: number
  limit: number
  pages: number
  count: number
  from: number
  to: number
  prev: number | null
  next: number | null
}

export default function PublicSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  const [filters, setFilters] = useState({
    room_type_id: '',
    floor: '',
    min_capacity: '',
    check_in_date: '',
    check_out_date: ''
  })

  useEffect(() => {
    fetchRoomTypes()
    fetchRooms()
  }, [])

  useEffect(() => {
    fetchRooms(currentPage)
  }, [currentPage, filters])

  const fetchRoomTypes = async () => {
    try {
      const response = await publicApi.get('/public/room_types')
      setRoomTypes(response.data)
    } catch (error) {
      console.error('Failed to fetch room types:', error)
    }
  }

  const fetchRooms = async (page: number = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 12 }
      if (filters.room_type_id) params.room_type_id = filters.room_type_id
      if (filters.floor) params.floor = filters.floor
      if (filters.min_capacity) params.min_capacity = filters.min_capacity
      if (filters.check_in_date) params.check_in_date = filters.check_in_date
      if (filters.check_out_date) params.check_out_date = filters.check_out_date
      
      const response = await publicApi.get('/public/rooms', { params })
      setRooms(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const handleRoomClick = (roomId: number) => {
    navigate(`/room/${roomId}`)
  }

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{t('public.searchRooms')}</h1>
            <a
              href="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {t('public.staffLogin')}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">{t('public.findPerfectRoom')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                {t('public.checkIn')}
              </label>
              <input
                type="date"
                min={getMinDate()}
                value={filters.check_in_date}
                onChange={(e) => handleFilterChange('check_in_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                {t('public.checkOut')}
              </label>
              <input
                type="date"
                min={filters.check_in_date || getMinDate()}
                value={filters.check_out_date}
                onChange={(e) => handleFilterChange('check_out_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4" />
                {t('public.guests')}
              </label>
              <input
                type="number"
                min="1"
                value={filters.min_capacity}
                onChange={(e) => handleFilterChange('min_capacity', e.target.value)}
                placeholder={t('public.minCapacityPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                {t('rooms.roomType')}
              </label>
              <select
                value={filters.room_type_id}
                onChange={(e) => handleFilterChange('room_type_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{t('rooms.allTypes')}</option>
                {roomTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                {t('rooms.floor')}
              </label>
              <input
                type="number"
                value={filters.floor}
                onChange={(e) => handleFilterChange('floor', e.target.value)}
                placeholder={t('rooms.floorNumber')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('public.loadingRooms')}</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-lg">{t('public.noAvailableRooms')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleRoomClick(room.id)}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                >
                  {room.image_url ? (
                    <img
                      src={room.image_url}
                      alt={`Номер ${room.number}`}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Room+Image'
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <MapPin className="w-16 h-16 text-primary-400" />
                    </div>
                  )}
                  
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{t('rooms.room')} {room.number}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        {t('rooms.statuses.available')}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{room.room_type?.name}</p>
                    
                    {room.description && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{room.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      {room.capacity && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{room.capacity} {room.capacity === 1 ? t('public.guest') : t('public.guests')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{t('rooms.floor')} {room.floor}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div>
                        <span className="text-2xl font-bold text-primary-600">
                          ${room.room_type?.base_price}
                        </span>
                        <span className="text-sm text-gray-500"> / {t('public.night')}</span>
                      </div>
                      <button className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
                        {t('public.viewDetails')}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.prev}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.next}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперёд
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
