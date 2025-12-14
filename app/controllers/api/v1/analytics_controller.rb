class Api::V1::AnalyticsController < Api::V1::BaseController
  def dashboard
    render json: {
      total_rooms: Room.count,
      available_rooms: Room.available.count,
      occupied_rooms: Room.occupied.count,
      total_bookings: Booking.count,
      active_bookings: Booking.active.count,
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
end
