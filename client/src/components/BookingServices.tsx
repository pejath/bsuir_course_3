import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import api from '../lib/api'
import type { Service, BookingService } from '../types'

interface BookingServicesProps {
  bookingId?: number
  selectedServices: BookingService[]
  onChange: (services: BookingService[]) => void
  readonly?: boolean
}

export default function BookingServices({ bookingId, selectedServices, onChange, readonly = false }: BookingServicesProps) {
  const { t } = useTranslation()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await api.get('/services')
      setServices(response.data.filter((s: Service) => s.active))
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const addService = () => {
    const newService: BookingService = {
      id: 0,
      booking_id: bookingId || 0,
      service_id: 0,
      quantity: 1,
      price: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    onChange([...selectedServices, newService])
  }

  const updateService = (index: number, field: keyof BookingService, value: any) => {
    const updated = [...selectedServices]
    if (field === 'service_id') {
      const service = services.find(s => s.id === value)
      if (service) {
        updated[index] = {
          ...updated[index],
          service_id: value,
          price: service.price,
          service: service
        }
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      }
    }
    onChange(updated)
  }

  const removeService = (index: number) => {
    const serviceToRemove = selectedServices[index]
    
    // If service has an ID (exists in database), mark it for destruction
    if (serviceToRemove.id && serviceToRemove.id > 0) {
      const updated = [...selectedServices]
      updated[index] = {
        ...serviceToRemove,
        _destroy: true
      }
      onChange(updated)
    } else {
      // If service is new (id = 0), just remove it from array
      onChange(selectedServices.filter((_, i) => i !== index))
    }
  }

  const calculateServiceTotal = (service: BookingService) => {
    return service.price * service.quantity
  }

  const calculateTotal = () => {
    return selectedServices.filter(s => !s._destroy).reduce((sum, service) => sum + calculateServiceTotal(service), 0)
  }

  if (loading) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
  }

  if (readonly && selectedServices.length === 0) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">{t('bookings.noServices')}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('bookings.services')}</h3>
        {!readonly && (
          <button
            type="button"
            onClick={addService}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            {t('bookings.addService')}
          </button>
        )}
      </div>

      {selectedServices.filter(s => !s._destroy).length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          {t('bookings.noServicesAdded')}
        </div>
      ) : (
        <div className="space-y-2">
          {selectedServices.map((service, originalIndex) => {
            // Skip services marked for destruction
            if (service._destroy) return null
            
            return (
            <div key={originalIndex} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <select
                value={service.service_id}
                onChange={(e) => updateService(originalIndex, 'service_id', parseInt(e.target.value))}
                disabled={readonly}
                className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">{t('bookings.selectService')}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - ${s.price}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={service.quantity}
                onChange={(e) => updateService(originalIndex, 'quantity', parseInt(e.target.value) || 1)}
                disabled={readonly}
                className="w-20 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />

              <div className="w-24 text-sm text-gray-900 dark:text-white text-right">
                ${calculateServiceTotal(service).toFixed(2)}
              </div>

              {!readonly && (
                <button
                  type="button"
                  onClick={() => removeService(originalIndex)}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            );
          })}

          <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('bookings.servicesTotal')}: ${calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
