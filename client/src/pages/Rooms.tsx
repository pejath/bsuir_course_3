import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { canManageRooms, canDeleteRooms } from '../lib/roles'
import Modal from '../components/Modal'
import RoomForm from '../components/RoomForm'
import type { Room } from '../types'

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
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchRooms(currentPage)
  }, [currentPage])

  const fetchRooms = async (page: number = 1) => {
    setLoading(true)
    try {
      const response = await api.get('/rooms', { params: { page, limit: 50 } })
      setRooms(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
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
      alert('Failed to delete room')
    }
  }

  const handleFormSuccess = () => {
    setIsModalOpen(false)
    setSelectedRoom(null)
    fetchRooms(currentPage)
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
        {canManageRooms(user) && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </button>
        )}
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Floor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms.map((room) => (
              <tr key={room.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {room.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {room.room_type?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {room.floor}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(room.status)}`}>
                    {room.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${room.room_type?.base_price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    {canManageRooms(user) && (
                      <button
                        onClick={() => handleEdit(room)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit room"
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
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(room.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {pagination.from} to {pagination.to} of {pagination.count} rooms
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.prev}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
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
              Next
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoom ? 'Edit Room' : 'Create Room'}
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
