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
- Login: admin@hotel.com / 123456


