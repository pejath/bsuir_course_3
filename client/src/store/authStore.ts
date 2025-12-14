import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        try {
          const response = await api.post('/users/sign_in', {
            user: { email, password }
          })
          const { user } = response.data
          set({ user, isAuthenticated: true })
        } catch (error) {
          throw error
        }
      },

      logout: async () => {
        try {
          await api.delete('/users/sign_out')
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          localStorage.removeItem('token')
          set({ user: null, isAuthenticated: false })
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
