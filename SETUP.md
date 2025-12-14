# Hotel Analytics - Setup Instructions

## Backend Setup (Rails API)

1. Install dependencies:
```bash
bundle install
```

2. Setup database:
```bash
cp env.example .env
# Edit .env with your PostgreSQL credentials

# Create and migrate database
rails db:create
rails db:migrate
```

3. Create initial admin user (Rails console):
```bash
rails c
User.create!(
  email: 'admin@hotel.com',
  password: '123456',
  first_name: 'Admin',
  last_name: 'User',
  role: 2
)
exit
```

4. Start Rails server:
```bash
rails s
```

## Frontend Setup (React)

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

## Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Login: admin@hotel.com / password123

## Models Structure

- **User**: Staff (0), Manager (1), Admin (2) roles
- **RoomType**: Room categories with pricing and amenities
- **Room**: Individual hotel rooms with status (available, occupied, maintenance, reserved)
- **Guest**: Guest information and contact details
- **Booking**: Room reservations with status tracking
- **Service**: Additional hotel services
- **BookingService**: Link between bookings and services
- **Payment**: Payment tracking with methods (cash, card, bank_transfer)

## API Endpoints

### Authentication
- `POST /api/v1/users/sign_in` - Login
- `POST /api/v1/users/sign_up` - Register
- `DELETE /api/v1/users/sign_out` - Logout

### Resources
- `/api/v1/rooms` - Room management
  - `GET /api/v1/rooms/available` - Get available rooms
- `/api/v1/room_types` - Room type management
- `/api/v1/bookings` - Booking management
  - `PATCH /api/v1/bookings/:id/cancel` - Cancel booking
- `/api/v1/guests` - Guest management
- `/api/v1/services` - Service management
- `/api/v1/payments` - Payment management

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard statistics
- `GET /api/v1/analytics/occupancy_rate` - Room occupancy rate
- `GET /api/v1/analytics/revenue_report` - Revenue report
- `GET /api/v1/analytics/room_statistics` - Room statistics by status
