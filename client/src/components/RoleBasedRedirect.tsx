import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { isAdmin, isAnalytics, isStaff } from '../lib/roles'

interface RoleBasedRedirectProps {
  children: React.ReactNode
}

export default function RoleBasedRedirect({ children }: RoleBasedRedirectProps) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) return

    // Only redirect if user is on the base admin path
    if (location.pathname === '/admin/' || location.pathname === '/admin') {
      // If user is admin or analytics, keep on dashboard
      if (isAdmin(user) || isAnalytics(user)) {
        // Already on dashboard, no redirect needed
        return
      }
      // If user is staff or manager, redirect to rooms
      else if (isStaff(user)) {
        navigate('/admin/rooms', { replace: true })
      }
    }
  }, [user, navigate, location])

  // Render children while redirect is happening
  return <>{children}</>
}
