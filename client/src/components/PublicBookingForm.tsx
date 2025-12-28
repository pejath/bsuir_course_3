import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, Users, User, Mail, Phone, Globe, X, ChevronLeft, ChevronRight } from 'lucide-react'
import publicApi from '../lib/publicApi'
import type { Room } from '../types'

interface PublicBookingFormProps {
  room: Room
  onClose: () => void
}

export default function PublicBookingForm({ room, onClose }: PublicBookingFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unavailableDates, setUnavailableDates] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loadingAvailability, setLoadingAvailability] = useState(true)
  
  const [bookingData, setBookingData] = useState({
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1
  })

  const [guestData, setGuestData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    notes: ''
  })

  useEffect(() => {
    fetchAvailability(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
  }, [currentMonth])

  const fetchAvailability = async (year: number, month: number) => {
    setLoadingAvailability(true)
    try {
      const response = await publicApi.get(`/public/rooms/${room.id}/availability`, {
        params: { year, month }
      })
      setUnavailableDates(response.data.unavailable_dates)
    } catch (err) {
      console.error('Failed to fetch availability:', err)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const isDateUnavailable = (dateString: string) => {
    return unavailableDates.includes(dateString)
  }

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + direction)
    setCurrentMonth(newMonth)
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth()
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const dateString = date.toISOString().split('T')[0]
      const isUnavailable = isDateUnavailable(dateString)
      const isPast = date < today
      const isDisabled = isPast || isUnavailable
      
      days.push(
        <div
          key={day}
          className={`h-10 flex items-center justify-center text-sm rounded ${
            isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer'
          } ${isUnavailable ? 'line-through' : ''}`}
          title={isUnavailable ? 'Занято' : isPast ? 'Прошедшая дата' : 'Доступно'}
        >
          {day}
        </div>
      )
    }
    
    return days
  }

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const calculateNights = () => {
    if (bookingData.check_in_date && bookingData.check_out_date) {
      const checkIn = new Date(bookingData.check_in_date)
      const checkOut = new Date(bookingData.check_out_date)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      return nights > 0 ? nights : 0
    }
    return 0
  }

  const calculateTotalPrice = () => {
    const nights = calculateNights()
    return nights * (room.room_type?.base_price || 0)
  }

  const handleBookingChange = (field: string, value: string | number) => {
    setBookingData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'check_in_date' && typeof value === 'string') {
      if (isDateUnavailable(value)) {
        setError('Выбранная дата заезда недоступна. Пожалуйста, выберите другую дату.')
      } else {
        setError('')
      }
    }
    
    if (field === 'check_out_date' && typeof value === 'string') {
      if (isDateUnavailable(value)) {
        setError('Выбранная дата выезда недоступна. Пожалуйста, выберите другую дату.')
      } else {
        setError('')
      }
    }
  }

  const handleGuestChange = (field: string, value: string) => {
    setGuestData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (calculateNights() <= 0) {
      setError('Дата выезда должна быть позже даты заезда')
      return
    }

    const checkIn = new Date(bookingData.check_in_date)
    const checkOut = new Date(bookingData.check_out_date)
    const hasUnavailableDates = []
    
    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0]
      if (isDateUnavailable(dateString)) {
        hasUnavailableDates.push(dateString)
      }
    }
    
    if (hasUnavailableDates.length > 0) {
      setError('В выбранном диапазоне дат есть недоступные даты. Пожалуйста, выберите другие даты.')
      return
    }

    if (room.capacity && bookingData.number_of_guests > room.capacity) {
      setError(`Максимальное количество гостей для этого номера: ${room.capacity}`)
      return
    }

    setLoading(true)
    try {
      const response = await publicApi.post('/public/bookings', {
        booking: {
          room_id: room.id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date,
          number_of_guests: bookingData.number_of_guests,
          notes: guestData.notes
        },
        guest: {
          first_name: guestData.first_name,
          last_name: guestData.last_name,
          email: guestData.email,
          phone: guestData.phone,
          country: guestData.country
        }
      })

      navigate(`/booking-confirmation/${response.data.booking.id}?email=${encodeURIComponent(guestData.email)}`)
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Не удалось создать бронирование')
    } finally {
      setLoading(false)
    }
  }

  const nights = calculateNights()
  const totalPrice = calculateTotalPrice()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">{t('public.bookRoom')} {room.number}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{t('public.roomDetails')}</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Тип:</strong> {room.room_type?.name}</p>
              <p><strong>Цена за ночь:</strong> ${room.room_type?.base_price}</p>
              {room.capacity && <p><strong>Вместимость:</strong> {room.capacity} гостей</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('public.checkIn')} *
                </label>
                <input
                  type="date"
                  required
                  min={getMinDate()}
                  value={bookingData.check_in_date}
                  onChange={(e) => handleBookingChange('check_in_date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('public.checkOut')} *
                </label>
                <input
                  type="date"
                  required
                  min={bookingData.check_in_date || getMinDate()}
                  value={bookingData.check_out_date}
                  onChange={(e) => handleBookingChange('check_out_date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Users className="w-4 h-4" />
                {t('public.guests')} *
              </label>
              <input
                type="number"
                required
                min="1"
                max={room.capacity || 10}
                value={bookingData.number_of_guests}
                onChange={(e) => handleBookingChange('number_of_guests', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {nights > 0 && (
              <div className="bg-primary-50 rounded-lg p-4">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-700">{t('public.numberOfNights')}:</span>
                  <span className="font-semibold text-gray-900">{nights}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-primary-600">
                  <span>{t('public.total')}:</span>
                  <span>${totalPrice}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('public.guestInformation')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('guests.firstName')} *
                </label>
                <input
                  type="text"
                  required
                  value={guestData.first_name}
                  onChange={(e) => handleGuestChange('first_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('guests.lastName')} *
                </label>
                <input
                  type="text"
                  required
                  value={guestData.last_name}
                  onChange={(e) => handleGuestChange('last_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4" />
                {t('guests.email')} *
              </label>
              <input
                type="email"
                required
                value={guestData.email}
                onChange={(e) => handleGuestChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('public.confirmationEmail')}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4" />
                {t('guests.phone')} *
              </label>
              <input
                type="tel"
                required
                value={guestData.phone}
                onChange={(e) => handleGuestChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4" />
                {t('guests.country')}
              </label>
              <input
                type="text"
                value={guestData.country}
                onChange={(e) => handleGuestChange('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('guests.notes')}
              </label>
              <textarea
                value={guestData.notes}
                onChange={(e) => handleGuestChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('public.specialRequests')}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || nights <= 0}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('public.booking') : t('public.bookNow')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
