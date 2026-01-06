export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'guest' | 'staff' | 'manager' | 'admin' | 'analytics'
}

export interface RoomType {
  id: number
  name: string
  description: string
  capacity: number
  base_price: number
  amenities: string[]
  created_at: string
  updated_at: string
}

export interface Room {
  id: number
  number: string
  room_type_id: number
  room_type?: RoomType
  floor: number
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  notes: string
  capacity?: number
  description?: string
  amenities?: string
  view?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Guest {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  passport_number: string
  date_of_birth: string
  country: string
  notes: string
  bookings_count?: number
  created_at: string
  updated_at: string
}

export interface Booking {
  id: number
  room_id: number
  room?: Room
  guest_id: number
  guest?: Guest
  user_id: number
  user?: User
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed'
  notes: string
  created_at: string
  updated_at: string
  booking_services?: BookingService[]
  services?: Service[]
}

export interface BookingService {
  id: number
  booking_id: number
  service_id: number
  service?: Service
  quantity: number
  price: number
  created_at: string
  updated_at: string
}

export interface Service {
  id: number
  name: string
  description: string
  price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  id: number
  booking_id: number
  booking?: Booking
  amount: number
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'online'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_date: string
  transaction_id: string
  notes: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_rooms: number
  available_rooms: number
  occupied_rooms: number
  total_bookings: number
  active_bookings: number
  upcoming_bookings: number
  total_guests: number
  total_revenue: number
}

export interface OccupancyRateStats {
  total_rooms: number
  occupied_rooms: number
  occupancy_rate: number
}

export type RoomStatistics = Record<string, number>

export interface RevenueReport {
  start_date: string
  end_date: string
  total_revenue: number
  total_payments: number
  payment_methods: Record<string, number>
  revpar: number
}

export interface RevenueTrendData {
  month: string
  revenue: number
}

export interface BookingsTrendData {
  by_status: Record<string, number>
  by_month: Array<{ month: string; count: number }>
}
