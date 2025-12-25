import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, MapPin, Eye, Package, Check } from 'lucide-react'
import publicApi from '../lib/publicApi'
import PublicBookingForm from '../components/PublicBookingForm'
import type { Room } from '../types'

export default function PublicRoomDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)

  useEffect(() => {
    if (id) {
      fetchRoom(id)
    }
  }, [id])

  const fetchRoom = async (roomId: string) => {
    setLoading(true)
    try {
      const response = await publicApi.get(`/public/rooms/${roomId}`)
      setRoom(response.data)
    } catch (error) {
      console.error('Failed to fetch room:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Номер не найден</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Вернуться к поиску
          </button>
        </div>
      </div>
    )
  }

  const amenitiesList = room.amenities ? room.amenities.split(',').map(a => a.trim()) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Вернуться к поиску</span>
            </button>
            <a
              href="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Вход для персонала
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {room.image_url ? (
            <img
              src={room.image_url}
              alt={`Номер ${room.number}`}
              className="w-full h-96 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Room+Image'
              }}
            />
          ) : (
            <div className="w-full h-96 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <MapPin className="w-32 h-32 text-primary-400" />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Номер {room.number}</h1>
                <p className="text-xl text-gray-600">{room.room_type?.name}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">
                  ${room.room_type?.base_price}
                </div>
                <div className="text-sm text-gray-500">за ночь</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-200">
              {room.capacity && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Вместимость</div>
                    <div className="font-semibold text-gray-900">
                      {room.capacity} {room.capacity === 1 ? 'гость' : 'гостей'}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Этаж</div>
                  <div className="font-semibold text-gray-900">{room.floor}</div>
                </div>
              </div>

              {room.view && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Вид</div>
                    <div className="font-semibold text-gray-900">{room.view}</div>
                  </div>
                </div>
              )}
            </div>

            {room.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Описание</h2>
                <p className="text-gray-700 leading-relaxed">{room.description}</p>
              </div>
            )}

            {amenitiesList.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Удобства
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {amenitiesList.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {room.room_type?.description && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-2">О типе номера</h3>
                <p className="text-gray-700 text-sm">{room.room_type.description}</p>
              </div>
            )}

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Готовы забронировать?</h3>
              <p className="text-gray-700 mb-4">
                Забронируйте этот номер прямо сейчас и получите подтверждение на email.
              </p>
              <button
                onClick={() => setShowBookingForm(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Забронировать номер
              </button>
            </div>
          </div>
        </div>
      </main>

      {showBookingForm && (
        <PublicBookingForm
          room={room}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </div>
  )
}
