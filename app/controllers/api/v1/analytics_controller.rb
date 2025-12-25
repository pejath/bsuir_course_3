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
    bookings_by_month = Booking
      .where('created_at >= ?', 6.months.ago)
      .group_by { |b| b.created_at.beginning_of_month }
      .map { |month, bookings| { month: month.strftime('%b %Y'), count: bookings.count } }
      .sort_by { |d| Date.parse("01 #{d[:month]}") }

    render json: {
      by_status: bookings_by_status,
      by_month: bookings_by_month
    }
  end
end
