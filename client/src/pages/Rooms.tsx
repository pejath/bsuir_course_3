import { useEffect, useState, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, X, ChevronDown, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { canManageRooms, canDeleteRooms } from '../lib/roles'
import { useDebounce } from '../hooks/useDebounce'
import Modal from '../components/Modal'
import RoomForm from '../components/RoomForm'
import RoomActivityChart from '../components/RoomActivityChart'
import { formatStatus } from '../utils/formatters'
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

export default function Rooms() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRoomId, setExpandedRoomId] = useState<number | null>(null)
  
  const [filters, setFilters] = useState({
    status: '',
    room_type_id: '',
    floor: '',
    number: ''
  })

  const debouncedNumber = useDebounce(filters.number, 500)

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  useEffect(() => {
    fetchRooms(currentPage)
  }, [currentPage, filters.status, filters.room_type_id, filters.floor, debouncedNumber])

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/room_types')
      setRoomTypes(response.data)
    } catch (error) {
      console.error('Failed to fetch room types:', error)
    }
  }

  const fetchRooms = async (page: number = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 50 }
      if (filters.status) params.status = filters.status
      if (filters.room_type_id) params.room_type_id = filters.room_type_id
      if (filters.floor) params.floor = filters.floor
      if (debouncedNumber) params.number = debouncedNumber
      
      const response = await api.get('/rooms', { params })
      setRooms(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedRoom(null)
    setIsModalOpen(true)
  }

  const handleEdit = (room: Room) => {
    setSelectedRoom(room)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/rooms/${id}`)
      fetchRooms(currentPage)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete room:', error)
      alert(t('rooms.deleteFailed'))
    }
  }

  const handleFormSuccess = () => {
    setIsModalOpen(false)
    setSelectedRoom(null)
    fetchRooms(currentPage)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      room_type_id: '',
      floor: '',
      number: ''
    })
    setCurrentPage(1)
  }

  const toggleRoomExpand = (roomId: number) => {
    setExpandedRoomId(expandedRoomId === roomId ? null : roomId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'occupied': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'reserved': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (initialLoading) {
    return <div className="text-center py-12">{t('common.loading')}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('rooms.title')}</h1>
        {canManageRooms(user) && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('rooms.addRoom')}
          </button>
        )}
      </div>

      <div className="mb-6 bg-white shadow sm:rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">{t('common.filters')}</h3>
          {(filters.status || filters.room_type_id || filters.floor || filters.number) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              {t('common.clearFilters')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('rooms.status')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('rooms.allStatuses')}</option>
              <option value="available">{t('rooms.statuses.available')}</option>
              <option value="occupied">{t('rooms.statuses.occupied')}</option>
              <option value="maintenance">{t('rooms.statuses.maintenance')}</option>
              <option value="reserved">{t('rooms.statuses.reserved')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('rooms.roomType')}
            </label>
            <select
              value={filters.room_type_id}
              onChange={(e) => handleFilterChange('room_type_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('rooms.allTypes')}</option>
              {roomTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('rooms.floor')}
            </label>
            <input
              type="number"
              value={filters.floor}
              onChange={(e) => handleFilterChange('floor', e.target.value)}
              placeholder={t('rooms.filterByFloor')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('rooms.roomNumber')}
            </label>
            <input
              type="text"
              value={filters.number}
              onChange={(e) => handleFilterChange('number', e.target.value)}
              placeholder={t('rooms.searchByNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('rooms.roomNumber')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('rooms.type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('rooms.floor')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('rooms.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('rooms.price')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms.map((room) => (
              <Fragment key={room.id}>
                <tr 
                  key={room.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleRoomExpand(room.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {expandedRoomId === room.id ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      {room.number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {room.room_type?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {room.floor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(room.status)}`}>
                      {formatStatus(room.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${room.room_type?.base_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      {canManageRooms(user) && (
                        <button
                          onClick={() => handleEdit(room)}
                          className="text-primary-600 hover:text-primary-900"
                          title={t('rooms.editRoom')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteRooms(user) && (
                        deleteConfirm === room.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleDelete(room.id)}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              {t('common.confirm')}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(room.id)}
                            className="text-red-600 hover:text-red-900"
                            title={t('rooms.deleteRoom')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRoomId === room.id && (
                  <tr key={`${room.id}-expanded`}>
                    <td colSpan={6} className="p-0">
                      <div className="bg-gray-50 border-t border-gray-200">
                        <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('rooms.roomDetails')}</h4>
                            
                            {room.capacity && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">{t('rooms.capacity')}:</span>
                                <p className="text-sm text-gray-900 mt-1">{room.capacity} {room.capacity === 1 ? t('public.guest') : t('public.guests')}</p>
                              </div>
                            )}
                            
                            {room.view && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">{t('rooms.view')}:</span>
                                <p className="text-sm text-gray-900 mt-1">{room.view}</p>
                              </div>
                            )}
                            
                            {room.description && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">{t('rooms.description')}:</span>
                                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{room.description}</p>
                              </div>
                            )}
                            
                            {room.amenities && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">{t('rooms.amenities')}:</span>
                                <p className="text-sm text-gray-700 mt-1">{room.amenities}</p>
                              </div>
                            )}
                          </div>
                          
                          {room.image_url && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 block mb-2">{t('rooms.roomImage')}:</span>
                              <img 
                                src={room.image_url} 
                                alt={`Room ${room.number}`}
                                className="w-full h-48 object-cover rounded-lg shadow-md"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <RoomActivityChart roomId={room.id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {t('rooms.showing', { from: pagination.from, to: pagination.to, count: pagination.count })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.prev}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    page === pagination.page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.next}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoom ? t('rooms.editRoom') : t('rooms.createRoom')}
      >
        <RoomForm
          room={selectedRoom}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
