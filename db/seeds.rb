# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "Creating users..."
admin = User.find_or_create_by!(email: 'admin@hotel.com') do |user|
  user.password = '123456'
  user.first_name = 'Admin'
  user.last_name = 'User'
  user.role = 2 # admin
end
puts "✓ Admin created: #{admin.email}"

manager = User.find_or_create_by!(email: 'manager@hotel.com') do |user|
  user.password = '123456'
  user.first_name = 'Manager'
  user.last_name = 'User'
  user.role = 1 # manager
end
puts "✓ Manager created: #{manager.email}"

staff = User.find_or_create_by!(email: 'staff@hotel.com') do |user|
  user.password = '123456'
  user.first_name = 'Staff'
  user.last_name = 'User'
  user.role = 0 # staff
end
puts "✓ Staff created: #{staff.email}"

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

puts "\nCreating rooms..."
[
  { number: '101', room_type: standard, floor: 1, status: 0 },
  { number: '102', room_type: standard, floor: 1, status: 0 },
  { number: '201', room_type: deluxe, floor: 2, status: 0 },
  { number: '202', room_type: deluxe, floor: 2, status: 1 },
  { number: '301', room_type: suite, floor: 3, status: 0 },
].each do |attrs|
  Room.find_or_create_by!(number: attrs[:number]) do |room|
    room.room_type = attrs[:room_type]
    room.floor = attrs[:floor]
    room.status = attrs[:status]
  end
  puts "✓ Room: #{attrs[:number]}"
end

puts "\nCreating services..."
[
  { name: 'Breakfast', description: 'Continental breakfast', price: 15.00, active: true },
  { name: 'Laundry', description: 'Laundry service', price: 25.00, active: true },
  { name: 'Spa', description: 'Spa and wellness', price: 80.00, active: true },
  { name: 'Airport Transfer', description: 'Airport pickup/dropoff', price: 50.00, active: true },
].each do |attrs|
  Service.find_or_create_by!(name: attrs[:name]) do |service|
    service.description = attrs[:description]
    service.price = attrs[:price]
    service.active = attrs[:active]
  end
  puts "✓ Service: #{attrs[:name]}"
end

puts "\n✅ Seeds completed successfully!"
