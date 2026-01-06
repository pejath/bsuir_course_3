import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { canViewAnalytics, canManageGuests, canManageServices, canManageUsers, canManageRooms, canManageBookings } from '../lib/roles'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: 'analytics' | 'guests' | 'services' | 'users' | 'rooms' | 'bookings'
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  switch (requiredPermission) {
    case 'analytics':
      if (!canViewAnalytics(user)) {
        return <Navigate to="/admin/" replace />
      }
      break
    case 'guests':
      if (!canManageGuests(user)) {
        return <Navigate to="/admin/" replace />
      }
      break
    case 'services':
      if (!canManageServices(user)) {
        return <Navigate to="/admin/" replace />
      }
      break
    case 'users':
      if (!canManageUsers(user)) {
        return <Navigate to="/admin/" replace />
      }
      break
    case 'rooms':
      if (!canManageRooms(user)) {
        return <Navigate to="/admin/" replace />
      }
      break
    case 'bookings':
      if (!canManageBookings(user)) {
        return <Navigate to="/admin/" replace />
      }
      break
  }

  return <>{children}</>
}
