class Api::V1::AnalyticsController < Api::V1::BaseController
  before_action :require_manager!
  
  def dashboard
    total_rooms = Room.count
    occupied_rooms = Room.occupied.count
    available_rooms = total_rooms - occupied_rooms
    active_bookings = Booking.active.count
    upcoming_bookings = Booking.where(status: [:confirmed, :pending])
                               .where('check_in_date > ?', Date.today)
                               .count
    
    # Calculate total revenue including services
    payments_revenue = Payment.where(status: :completed).sum(:amount)
    services_revenue = BookingService.joins(:booking)
      .sum('booking_services.price * booking_services.quantity')
    total_revenue = payments_revenue + services_revenue
    
    render json: {
      total_rooms: total_rooms,
      available_rooms: available_rooms,
      occupied_rooms: occupied_rooms,
      total_bookings: Booking.count,
      active_bookings: active_bookings,
      upcoming_bookings: upcoming_bookings,
      total_guests: Guest.count,
      total_revenue: total_revenue
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
    payments_revenue = payments.sum(:amount)
    
    # Get services revenue
    booking_services = BookingService.joins(:booking, :service)
      .where('bookings.check_in_date >= ? AND bookings.check_in_date <= ?', start_date, end_date)
    services_revenue = booking_services.sum('booking_services.price * booking_services.quantity')
    
    # Total revenue includes payments and services
    total_revenue = payments_revenue + services_revenue
    
    # Calculate RevPAR
    total_rooms = Room.count
    days_in_period = (end_date - start_date + 1).to_i
    revpar = total_rooms > 0 && days_in_period > 0 ? total_revenue / total_rooms / days_in_period : 0
    
    render json: {
      start_date: start_date,
      end_date: end_date,
      total_revenue: total_revenue,
      total_payments: payments.count,
      payment_methods: payments.group(:payment_method).sum(:amount),
      revpar: revpar.round(2)
    }
  end

  def export_pdf
    start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
    end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today.end_of_month

    # Get data
    payments = Payment.where(status: :completed, payment_date: start_date..end_date)
    payments_revenue = payments.sum(:amount)
    
    # Get services revenue
    booking_services = BookingService.joins(:booking, :service)
      .where('bookings.check_in_date >= ? AND bookings.check_in_date <= ?', start_date, end_date)
    services_revenue = booking_services.sum('booking_services.price * booking_services.quantity')
    
    # Total revenue includes payments and services
    total_revenue = payments_revenue + services_revenue
    total_bookings = payments.joins(:booking).distinct.count
    average_booking_value = total_bookings > 0 ? total_revenue / total_bookings : 0
    
    # Calculate occupancy rate
    total_rooms = Room.count
    occupied_rooms = Room.occupied.count
    occupancy_rate = total_rooms > 0 ? (occupied_rooms.to_f / total_rooms * 100).round(2) : 0
    
    # Calculate RevPAR
    days_in_period = (end_date - start_date + 1).to_i
    revpar = total_rooms > 0 && days_in_period > 0 ? total_revenue / total_rooms / days_in_period : 0

    # Generate PDF
    pdf = Prawn::Document.new
    
    # Title
    pdf.text "Analytics Report", size: 18, style: :bold
    pdf.move_down 10
    
    # Period
    pdf.text "Period: #{start_date} to #{end_date}", size: 12
    pdf.move_down 20
    
    # Summary
    pdf.text "Summary", size: 14, style: :bold
    pdf.move_down 10
    
    pdf.text "Total Revenue: $#{total_revenue.round(2)}"
    pdf.text "Total Bookings: #{total_bookings}"
    pdf.text "Average Booking Value: $#{average_booking_value.round(2)}"
    pdf.text "Occupancy Rate: #{occupancy_rate}%"
    pdf.text "RevPAR: $#{revpar.round(2)}"
    pdf.text "Services Revenue: $#{services_revenue.round(2)}"
    pdf.text "Services Revenue %: #{total_revenue > 0 ? (services_revenue.to_f / total_revenue * 100).round(2) : 0}%"
    pdf.move_down 20
    
    # Payment methods table
    pdf.text "Revenue by Payment Method", size: 14, style: :bold
    pdf.move_down 10
    
    payment_data = [['Payment Method', 'Revenue']]
    payments.group(:payment_method).sum(:amount).each do |method, amount|
      payment_data << [method.humanize, "$#{amount.round(2)}"]
    end
    
    pdf.table(payment_data, header: true, width: pdf.bounds.width) do
      row(0).font_style = :bold
      cells.padding = 8
      cells.borders = [:top, :bottom]
    end
    pdf.move_down 20
    
    # Services table
    pdf.text "Services Revenue", size: 14, style: :bold
    pdf.move_down 10
    
    services_data = [['Service Name', 'Quantity', 'Total Revenue']]
    
    services_stats = booking_services
      .group('services.name')
      .select('services.name as service_name, 
              SUM(booking_services.quantity) as total_quantity,
              SUM(booking_services.price * booking_services.quantity) as total_revenue')
    
    services_stats.each do |service|
      services_data << [
        service.service_name,
        service.total_quantity,
        "$#{service.total_revenue.round(2)}"
      ]
    end
    
    pdf.table(services_data, header: true, width: pdf.bounds.width) do
      row(0).font_style = :bold
      cells.padding = 8
      cells.borders = [:top, :bottom]
    end
    pdf.move_down 20
    
    # Raw bookings data
    pdf.start_new_page
    pdf.text "Raw Bookings Data", size: 14, style: :bold
    pdf.move_down 10
    pdf.text "Bookings within period (#{start_date} to #{end_date})", size: 10
    pdf.move_down 10
    
    bookings_data = [['ID', 'Room', 'Guest', 'Check-in', 'Check-out', 'Status', 'Total Price']]
    
    Booking.where('check_in_date >= ? AND check_in_date <= ?', start_date, end_date)
           .includes(:room, :guest)
           .limit(50) # Limit to prevent PDF from being too large
           .each do |booking|
      bookings_data << [
        booking.id,
        booking.room&.number || 'N/A',
        "#{booking.guest&.first_name} #{booking.guest&.last_name}",
        booking.check_in_date,
        booking.check_out_date,
        booking.status,
        "$#{booking.total_price.round(2)}"
      ]
    end
    
    pdf.table(bookings_data, header: true, width: pdf.bounds.width) do
      row(0).font_style = :bold
      cells.padding = 6
      cells.size = 8
    end
    
    # Send PDF
    send_data pdf.render,
      filename: "analytics-#{start_date}-to-#{end_date}.pdf",
      type: 'application/pdf',
      disposition: 'inline'
  end

  def export_excel
    start_date = params[:start_date] ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
    end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today.end_of_month

    # Get data
    payments = Payment.where(status: :completed, payment_date: start_date..end_date)
    payments_revenue = payments.sum(:amount)
    
    # Get services data
    booking_services = BookingService.joins(:booking, :service)
      .where('bookings.check_in_date >= ? AND bookings.check_in_date <= ?', start_date, end_date)
    services_revenue = booking_services.sum('booking_services.price * booking_services.quantity')
    
    # Total revenue includes payments and services
    total_revenue = payments_revenue + services_revenue
    total_bookings = payments.joins(:booking).distinct.count
    average_booking_value = total_bookings > 0 ? total_revenue / total_bookings : 0
    
    # Calculate occupancy rate
    total_rooms = Room.count
    occupied_rooms = Room.occupied.count
    occupancy_rate = total_rooms > 0 ? (occupied_rooms.to_f / total_rooms * 100).round(2) : 0
    
    # Calculate RevPAR
    days_in_period = (end_date - start_date + 1).to_i
    revpar = total_rooms > 0 && days_in_period > 0 ? total_revenue / total_rooms / days_in_period : 0
    
    # Create workbook
    workbook = Axlsx::Package.new
    
    # Summary sheet
    summary_sheet = workbook.workbook.add_worksheet(name: 'Summary')
    summary_sheet.add_row ['Metric', 'Value']
    summary_sheet.add_row ['Total Revenue', total_revenue]
    summary_sheet.add_row ['Total Bookings', total_bookings]
    summary_sheet.add_row ['Average Booking Value', average_booking_value]
    summary_sheet.add_row ['Occupancy Rate (%)', occupancy_rate]
    summary_sheet.add_row ['RevPAR', revpar]
    summary_sheet.add_row ['Total Rooms', total_rooms]
    summary_sheet.add_row ['Services Revenue', services_revenue]
    summary_sheet.add_row ['Services Revenue (%)', total_revenue > 0 ? (services_revenue.to_f / total_revenue * 100).round(2) : 0]
    summary_sheet.add_row ['Period', "#{start_date} to #{end_date}"]
    
    # Payment methods sheet
    payment_sheet = workbook.workbook.add_worksheet(name: 'By Payment Method')
    payment_sheet.add_row ['Payment Method', 'Revenue']
    
    payments.group(:payment_method).sum(:amount).each do |method, amount|
      payment_sheet.add_row [method.humanize, amount]
    end
    
    # Raw bookings data sheet
    bookings_sheet = workbook.workbook.add_worksheet(name: 'Bookings Raw Data')
    bookings_sheet.add_row [
      'Booking ID', 'Room Number', 'Room Type', 'Guest First Name', 'Guest Last Name',
      'Guest Email', 'Guest Country', 'Check-in Date', 'Check-out Date', 'Number of Guests',
      'Total Price', 'Status', 'Created At', 'Notes'
    ]
    
    Booking.where('check_in_date >= ? AND check_in_date <= ?', start_date, end_date)
           .includes(:guest, room: :room_type,)
           .find_each do |booking|
      bookings_sheet.add_row [
        booking.id,
        booking.room&.number || 'N/A',
        booking.room&.room_type&.name || 'N/A',
        booking.guest&.first_name || 'N/A',
        booking.guest&.last_name || 'N/A',
        booking.guest&.email || 'N/A',
        booking.guest&.country || 'N/A',
        booking.check_in_date,
        booking.check_out_date,
        booking.number_of_guests,
        booking.total_price,
        booking.status,
        booking.created_at,
        booking.notes || ''
      ]
    end
    
    # Raw payments data sheet
    payments_sheet = workbook.workbook.add_worksheet(name: 'Payments Raw Data')
    payments_sheet.add_row [
      'Payment ID', 'Booking ID', 'Amount', 'Payment Method', 'Status',
      'Payment Date', 'Transaction ID', 'Created At', 'Notes'
    ]
    
    payments.includes(:booking).find_each do |payment|
      payments_sheet.add_row [
        payment.id,
        payment.booking_id,
        payment.amount,
        payment.payment_method,
        payment.status,
        payment.payment_date,
        payment.transaction_id || 'N/A',
        payment.created_at,
        payment.notes || ''
      ]
    end
    
    # Room statistics sheet
    rooms_sheet = workbook.workbook.add_worksheet(name: 'Room Statistics')
    rooms_sheet.add_row ['Room Number', 'Room Type', 'Status', 'Floor', 'Capacity']
    
    Room.includes(:room_type).find_each do |room|
      rooms_sheet.add_row [
        room.number,
        room.room_type&.name || 'N/A',
        room.status,
        room.floor,
        room.capacity || 'N/A'
      ]
    end
    
    # Services sheet
    services_sheet = workbook.workbook.add_worksheet(name: 'Services')
    services_sheet.add_row ['Service Name', 'Quantity', 'Total Revenue', 'Average Price']
    
    services_data = booking_services
      .group('services.name')
      .select('services.name as service_name, 
              SUM(booking_services.quantity) as total_quantity,
              SUM(booking_services.price * booking_services.quantity) as total_revenue,
              AVG(booking_services.price) as avg_price')
    
    services_data.each do |service|
      services_sheet.add_row [
        service.service_name,
        service.total_quantity,
        service.total_revenue,
        service.avg_price&.round(2) || 0
      ]
    end
    
    # Send Excel file
    send_data workbook.to_stream.read,
      filename: "analytics-#{start_date}-to-#{end_date}.xlsx",
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'inline'
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
      
      current_month = current_month + 1.month
    end
    
    render json: {
      by_month: bookings_by_month,
      by_status: bookings_by_status
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

  def services_analytics
    start_date = params[:start_date] ? Date.parse(params[:start_date]) : 6.months.ago.beginning_of_month
    end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today.end_of_month

    # Get services revenue
    booking_services = BookingService.joins(:booking, :service)
      .where('bookings.check_in_date >= ? AND bookings.check_in_date <= ?', start_date, end_date)
    
    services_revenue = booking_services
      .group('services.name')
      .sum('booking_services.price * booking_services.quantity')
    
    services_usage = booking_services
      .group('services.name')
      .sum('booking_services.quantity')
    
    # Top services by revenue
    top_services = services_revenue
      .sort_by { |_, revenue| -revenue }
      .first(10)
      .map { |name, revenue| { name: name, revenue: revenue } }
    
    # Services usage distribution
    usage_distribution = services_usage.map do |name, quantity|
      {
        name: name,
        quantity: quantity
      }
    end
    
    render json: {
      total_services_revenue: booking_services.sum('booking_services.price * booking_services.quantity'),
      top_services: top_services,
      usage_distribution: usage_distribution,
      services_count: Service.count,
      active_services_count: Service.active.count
    }
  end
end
