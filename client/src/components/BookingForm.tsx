import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { Booking, Room, Guest } from '../types'

interface BookingFormProps {
  booking?: Booking | null
  onSuccess: () => void
  onCancel: () => void
}

export default function BookingForm({ booking, onSuccess, onCancel }: BookingFormProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [formData, setFormData] = useState({
    room_id: '',
    guest_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: '1',
    status: 'pending' as 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRooms()
    fetchGuests()
    if (booking) {
      setFormData({
        room_id: booking.room_id.toString(),
        guest_id: booking.guest_id.toString(),
        check_in_date: booking.check_in_date.split('T')[0],
        check_out_date: booking.check_out_date.split('T')[0],
        number_of_guests: booking.number_of_guests.toString(),
        status: booking.status,
        notes: booking.notes || ''
      })
    }
  }, [booking])

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms')
      setRooms(response.data)
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
    }
  }

  const fetchGuests = async () => {
    try {
      const response = await api.get('/guests')
      setGuests(response.data)
    } catch (err) {
      console.error('Failed to fetch guests:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        booking: {
          room_id: parseInt(formData.room_id),
          guest_id: parseInt(formData.guest_id),
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          number_of_guests: parseInt(formData.number_of_guests),
          status: formData.status,
          notes: formData.notes
        }
      }

      if (booking) {
        await api.put(`/bookings/${booking.id}`, data)
      } else {
        await api.post('/bookings', data)
      }

      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save booking')
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
        <label htmlFor="guest_id" className="block text-sm font-medium text-gray-700">
          Guest *
        </label>
        <select
          id="guest_id"
          name="guest_id"
          required
          value={formData.guest_id}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        >
          <option value="">Select guest</option>
          {guests.map((guest) => (
            <option key={guest.id} value={guest.id}>
              {guest.first_name} {guest.last_name} ({guest.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="room_id" className="block text-sm font-medium text-gray-700">
          Room *
        </label>
        <select
          id="room_id"
          name="room_id"
          required
          value={formData.room_id}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
        >
          <option value="">Select room</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              Room {room.number} - {room.room_type?.name} (${room.room_type?.base_price})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="check_in_date" className="block text-sm font-medium text-gray-700">
            Check-in Date *
          </label>
          <input
            type="date"
            id="check_in_date"
            name="check_in_date"
            required
            value={formData.check_in_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="check_out_date" className="block text-sm font-medium text-gray-700">
            Check-out Date *
          </label>
          <input
            type="date"
            id="check_out_date"
            name="check_out_date"
            required
            value={formData.check_out_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="number_of_guests" className="block text-sm font-medium text-gray-700">
          Number of Guests *
        </label>
        <input
          type="number"
          id="number_of_guests"
          name="number_of_guests"
          required
          min="1"
          value={formData.number_of_guests}
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
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
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
          {loading ? 'Saving...' : booking ? 'Update Booking' : 'Create Booking'}
        </button>
      </div>
    </form>
  )
}
