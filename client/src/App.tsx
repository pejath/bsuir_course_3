import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ThemeProvider } from './contexts/ThemeContext'
import api from './lib/api'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Bookings from './pages/Bookings'
import Guests from './pages/Guests'
import Services from './pages/Services'
import Analytics from './pages/Analytics'
import PublicSearch from './pages/PublicSearch'
import PublicRoomDetails from './pages/PublicRoomDetails'
import BookingConfirmation from './pages/BookingConfirmation'

function App() {
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Устанавливаем токен из localStorage при загрузке приложения
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicSearch />} />
          <Route path="/room/:id" element={<PublicRoomDetails />} />
          <Route path="/booking-confirmation/:id" element={<BookingConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/admin/*"
            element={
              isAuthenticated ? (
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/guests" element={
                      <ProtectedRoute requiredPermission="guests">
                        <Guests />
                      </ProtectedRoute>
                    } />
                    <Route path="/services" element={
                      <ProtectedRoute requiredPermission="services">
                        <Services />
                      </ProtectedRoute>
                    } />
                    <Route path="/analytics" element={
                      <ProtectedRoute requiredPermission="analytics">
                        <Analytics />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
