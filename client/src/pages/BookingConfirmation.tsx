import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Calendar, Users, MapPin, Mail, Phone, User, ArrowLeft } from 'lucide-react'
import publicApi from '../lib/publicApi'
import ThemeSwitcher from '../components/ThemeSwitcher'

interface Booking {
  id: number
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  total_price: number
  status: string
  notes?: string
  room: {
    id: number
    number: string
    floor: number
    room_type: {
      name: string
      base_price: number
    }
  }
  guest: {
    first_name: string
    last_name: string
    email: string
    phone: string
    country?: string
  }
}

export default function BookingConfirmation() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchBooking(id)
    }
  }, [id])

  const fetchBooking = async (bookingId: string) => {
    setLoading(true)
    setError('')
    try {
      const email = searchParams.get('email')
      if (!email) {
        setError(t('bookingConfirmation.emailParamMissing'))
        setLoading(false)
        return
      }

      const response = await publicApi.get(`/public/bookings/${bookingId}`, {
        params: { email }
      })
      setBooking(response.data)
    } catch (err: any) {
      setError(t('bookingConfirmation.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const calculateNights = () => {
    if (booking) {
      const checkIn = new Date(booking.check_in_date)
      const checkOut = new Date(booking.check_out_date)
      return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    }
    return 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-gray-600 text-lg mb-4">{error || t('bookingConfirmation.bookingNotFound')}</p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('public.backToSearch')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const nights = calculateNights()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('public.backToSearch')}</span>
            </button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">{t('bookingConfirmation.bookingConfirmed')}</h1>
            <p className="text-center text-green-100">
              {t('bookingConfirmation.bookingNumber')}: <span className="font-semibold">#{booking.id}</span>
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('bookingConfirmation.confirmationSent', { email: booking.guest.email })}. 
                {t('bookingConfirmation.staffWillContact')}.
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('bookingConfirmation.bookingDetails')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('rooms.room')}</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{t('rooms.room')} {booking.room.number}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{booking.room.room_type.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">{t('rooms.floor')} {booking.room.floor}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('public.dates')}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('public.checkIn')}</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatDate(booking.check_in_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('public.checkOut')}</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatDate(booking.check_out_date)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 ml-7">
                        {nights} {nights === 1 ? t('public.night') : nights < 5 ? t('public.nights2') : t('public.nights5')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('public.guests')}</h3>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {booking.number_of_guests} {booking.number_of_guests === 1 ? t('public.guest') : t('public.guests')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('public.guestInformation')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <p className="text-gray-900 dark:text-white">
                          {booking.guest.first_name} {booking.guest.last_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <p className="text-gray-900 dark:text-white">{booking.guest.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <p className="text-gray-900 dark:text-white">{booking.guest.phone}</p>
                      </div>
                      {booking.guest.country && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <p className="text-gray-900 dark:text-white">{booking.guest.country}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('public.specialRequests')}</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded p-3">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">${booking.room.room_type.base_price} × {nights} {nights === 1 ? t('public.night') : t('public.nights')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${booking.room.room_type.base_price * nights}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
                  <span>{t('public.total')}</span>
                  <span className="text-primary-600 dark:text-primary-400">${booking.total_price}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">{t('bookingConfirmation.importantInfo')}</h3>
                <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
                  <li>{t('bookingConfirmation.checkInTime')}</li>
                  <li>{t('bookingConfirmation.checkOutTime')}</li>
                  <li>{t('bookingConfirmation.paymentInfo')}</li>
                  <li>{t('bookingConfirmation.cancellationInfo')}</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => navigate('/')}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t('bookingConfirmation.backToSearch')}
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                {t('bookingConfirmation.printConfirmation')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
