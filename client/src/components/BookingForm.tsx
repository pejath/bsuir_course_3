import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import type { Booking, Room, Guest, BookingService } from '../types'
import BookingServices from './BookingServices'

interface BookingFormProps {
  booking?: Booking | null
  onSuccess: () => void
  onCancel: () => void
}

export default function BookingForm({ booking, onSuccess, onCancel }: BookingFormProps) {
  const { t } = useTranslation()
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestSearch, setGuestSearch] = useState('')
  const [guestSearchTimeout, setGuestSearchTimeout] = useState<number | null>(null)
  const [guestMode, setGuestMode] = useState<'existing' | 'new'>('existing')
  const [bookingServices, setBookingServices] = useState<BookingService[]>([])
  const [formData, setFormData] = useState({
    room_id: '',
    guest_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: '1',
    status: 'pending' as 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed',
    notes: ''
  })
  const [guestData, setGuestData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    passport_number: '',
    date_of_birth: '',
    country: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRooms()
    if (booking) {
      // When editing, fetch the specific guest first to ensure it's in the list
      fetchGuest(booking.guest_id)
      setBookingServices(booking.booking_services || [])
      setFormData({
        room_id: booking.room_id.toString(),
        guest_id: booking.guest_id.toString(),
        check_in_date: booking.check_in_date.split('T')[0],
        check_out_date: booking.check_out_date.split('T')[0],
        number_of_guests: booking.number_of_guests.toString(),
        status: booking.status,
        notes: booking.notes || ''
      })
    } else {
      fetchGuests('')
      setBookingServices([])
    }
  }, [booking])

  useEffect(() => {
    if (formData.check_in_date && formData.check_out_date) {
      fetchRooms(formData.check_in_date, formData.check_out_date)
    }
  }, [formData.check_in_date, formData.check_out_date])

  useEffect(() => {
    return () => {
      if (guestSearchTimeout) {
        clearTimeout(guestSearchTimeout)
      }
    }
  }, [guestSearchTimeout])

  const fetchRooms = async (checkInDate?: string, checkOutDate?: string) => {
    try {
      const params: any = { limit: 1000 }
      if (checkInDate && checkOutDate) {
        params.check_in_date = checkInDate
        params.check_out_date = checkOutDate
        if (booking?.id) {
          params.exclude_booking_id = booking.id
        }
      }
      const response = await api.get('/rooms', { params })
      setRooms(response.data.data || response.data)
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
    }
  }

  const fetchGuests = async (searchTerm: string = '') => {
    try {
      const params: any = { limit: 100 }
      if (searchTerm) {
        params.search = searchTerm
      }
      const response = await api.get('/guests', { params })
      setGuests(response.data.data || response.data)
    } catch (err) {
      console.error('Failed to fetch guests:', err)
    }
  }

  const fetchGuest = async (guestId: number) => {
    try {
      const response = await api.get(`/guests/${guestId}`)
      setGuests([response.data])
    } catch (err) {
      console.error('Failed to fetch guest:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let guestId = formData.guest_id

      if (guestMode === 'new') {
        const existingGuest = await api.get('/guests', {
          params: {
            search: guestData.email || guestData.passport_number,
            limit: 1
          }
        })

        if (existingGuest.data.data && existingGuest.data.data.length > 0) {
          const foundGuest = existingGuest.data.data.find(
            (g: Guest) => g.email === guestData.email || g.passport_number === guestData.passport_number
          )
          if (foundGuest) {
            guestId = foundGuest.id.toString()
          }
        }

        if (!guestId) {
          const newGuestResponse = await api.post('/guests', { guest: guestData })
          guestId = newGuestResponse.data.id.toString()
        }
      }

      const data = {
        booking: {
          room_id: parseInt(formData.room_id),
          guest_id: parseInt(guestId),
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          number_of_guests: parseInt(formData.number_of_guests),
          status: formData.status,
          notes: formData.notes,
          booking_services_attributes: bookingServices.filter(s => s.service_id > 0).map(s => ({
            id: s.id || undefined,
            service_id: s.service_id,
            quantity: s.quantity,
            price: s.price,
            _destroy: false
          }))
        }
      }

      if (booking) {
        await api.put(`/bookings/${booking.id}`, data)
      } else {
        await api.post('/bookings', data)
      }

      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || t('bookings.saveError'))
    } finally {
      setLoading(false)
    }
  }

  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setGuestData({
      ...guestData,
      [e.target.name]: e.target.value
    })
  }

  const handleGuestSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value
    setGuestSearch(searchValue)
    
    // Clear previous timeout
    if (guestSearchTimeout) {
      clearTimeout(guestSearchTimeout)
    }
    
    // Set new timeout
    const timeoutId = setTimeout(() => {
      fetchGuests(searchValue)
    }, 300)
    
    setGuestSearchTimeout(timeoutId)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="existing"
              checked={guestMode === 'existing'}
              onChange={(e) => setGuestMode(e.target.value as 'existing' | 'new')}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('bookings.existingGuest')}</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="new"
              checked={guestMode === 'new'}
              onChange={(e) => setGuestMode(e.target.value as 'existing' | 'new')}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('bookings.newGuest')}</span>
          </label>
        </div>

        {guestMode === 'existing' ? (
          <div>
            <label htmlFor="guest_search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('bookings.searchGuest')} *
            </label>
            <input
              type="text"
              id="guest_search"
              value={guestSearch}
              onChange={handleGuestSearch}
              placeholder={t('bookings.searchGuestPlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
            />
            {guests.length > 0 && (
              <div className="mt-2">
                <label htmlFor="guest_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('bookings.selectGuest')} *
                </label>
                <select
                  id="guest_id"
                  name="guest_id"
                  required
                  value={formData.guest_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
                >
                  <option value="">{t('bookings.selectGuest')}</option>
                  {guests.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.first_name} {guest.last_name} ({guest.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {guestSearch && guests.length === 0 && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('bookings.noGuestsFound')}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('guests.firstName')} *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  required={guestMode === 'new'}
                  value={guestData.first_name}
                  onChange={handleGuestChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('guests.lastName')} *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  required={guestMode === 'new'}
                  value={guestData.last_name}
                  onChange={handleGuestChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('guests.email')} *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required={guestMode === 'new'}
                  value={guestData.email}
                  onChange={handleGuestChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('guests.phone')} *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required={guestMode === 'new'}
                  value={guestData.phone}
                  onChange={handleGuestChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="passport_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('guests.passportNumber')} *
                </label>
                <input
                  type="text"
                  id="passport_number"
                  name="passport_number"
                  required={guestMode === 'new'}
                  value={guestData.passport_number}
                  onChange={handleGuestChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('guests.dateOfBirth')} *
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  required={guestMode === 'new'}
                  value={guestData.date_of_birth}
                  onChange={handleGuestChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('guests.country')} *
              </label>
              <input
                type="text"
                id="country"
                name="country"
                required={guestMode === 'new'}
                value={guestData.country}
                onChange={handleGuestChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="guest_notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('guests.notes')}
              </label>
              <textarea
                id="guest_notes"
                name="notes"
                rows={2}
                value={guestData.notes}
                onChange={handleGuestChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="check_in_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('bookings.checkIn')} *
          </label>
          <input
            type="date"
            id="check_in_date"
            name="check_in_date"
            required
            value={formData.check_in_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="check_out_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('bookings.checkOut')} *
          </label>
          <input
            type="date"
            id="check_out_date"
            name="check_out_date"
            required
            value={formData.check_out_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="room_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('bookings.room')} *
        </label>
        <select
          id="room_id"
          name="room_id"
          required
          value={formData.room_id}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
        >
          <option value="">{t('bookings.selectRoom')}</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {t('bookings.roomOption', { number: room.number, roomType: room.room_type?.name, price: room.room_type?.base_price })}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="number_of_guests" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('bookings.guests')} *
        </label>
        <input
          type="number"
          id="number_of_guests"
          name="number_of_guests"
          required
          min="1"
          value={formData.number_of_guests}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('bookings.status')} *
        </label>
        <select
          id="status"
          name="status"
          required
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
        >
          <option value="pending">{t('bookings.statuses.pending')}</option>
          <option value="confirmed">{t('bookings.statuses.confirmed')}</option>
          <option value="checked_in">{t('bookings.statuses.checkedIn')}</option>
          <option value="checked_out">{t('bookings.statuses.checkedOut')}</option>
          <option value="cancelled">{t('bookings.statuses.cancelled')}</option>
          <option value="completed">{t('bookings.statuses.completed')}</option>
        </select>
      </div>

      <BookingServices
        bookingId={booking?.id}
        selectedServices={bookingServices}
        onChange={setBookingServices}
      />

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('bookings.notes')}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? t('common.saving') : (booking ? t('bookings.updateBooking') : t('bookings.createBooking'))}
        </button>
      </div>
    </form>
  )
}
