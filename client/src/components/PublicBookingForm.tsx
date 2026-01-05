import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { X, Users, Mail, Phone, Globe, Plus, Minus, Coffee } from 'lucide-react'
import publicApi from '../lib/publicApi'
import type { Room, Service } from '../types'

interface PublicBookingFormProps {
  room: Room
  onClose: () => void
}

export default function PublicBookingForm({ room, onClose }: PublicBookingFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unavailableDates] = useState<string[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<{ [key: number]: number }>({})
  
  useEffect(() => {
    fetchServices()
  }, [])
  
  const fetchServices = async () => {
    try {
      const response = await publicApi.get('/public/services')
      setServices(response.data.filter((s: Service) => s.active))
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }
  
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

  const isDateUnavailable = (dateString: string) => {
    return unavailableDates.includes(dateString)
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
    const roomPrice = nights * (room.room_type?.base_price || 0)
    
    const servicesPrice = Object.entries(selectedServices).reduce((total, [serviceId, quantity]) => {
      const service = services.find(s => s.id === Number(serviceId))
      return total + (service ? service.price * quantity : 0)
    }, 0)
    
    return roomPrice + servicesPrice
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
  
  const handleServiceChange = (serviceId: number, quantity: number) => {
    setSelectedServices(prev => {
      if (quantity <= 0) {
        const newState = { ...prev }
        delete newState[serviceId]
        return newState
      }
      return { ...prev, [serviceId]: quantity }
    })
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

    // Check for overlapping bookings
    try {
      const checkResponse = await publicApi.get(`/public/rooms/${room.id}/availability`, {
        params: {
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date
        }
      })
      
      if (!checkResponse.data.available) {
        setError('Номер уже забронирован на выбранные даты. Пожалуйста, выберите другие даты.')
        return
      }
    } catch (err) {
      console.error('Failed to check availability:', err)
    }

    setLoading(true)
    try {
      const bookingServices = Object.entries(selectedServices).map(([serviceId, quantity]) => ({
        service_id: Number(serviceId),
        quantity: quantity
      }))
      
      const response = await publicApi.post('/public/bookings', {
        booking: {
          room_id: room.id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date,
          number_of_guests: bookingData.number_of_guests,
          notes: guestData.notes,
          booking_services_attributes: bookingServices
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('public.bookRoom')} {room.number}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('public.roomDetails')}</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p><strong className="text-gray-900 dark:text-white">Тип:</strong> {room.room_type?.name}</p>
              <p><strong className="text-gray-900 dark:text-white">Цена за ночь:</strong> ${room.room_type?.base_price}</p>
              {room.capacity && <p><strong className="text-gray-900 dark:text-white">Вместимость:</strong> {room.capacity} гостей</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('public.checkIn')} *
                </label>
                <input
                  type="date"
                  required
                  min={getMinDate()}
                  value={bookingData.check_in_date}
                  onChange={(e) => handleBookingChange('check_in_date', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('public.checkOut')} *
                </label>
                <input
                  type="date"
                  required
                  min={bookingData.check_in_date || getMinDate()}
                  value={bookingData.check_out_date}
                  onChange={(e) => handleBookingChange('check_out_date', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Services Selection */}
            {services.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                  {t('public.additionalServices')}
                </h3>
                <div className="space-y-3">
                  {services.map(service => {
                    const quantity = selectedServices[service.id] || 0
                    const serviceTotal = service.price * quantity
                    
                    return (
                      <div key={service.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{service.description}</p>
                          <p className="text-sm font-medium text-primary-600 dark:text-primary-400">${service.price} {t('public.perItem')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleServiceChange(service.id, quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={quantity <= 0}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleServiceChange(service.id, quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-500"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {quantity > 0 && (
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white w-20 text-right">
                              ${serviceTotal}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('public.guestInformation')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('guests.firstName')} *
                </label>
                <input
                  type="text"
                  required
                  value={guestData.first_name}
                  onChange={(e) => handleGuestChange('first_name', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('guests.lastName')} *
                </label>
                <input
                  type="text"
                  required
                  value={guestData.last_name}
                  onChange={(e) => handleGuestChange('last_name', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Mail className="w-4 h-4" />
                {t('guests.email')} *
              </label>
              <input
                type="email"
                required
                value={guestData.email}
                onChange={(e) => handleGuestChange('email', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('public.confirmationEmail')}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Phone className="w-4 h-4" />
                {t('guests.phone')} *
              </label>
              <input
                type="tel"
                required
                value={guestData.phone}
                onChange={(e) => handleGuestChange('phone', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Globe className="w-4 h-4" />
                {t('guests.country')}
              </label>
              <input
                type="text"
                value={guestData.country}
                onChange={(e) => handleGuestChange('country', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('guests.notes')}
              </label>
              <textarea
                value={guestData.notes}
                onChange={(e) => handleGuestChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('public.specialRequests')}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
