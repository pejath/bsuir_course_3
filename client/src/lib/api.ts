import axios from 'axios'
import i18n from '../i18n'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  params: {
    locale: i18n.language
  }
})

// Добавляем токен в каждый запрос
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Добавляем locale к каждому запросу
    if (!config.params) {
      config.params = {}
    }
    config.params.locale = i18n.language
    return config
  },
  (error) => Promise.reject(error)
)

// Обрабатываем ошибки аутентификации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
