import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Plus, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import api from '../lib/api'
import type { Booking } from '../types'
import { useToast } from '../hooks/useToast'
import BookingForm from '../components/BookingForm'
import { formatStatus } from '../utils/formatters'

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

export default function Bookings() {
  const { t } = useTranslation()
  const toast = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  
  const [filters, setFilters] = useState({
    status: '',
    guest_name: '',
    room_number: '',
    check_in_from: '',
    check_in_to: '',
    check_out_from: '',
    check_out_to: ''
  })

  useEffect(() => {
    fetchBookings(currentPage)
  }, [currentPage, filters])

  const fetchBookings = async (page: number = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 50 }
      if (filters.status) params.status = filters.status
      if (filters.guest_name) params.guest_name = filters.guest_name
      if (filters.room_number) params.room_number = filters.room_number
      if (filters.check_in_from) params.check_in_from = filters.check_in_from
      if (filters.check_in_to) params.check_in_to = filters.check_in_to
      if (filters.check_out_from) params.check_out_from = filters.check_out_from
      if (filters.check_out_to) params.check_out_to = filters.check_out_to
      
      const response = await api.get('/bookings', { params })
      setBookings(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      toast.error(t('bookings.error.fetch'))
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
      status: '',
      guest_name: '',
      room_number: '',
      check_in_from: '',
      check_in_to: '',
      check_out_from: '',
      check_out_to: ''
    })
    setCurrentPage(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'checked_in': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'checked_out': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const calculateTotalPrice = (booking: Booking) => {
    const servicesTotal = booking.booking_services?.reduce((sum, bs) => {
      return sum + (Number(bs.price) * bs.quantity)
    }, 0) || 0
    return Number(booking.total_price) + servicesTotal
  }

  const handleCreateBooking = () => {
    setSelectedBooking(null)
    setShowForm(true)
  }

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowForm(true)
  }

  const handleCancelBooking = async (booking: Booking) => {
    if (!window.confirm(t('bookings.confirmCancel'))) {
      return
    }

    try {
      await api.patch(`/bookings/${booking.id}/cancel`)
      fetchBookings(currentPage)
      toast.success(t('bookings.cancelled'))
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error(t('bookings.error.cancel'))
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setSelectedBooking(null)
    fetchBookings(currentPage)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedBooking(null)
  }

  if (initialLoading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('bookings.title')}</h1>
        <button
          onClick={handleCreateBooking}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('bookings.createBooking')}
        </button>
      </div>

      <div className="mb-6 bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('common.filters')}</h3>
          {(filters.status || filters.guest_name || filters.room_number || filters.check_in_from || filters.check_in_to || filters.check_out_from || filters.check_out_to) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              {t('common.clearFilters')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('bookings.status')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('bookings.allStatuses')}</option>
              <option value="pending">{t('bookings.statuses.pending')}</option>
              <option value="confirmed">{t('bookings.statuses.confirmed')}</option>
              <option value="checked_in">{t('bookings.statuses.checkedIn')}</option>
              <option value="checked_out">{t('bookings.statuses.checkedOut')}</option>
              <option value="cancelled">{t('bookings.statuses.cancelled')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('guests.guestName')}
            </label>
            <input
              type="text"
              value={filters.guest_name}
              onChange={(e) => handleFilterChange('guest_name', e.target.value)}
              placeholder={t('guests.searchByName')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('bookings.roomNumber')}
            </label>
            <input
              type="text"
              value={filters.room_number}
              onChange={(e) => handleFilterChange('room_number', e.target.value)}
              placeholder={t('bookings.roomNumber')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('bookings.checkInFrom')}
            </label>
            <input
              type="date"
              value={filters.check_in_from}
              onChange={(e) => handleFilterChange('check_in_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('bookings.checkInTo')}
            </label>
            <input
              type="date"
              value={filters.check_in_to}
              onChange={(e) => handleFilterChange('check_in_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('bookings.checkOutFrom')}
            </label>
            <input
              type="date"
              value={filters.check_out_from}
              onChange={(e) => handleFilterChange('check_out_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('bookings.checkOutTo')}
            </label>
            <input
              type="date"
              value={filters.check_out_to}
              onChange={(e) => handleFilterChange('check_out_to', e.target.value)}
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
                {t('bookings.guest')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('rooms.room')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('bookings.checkIn')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('bookings.checkOut')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('bookings.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('common.price')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {booking.guest?.first_name} {booking.guest?.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {booking.room?.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(booking.check_out_date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {t(`bookings.statuses.${booking.status}`)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  ${calculateTotalPrice(booking).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => handleEditBooking(booking)}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                  >
   <Edit className="w-4 h-4" />
                  </button>
                  {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                    <button
                      onClick={() => handleCancelBooking(booking)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {t('common.cancel')}
                    </button>
                  )}
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
            {t('bookings.showing', { from: pagination.from, to: pagination.to, count: pagination.count })}
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

      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedBooking ? t('bookings.editBooking') : t('bookings.createBooking')}
              </h2>
            </div>
            <div className="px-6 py-4">
              <BookingForm
                booking={selectedBooking}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
