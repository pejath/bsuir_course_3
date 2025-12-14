import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { Guest } from '../types'

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      const response = await api.get('/guests')
      setGuests(response.data)
    } catch (error) {
      console.error('Failed to fetch guests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Guests</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {guest.first_name} {guest.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {guest.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {guest.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {guest.country}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
