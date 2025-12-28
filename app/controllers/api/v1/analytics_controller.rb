class Api::V1::AnalyticsController < Api::V1::BaseController
  def dashboard
    upcoming_bookings = Booking.where(status: [:confirmed, :pending])
                               .where('check_in_date > ?', Date.today)
                               .count
    
    render json: {
      total_rooms: Room.count,
      available_rooms: Room.available.count,
      occupied_rooms: Room.occupied.count,
      total_bookings: Booking.count,
      active_bookings: Booking.active.count,
      upcoming_bookings: upcoming_bookings,
      total_guests: Guest.count,
      total_revenue: Payment.where(status: :completed).sum(:amount)
    }
  end

  def occupancy_rate
    total_rooms = Room.count
    occupied_rooms = Room.occupied.count
    rate = total_rooms.zero? ? 0 : (occupied_rooms.to_f / total_rooms * 100).round(2)

    render json: {
      total_rooms: total_rooms,
      occupied_rooms: occupied_rooms,
      occupancy_rate: rate
    }
  end

  def revenue_report
    start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
    end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today.end_of_month

    payments = Payment.where(status: :completed, payment_date: start_date..end_date)
    
    render json: {
      start_date: start_date,
      end_date: end_date,
      total_revenue: payments.sum(:amount),
      total_payments: payments.count,
      payment_methods: payments.group(:payment_method).sum(:amount)
    }
  end

  def room_statistics
    render json: Room.group(:status).count
  end

  def revenue_trend
    start_date = params[:start_date] ? Date.parse(params[:start_date]) : 6.months.ago.beginning_of_month
    end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today.end_of_month

    payments = Payment.where(status: :completed, payment_date: start_date..end_date)
    
    monthly_revenue = payments
      .group_by { |p| p.payment_date.beginning_of_month }
      .map { |month, pmts| { month: month.strftime('%b %Y'), revenue: pmts.sum(&:amount) } }
      .sort_by { |d| Date.parse("01 #{d[:month]}") }

    render json: monthly_revenue
  end

  def bookings_trend
    bookings_by_status = Booking.group(:status).count
    
    # Show bookings by check-in date for the last 6 months
    end_date = Date.today.end_of_month
    start_date = end_date - 5.months
    
    bookings_by_month = []
    current_month = start_date
    
    while current_month <= end_date
      month_start = current_month.beginning_of_month
      month_end = current_month.end_of_month
      
      count = Booking
        .where('check_in_date >= ? AND check_in_date <= ?', month_start, month_end)
        .count
      
      bookings_by_month << {
        month: current_month.strftime('%b %Y'),
        count: count
      }
      
      current_month = current_month.next_month
    end

    render json: {
      by_status: bookings_by_status,
      by_month: bookings_by_month
    }
  end

  def occupancy_trend
    # Look at the last 6 months including historical data
    end_date = Date.today.end_of_month
    start_date = end_date - 5.months
    
    # Calculate occupancy rate for each month
    monthly_data = []
    current_month = start_date
    
    while current_month <= end_date
      month_start = current_month.beginning_of_month
      month_end = current_month.end_of_month
      days_in_month = (month_end - month_start + 1).to_i
      
      # Calculate total available room-nights
      total_rooms = Room.count
      total_room_nights = total_rooms * days_in_month
      
      # Calculate actual occupied room-nights
      occupied_room_nights = 0
      
      # Look for bookings that overlap with this month
      bookings = Booking
        .where(status: [:confirmed, :checked_in, :checked_out])
        .where('check_in_date <= ? AND check_out_date >= ?', month_end, month_start)
      
      bookings.each do |booking|
        # Calculate nights within this month
        next if booking.check_in_date.nil? || booking.check_out_date.nil?
        
        booking_start = [booking.check_in_date, month_start.to_date].max
        booking_end = [booking.check_out_date, month_end.to_date].min
        
        if booking_start < booking_end
          occupied_room_nights += (booking_end - booking_start).to_i
        end
      end
      
      occupancy_rate = total_room_nights.zero? ? 0 : (occupied_room_nights.to_f / total_room_nights * 100).round(2)
      
      monthly_data << {
        month: current_month.strftime('%b %Y'),
        occupancy_rate: occupancy_rate
      }
      
      current_month = current_month.next_month
    end
    
    render json: monthly_data
  end

  def lead_time_stats
    # Calculate average lead time using SQL instead of loading all records
    average_lead_time = Booking
      .where.not(check_in_date: nil)
      .where('created_at <= check_in_date')
      .average('DATE(check_in_date) - DATE(created_at)')
    
    # Convert to days and round to 1 decimal place
    average_lead_time = average_lead_time ? average_lead_time.round(1) : 0
    
    render json: {
      average_lead_time: average_lead_time
    }
  end

  def top_room_types
    # Calculate revenue and bookings by room type with proper joins
    room_type_stats = Booking.joins(room: :room_type)
      .joins(:payments)
      .where('payments.status = ?', 1)  # Use integer for completed status
      .group('room_types.name')
      .select(
        'room_types.name as room_type',
        'SUM(payments.amount) as total_revenue',
        'COUNT(DISTINCT bookings.id) as total_bookings'
      )
    
    result = room_type_stats.map do |stat|
      {
        room_type: stat.room_type,
        revenue: stat.total_revenue.to_f,
        bookings: stat.total_bookings
      }
    end.sort_by { |r| -r[:revenue] }.first(10) # Top 10 room types
    
    render json: result
  end

  def guest_countries
    # Count guests by country
    country_stats = Guest
      .where.not(country: [nil, ''])
      .group(:country)
      .order(Arel.sql('COUNT(*) DESC'))
      .limit(10)
      .count
    
    result = country_stats.map do |country, count|
      {
        country: country,
        count: count
      }
    end
    
    render json: result
  end
end
