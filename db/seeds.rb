# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "Creating users..."
admin = User.find_or_create_by!(email: 'admin@hotel.com') do |user|
  user.password = '123456'
  user.first_name = 'Admin'
  user.last_name = 'User'
  user.role = 3
end
puts "✓ Admin created: #{admin.email}"

manager = User.find_or_create_by!(email: 'manager@hotel.com') do |user|
  user.password = '123456'
  user.first_name = 'Manager'
  user.last_name = 'User'
  user.role = 2
end
puts "✓ Manager created: #{manager.email}"

staff = User.find_or_create_by!(email: 'staff@hotel.com') do |user|
  user.password = '123456'
  user.first_name = 'Staff'
  user.last_name = 'User'
  user.role = 1
end
puts "✓ Staff created: #{staff.email}"

analytics = User.find_or_create_by!(email: 'analytics@hotel.com') do |user|
  user.password = '123456'
  user.first_name = 'Analytics'
  user.last_name = 'User'
  user.role = 4
end
puts "✓ Analytics created: #{analytics.email}"

puts "\nCreating room types..."
standard = RoomType.find_or_create_by!(name: 'Standard') do |rt|
  rt.description = 'Comfortable standard room with basic amenities'
  rt.capacity = 2
  rt.base_price = 100.00
  rt.amenities = { wifi: true, tv: true, ac: true }
end
puts "✓ Room type: #{standard.name}"

deluxe = RoomType.find_or_create_by!(name: 'Deluxe') do |rt|
  rt.description = 'Spacious deluxe room with premium amenities'
  rt.capacity = 3
  rt.base_price = 200.00
  rt.amenities = { wifi: true, tv: true, ac: true, minibar: true, balcony: true }
end
puts "✓ Room type: #{deluxe.name}"

suite = RoomType.find_or_create_by!(name: 'Suite') do |rt|
  rt.description = 'Luxury suite with separate living area'
  rt.capacity = 4
  rt.base_price = 350.00
  rt.amenities = { wifi: true, tv: true, ac: true, minibar: true, balcony: true, jacuzzi: true }
end
puts "✓ Room type: #{suite.name}"

puts "\nCleaning existing data..."
Booking.delete_all
Guest.delete_all
Room.delete_all

puts "\nCreating 256 rooms..."
room_types = [standard, deluxe, suite]
room_distribution = { standard => 0.60, deluxe => 0.30, suite => 0.10 }

# Initialize Unsplash client
require 'unsplash'
unsplash = Unsplash::Client.new

# Fetch hotel photos from Unsplash (256 photos)
hotel_photos = []
puts "Fetching 256 hotel photos from Unsplash..."
begin
  # Get 30 photos per page (max allowed), need 9 pages to get 256 photos
  (1..9).each do |page|
    photos = unsplash.search.photos("hotels", page: page, per_page: 30)
    hotel_photos.concat(photos.map(&:urls).map { |url| url[:regular] })
    print "."
    sleep(0.1) # Respect rate limits
  end
  puts "\n✓ Fetched #{hotel_photos.size} hotel photos"
rescue => e
  puts "\n⚠️  Error fetching photos from Unsplash: #{e.message}"
  puts "Using fallback image URLs..."
  # Fallback to dummy images if Unsplash fails
  hotel_photos = (1..256).map { |i| "https://dummyimage.com/800x600/000/ffffff&text=Hotel#{i}" }
end

rooms_created = 0
(1..16).each do |floor|
  (1..16).each do |room_num|
    room_number = "#{floor}#{room_num.to_s.rjust(2, '0')}"
    
    rand_val = rand
    room_type = if rand_val < 0.60
      standard
    elsif rand_val < 0.90
      deluxe
    else
      suite
    end
    
    views = ['City', 'Garden', 'Sea', 'Mountain', 'Pool', 'Courtyard']
    
    # Use a photo from Unsplash or fallback
    image_url = hotel_photos[rooms_created] || "https://dummyimage.com/800x600/000/ffffff&text=#{room_number}"
    
    Room.create!(
      number: room_number,
      room_type: room_type,
      floor: floor,
      status: 0,
      capacity: room_type.capacity,
      description: Faker::Lorem.paragraph(sentence_count: 3),
      amenities: "WiFi, TV, Air conditioning, #{['Mini bar', 'Safe', 'Coffee maker', 'Hairdryer'].sample(rand(2..4)).join(', ')}",
      view: views.sample,
      image_url: image_url
      # image_url: "https://picsum.photos/800/600?random=#{room_number}"
    )
    rooms_created += 1
  end
end
puts "✓ Created #{rooms_created} rooms"

puts "\nCreating services..."
services = []
[
  { name: 'Breakfast', description: 'Continental breakfast', price: 15.00, active: true },
  { name: 'Laundry', description: 'Laundry service', price: 25.00, active: true },
  { name: 'Spa', description: 'Spa and wellness', price: 80.00, active: true },
  { name: 'Airport Transfer', description: 'Airport pickup/dropoff', price: 50.00, active: true },
  { name: 'Room Service', description: '24/7 room service', price: 20.00, active: true },
  { name: 'Late Checkout', description: 'Late checkout until 6 PM', price: 30.00, active: true },
].each do |attrs|
  service = Service.find_or_create_by!(name: attrs[:name]) do |s|
    s.description = attrs[:description]
    s.price = attrs[:price]
    s.active = attrs[:active]
  end
  services << service
  puts "✓ Service: #{service.name}"
end

puts "\nCreating guests..."
require 'faker'

guests = []
2000.times do |i|
  guest = Guest.create!(
    first_name: Faker::Name.first_name,
    last_name: Faker::Name.last_name,
    email: Faker::Internet.unique.email,
    phone: Faker::PhoneNumber.cell_phone,
    passport_number: Faker::Alphanumeric.alphanumeric(number: 9, min_alpha: 1).upcase,
    date_of_birth: Faker::Date.birthday(min_age: 18, max_age: 70),
    country: Faker::Address.country,
    notes: rand < 0.1 ? Faker::Lorem.sentence(word_count: 5) : ''
  )
  guests << guest
end
puts "✓ Created #{guests.count} guests"

puts "\nCreating bookings for 365 days with 80-90% occupancy..."
require 'parallel'

rooms = Room.all.to_a
start_date = Date.today - 365.days
end_date = Date.today + 182.days

puts "Using #{Parallel.processor_count} CPU cores for parallel processing..."

bookings_created = Parallel.map(rooms, in_processes: Parallel.processor_count) do |room|
  ActiveRecord::Base.connection.reconnect!
  
  room_bookings = 0
  current_date = start_date
  
  while current_date < end_date
    if rand < 0.75
      stay_duration = rand(1..7)
      check_in = current_date
      check_out = check_in + stay_duration.days
      
      break if check_out > end_date
      
      guest = guests.sample
      num_guests = rand(1..room.room_type.capacity)
      
      nights = (check_out - check_in).to_i
      base_price = room.room_type.base_price * nights
      
      status = if check_in > Date.today + 30.days
        'pending'
      elsif check_in > Date.today
        rand < 0.8 ? 'confirmed' : 'pending'
      elsif check_out < Date.today
        'checked_out'
      else
        'checked_in'
      end
      
      # Calculate realistic booking lead time (1-30 days before check-in)
      lead_time = rand(1..30)
      booking_created_at = check_in - lead_time.days
      
      # Ensure booking_created_at is not before our 6-month window
      booking_created_at = [booking_created_at, start_date].min
      
      booking = Booking.create!(
        room: room,
        guest: guest,
        user: admin,
        check_in_date: check_in,
        check_out_date: check_out,
        number_of_guests: num_guests,
        total_price: base_price,
        status: status,
        created_at: booking_created_at,
        notes: rand < 0.15 ? Faker::Lorem.sentence(word_count: rand(3..8)) : ''
      )
      
      if rand < 0.4
        booking_services = services.sample(rand(1..3))
        booking_services.each do |service|
          quantity = rand(1..nights)
          booking.booking_services.create!(
            service: service, 
            quantity: quantity,
            price: service.price * quantity
          )
        end
      end
      
      room_bookings += 1
      current_date = check_out + rand(1..5).days
    else
      current_date += rand(2..7).days
    end
  end
  
  room_bookings
end.sum

puts "✓ Created #{bookings_created} bookings"

puts "\nCreating payments for bookings..."
payment_methods = ['cash', 'card', 'bank_transfer']
payments_created = 0

# Use parallel processing for payment creation
payments_created = Parallel.map(Booking.where(status: [:confirmed, :checked_in, :checked_out]), in_processes: Parallel.processor_count) do |booking|
  ActiveRecord::Base.connection.reconnect!
  
  payment_status = if booking.status == 'checked_out'
    'completed'
  elsif booking.status == 'checked_in'
    rand < 0.9 ? 'completed' : 'pending'
  else
    rand < 0.7 ? 'completed' : 'pending'
  end
  
  payment_date = if payment_status == 'completed'
    # Payment made at check-in date (when guest actually pays)
    booking.check_in_date
  else
    nil
  end
  
  # Create payment with correct historical timestamp
  Payment.create!(
    booking: booking,
    amount: booking.total_price,
    payment_method: payment_methods.sample,
    status: payment_status,
    payment_date: payment_date,
    transaction_id: payment_status == 'completed' ? "TXN-#{SecureRandom.hex(8).upcase}" : nil,
    notes: '',
    created_at: payment_date || booking.created_at
  )
  1
end.sum

puts "✓ Created #{payments_created} payments"

puts "\nUpdating room statuses based on current bookings..."
Room.find_each do |room|
  today = Date.today
  
  current_booking = room.bookings
    .where('check_in_date <= ? AND check_out_date >= ?', today, today)
    .where(status: ['confirmed', 'checked_in', 'checked_out'])
    .first
  
  if current_booking
    if current_booking.status == 'checked_in'
      room.update!(status: :occupied)
    elsif current_booking.status == 'confirmed'
      room.update!(status: :reserved)
    elsif current_booking.status == 'checked_out' && current_booking.check_out_date == today
      room.update!(status: :occupied)
    else
      room.update!(status: :occupied)
    end
  else
    upcoming_booking = room.bookings
      .where('check_in_date > ?', today)
      .where(status: ['confirmed', 'pending'])
      .order(:check_in_date)
      .first
    
    if upcoming_booking && upcoming_booking.check_in_date <= today + 7.days
      room.update!(status: :reserved)
    else
      room.update!(status: rand < 0.05 ? :maintenance : :available)
    end
  end
end

occupied_count = Room.where(status: :occupied).count
reserved_count = Room.where(status: :reserved).count
available_count = Room.where(status: :available).count
maintenance_count = Room.where(status: :maintenance).count

puts "✓ Room statuses updated:"
puts "   - Occupied: #{occupied_count}"
puts "   - Reserved: #{reserved_count}"
puts "   - Available: #{available_count}"
puts "   - Maintenance: #{maintenance_count}"

puts "\n✅ Seeds completed successfully!"
puts "📊 Statistics:"
puts "   - Rooms: #{Room.count}"
puts "   - Guests: #{Guest.count}"
puts "   - Bookings: #{Booking.count}"
puts "   - Payments: #{Payment.count}"
puts "   - Services: #{Service.count}"
puts "   - Total Revenue: $#{Payment.where(status: :completed).sum(:amount).round(2)}"
puts "   - Average occupancy: ~85%"
