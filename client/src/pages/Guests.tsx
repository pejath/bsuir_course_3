import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Eye, Edit, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { canDeleteGuests } from '../lib/roles'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'
import Modal from '../components/Modal'
import GuestForm from '../components/GuestForm'
import type { Guest } from '../types'

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

export default function Guests() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const toast = useToast()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [viewGuest, setViewGuest] = useState<Guest | null>(null)
  
  const [filters, setFilters] = useState({
    search: '',
    country: ''
  })

  const debouncedSearch = useDebounce(filters.search, 500)
  const debouncedCountry = useDebounce(filters.country, 500)

  useEffect(() => {
    fetchGuests(currentPage)
  }, [currentPage, debouncedSearch, debouncedCountry])

  const fetchGuests = async (page: number = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 50, include_bookings_count: true }
      if (debouncedSearch) params.search = debouncedSearch
      if (debouncedCountry) params.country = debouncedCountry
      
      const response = await api.get('/guests', { params })
      setGuests(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch guests:', error)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      country: ''
    })
    setCurrentPage(1)
  }

  const openViewModal = (guest: Guest) => {
    setViewGuest(guest)
  }

  const openEditModal = (guest: Guest) => {
    setSelectedGuest(guest)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    
    try {
      const response = await api.delete(`/guests/${deleteConfirm}`)
      setDeleteConfirm(null)
      fetchGuests(currentPage)
      
      // Use message from API response if available, otherwise use default
      const message = response.data?.message || t('guests.deleted')
      toast.success(message)
    } catch (error: unknown) {
      console.error('Failed to delete guest:', error)
      
      // Use error message from API if available
      const errorData = (error as any)?.response?.data
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Show multiple errors
        errorData.errors.forEach((errorMsg: string) => {
          toast.error(errorMsg)
        })
      } else {
        const errorMessage = errorData?.message || t('guests.error.delete')
        toast.error(errorMessage)
      }
    }
  }

  if (initialLoading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('guests.title')}</h1>

      <div className="mb-6 bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('common.filters')}</h3>
          {(filters.search || filters.country) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              {t('common.clearFilters')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('guests.search')}
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={t('guests.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('guests.country')}
            </label>
            <input
              type="text"
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              placeholder={t('guests.filterByCountry')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg relative">
        {loading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('guests.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('guests.email')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('guests.phone')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('guests.country')}
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {guest.first_name} {guest.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {guest.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {guest.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {guest.country}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openViewModal(guest)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-primary-900 dark:hover:text-primary-300"
                      title={t('common.view')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(guest)}
                      className="text-primary-600 dark:text-primary-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                      title={t('common.edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {canDeleteGuests(user) && (
                      <button
                        onClick={() => setDeleteConfirm(guest.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {t('guests.showing', { from: pagination.from, to: pagination.to, count: pagination.count })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.prev}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            <div className="flex flex-wrap items-center gap-1">
              {Array.from({ length: Math.min(pagination.pages, 4) }, (_, i) => {
                const maxVisible = 4
                let startPage = Math.max(1, pagination.page - 2)
                let endPage = Math.min(pagination.pages, startPage + maxVisible - 1)
                if (endPage - startPage < maxVisible - 1) {
                  startPage = Math.max(1, endPage - maxVisible + 1)
                }
                return startPage + i
              }).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    page === pagination.page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              {pagination.pages > 5 && (
                <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
              )}
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.next}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* View Guest Modal */}
      {viewGuest && (
        <Modal
          isOpen={!!viewGuest}
          onClose={() => setViewGuest(null)}
          title={t('guests.guestDetails')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('guests.name')}</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewGuest.first_name} {viewGuest.last_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('guests.email')}</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewGuest.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('guests.phone')}</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewGuest.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('guests.passportNumber')}</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewGuest.passport_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('guests.dateOfBirth')}</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewGuest.date_of_birth}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('guests.country')}</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewGuest.country}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('guests.notes')}</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewGuest.notes || '-'}</p>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setViewGuest(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Guest Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedGuest(null)
        }}
        title={selectedGuest ? t('guests.editGuest') : t('guests.newGuest')}
      >
        <GuestForm
          guest={selectedGuest}
          onSuccess={() => {
            setIsModalOpen(false)
            setSelectedGuest(null)
            fetchGuests(currentPage)
          }}
          onCancel={() => {
            setIsModalOpen(false)
            setSelectedGuest(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title={t('guests.deleteGuest')}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('guests.deleteConfirmation')}
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Toast Notifications */}
      {toast.toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => toast.removeToast(t.id)}
        />
      ))}
    </div>
  )
}
