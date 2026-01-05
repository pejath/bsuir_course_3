import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { canManageServices } from '../lib/roles'
import Modal from '../components/Modal'
import type { Service } from '../types'

export default function Services() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    active: true
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const response = await api.get('/services')
      setServices(response.data)
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedService(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      active: true
    })
    setIsModalOpen(true)
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      active: service.active
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        service: {
          ...formData,
          price: parseFloat(formData.price)
        }
      }

      if (selectedService) {
        await api.put(`/services/${selectedService.id}`, data)
      } else {
        await api.post('/services', data)
      }

      setIsModalOpen(false)
      fetchServices()
    } catch (error: any) {
      console.error('Failed to save service:', error)
      alert(error.response?.data?.errors?.join(', ') || t('services.saveError'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('services.confirmDelete'))) return

    try {
      await api.delete(`/services/${id}`)
      fetchServices()
    } catch (error) {
      console.error('Failed to delete service:', error)
      alert(t('services.deleteError'))
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      await api.put(`/services/${service.id}`, {
        service: { ...service, active: !service.active }
      })
      fetchServices()
    } catch (error) {
      console.error('Failed to update service:', error)
    }
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('services.title')}</h1>
        {canManageServices(user) && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('services.addService')}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('services.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {searchTerm ? t('services.noSearchResults') : t('services.noServices')}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredServices.map((service) => (
              <li key={service.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {service.name}
                      </h3>
                      {!service.active && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {t('services.inactive')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {service.description}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-primary-600 dark:text-primary-400">
                      ${Number(service.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canManageServices(user) && (
                      <>
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={`px-3 py-1 text-xs font-medium rounded-md ${
                            service.active
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}
                        >
                          {service.active ? t('services.deactivate') : t('services.activate')}
                        </button>
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 text-primary-600 dark:text-primary-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          title={selectedService ? t('services.editService') : t('services.newService')}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('services.name')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('services.description')}
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('services.price')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                {t('services.active')}
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
