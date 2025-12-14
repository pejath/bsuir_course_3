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
          const { token, user } = response.data
          
          // Сохраняем токен в localStorage
          localStorage.setItem('token', token)
          
          // Устанавливаем токен в заголовки для будущих запросов
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
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
          // Удаляем токен из localStorage и заголовков
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
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
