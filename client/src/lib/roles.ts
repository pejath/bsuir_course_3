import type { User } from '../types'

export const isGuest = (user: User | null): boolean => {
  return user?.role === 'guest'
}

export const isStaff = (user: User | null): boolean => {
  return user?.role === 'staff' || isManager(user) || isAdmin(user)
}

export const isManager = (user: User | null): boolean => {
  return user?.role === 'manager' || isAdmin(user)
}

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin'
}

export const canManageRooms = (user: User | null): boolean => {
  return isStaff(user)
}

export const canManageGuests = (user: User | null): boolean => {
  return isStaff(user)
}

export const canManageBookings = (user: User | null): boolean => {
  return isStaff(user)
}

export const canDeleteRooms = (user: User | null): boolean => {
  return isManager(user)
}

export const canDeleteGuests = (user: User | null): boolean => {
  return isManager(user)
}

export const canViewAnalytics = (user: User | null): boolean => {
  return isStaff(user)
}
