import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { Room, RoomType } from '../types'

interface RoomFormProps {
  room?: Room | null
  onSuccess: () => void
  onCancel: () => void
}

export default function RoomForm({ room, onSuccess, onCancel }: RoomFormProps) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [formData, setFormData] = useState<{
    number: string
    room_type_id: string
    floor: string
    status: 'available' | 'occupied' | 'maintenance' | 'reserved'
    notes: string
    capacity: string
    description: string
    amenities: string
    view: string
    image_url: string
  }>({
    number: '',
    room_type_id: '',
    floor: '',
    status: 'available',
    notes: '',
    capacity: '',
    description: '',
    amenities: '',
    view: '',
    image_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRoomTypes()
    if (room) {
      setFormData({
        number: room.number,
        room_type_id: room.room_type_id.toString(),
        floor: room.floor.toString(),
        status: room.status,
        notes: room.notes || '',
        capacity: room.capacity?.toString() || '',
        description: room.description || '',
        amenities: room.amenities || '',
        view: room.view || '',
        image_url: room.image_url || ''
      })
    }
  }, [room])

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/room_types')
      setRoomTypes(response.data)
    } catch (err) {
      console.error('Failed to fetch room types:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        room: {
          number: formData.number,
          room_type_id: parseInt(formData.room_type_id),
          floor: parseInt(formData.floor),
          status: formData.status,
          notes: formData.notes,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          description: formData.description,
          amenities: formData.amenities,
          view: formData.view,
          image_url: formData.image_url
        }
      }

      if (room) {
        await api.put(`/rooms/${room.id}`, data)
      } else {
        await api.post('/rooms', data)
      }

      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save room')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div>
        <label htmlFor="number" className="block text-sm font-medium text-gray-700">
          Room Number *
        </label>
        <input
          type="text"
          id="number"
          name="number"
          required
          value={formData.number}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="room_type_id" className="block text-sm font-medium text-gray-700">
          Room Type *
        </label>
        <select
          id="room_type_id"
          name="room_type_id"
          required
          value={formData.room_type_id}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        >
          <option value="">Select room type</option>
          {roomTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} - ${type.base_price}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
          Floor *
        </label>
        <input
          type="number"
          id="floor"
          name="floor"
          required
          value={formData.floor}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status *
        </label>
        <select
          id="status"
          name="status"
          required
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        >
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
          Capacity (guests)
        </label>
        <input
          type="number"
          id="capacity"
          name="capacity"
          min="1"
          value={formData.capacity}
          onChange={handleChange}
          placeholder="e.g., 2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="view" className="block text-sm font-medium text-gray-700">
          View
        </label>
        <input
          type="text"
          id="view"
          name="view"
          value={formData.view}
          onChange={handleChange}
          placeholder="e.g., City, Garden, Sea"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed description of the room for guests"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="amenities" className="block text-sm font-medium text-gray-700">
          Amenities
        </label>
        <textarea
          id="amenities"
          name="amenities"
          rows={2}
          value={formData.amenities}
          onChange={handleChange}
          placeholder="e.g., WiFi, TV, Air conditioning, Mini bar"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
          Image URL
        </label>
        <input
          type="url"
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="https://example.com/room-image.jpg"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Internal Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          placeholder="Internal notes (not visible to guests)"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
        </button>
      </div>
    </form>
  )
}
