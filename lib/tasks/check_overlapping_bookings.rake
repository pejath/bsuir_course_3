namespace :bookings do
  desc "Check for overlapping bookings in the database"
  task check_overlapping: :environment do
    puts "Checking for overlapping bookings..."
    puts "=" * 50
    
    overlapping_count = 0
    processed_rooms = {}
    
    # Get all rooms
    rooms = Room.includes(:bookings).all
    
    rooms.each do |room|
      puts "\nChecking Room #{room.number} (ID: #{room.id})..."
      
      # Get all bookings for this room, ordered by check-in date
      bookings = room.bookings
        .where(status: [:pending, :confirmed, :checked_in])
        .order(:check_in_date)
      
      next if bookings.size < 2
      
      puts "  Found #{bookings.size} active bookings"
      
      # Check each booking against all others
      bookings.each_with_index do |booking1, i|
        bookings[(i+1)..-1].each do |booking2|
          # Check if dates overlap
          if booking1.check_in_date < booking2.check_out_date && 
             booking2.check_in_date < booking1.check_out_date
            
            overlapping_count += 1
            
            puts "\n  ⚠️  OVERLAPPING BOOKINGS FOUND:"
            puts "    Booking ID #{booking1.id}:"
            puts "      Guest: #{booking1.guest&.first_name} #{booking1.guest&.last_name}"
            puts "      Check-in:  #{booking1.check_in_date}"
            puts "      Check-out: #{booking1.check_out_date}"
            puts "      Status: #{booking1.status}"
            puts "    "
            puts "    Booking ID #{booking2.id}:"
            puts "      Guest: #{booking2.guest&.first_name} #{booking2.guest&.last_name}"
            puts "      Check-in:  #{booking2.check_in_date}"
            puts "      Check-out: #{booking2.check_out_date}"
            puts "      Status: #{booking2.status}"
            puts "    " + "-" * 40
          end
        end
      end
      
      if bookings.size >= 2
        puts "  No overlaps found for this room" if overlapping_count == 0 || !processed_rooms[room.id]
      end
      
      processed_rooms[room.id] = true
    end
    
    puts "\n" + "=" * 50
    if overlapping_count > 0
      puts "❌ Found #{overlapping_count} overlapping booking(s)!"
      puts "\nTo fix these overlaps, you should:"
      puts "1. Review the conflicting bookings above"
      puts "2. Contact guests if necessary"
      puts "3. Update or cancel the conflicting bookings"
    else
      puts "✅ No overlapping bookings found!"
    end
    puts "=" * 50
  end
  
  desc "List all bookings by room with dates"
  task list_by_room: :environment do
    puts "All bookings by room:"
    puts "=" * 50
    
    Room.includes(:bookings => :guest).all.each do |room|
      puts "\nRoom #{room.number} (#{room.room_type&.name}):"
      
      bookings = room.bookings.order(:check_in_date)
      
      if bookings.empty?
        puts "  No bookings"
      else
        bookings.each do |booking|
          status_icon = case booking.status
                       when 'pending' then '⏳'
                       when 'confirmed' then '✅'
                       when 'checked_in' then '🏨'
                       when 'checked_out' then '🚪'
                       when 'cancelled' then '❌'
                       else '❓'
          end
          
          puts "  #{status_icon} ID:#{booking.id} | #{booking.check_in_date} → #{booking.check_out_date} | #{booking.guest&.first_name} #{booking.guest&.last_name} (#{booking.status})"
        end
      end
    end
  end
end
