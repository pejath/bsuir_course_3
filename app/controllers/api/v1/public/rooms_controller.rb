class Api::V1::Public::RoomsController < ApplicationController
  skip_before_action :authenticate_user_from_token!

  def index
    rooms = Room.includes(:room_type).where(status: ['available', 'reserved'])
    
    rooms = rooms.where(room_type_id: params[:room_type_id]) if params[:room_type_id].present?
    rooms = rooms.where(floor: params[:floor]) if params[:floor].present?
    rooms = rooms.where("capacity >= ?", params[:min_capacity].to_i) if params[:min_capacity].present?
    
    if params[:check_in_date].present? && params[:check_out_date].present?
      check_in = Date.parse(params[:check_in_date])
      check_out = Date.parse(params[:check_out_date])
      
      unavailable_bookings = Booking
        .where(status: ['confirmed', 'checked_in', 'checked_out', 'pending'])
        .where('check_out_date > ? AND check_in_date < ?', check_in, check_out)
      
      unavailable_room_ids = unavailable_bookings.pluck(:room_id).uniq
      
      rooms = rooms.where.not(id: unavailable_room_ids) if unavailable_room_ids.any?
    end
    
    pagy, @rooms = pagy(rooms, limit: params[:limit] || 20)
    render json: {
      data: @rooms.as_json(include: :room_type),
      pagination: pagy_metadata(pagy)
    }
  end

  def show
    @room = Room.includes(:room_type).find(params[:id])
    render json: @room, include: :room_type
  end

  def availability
    @room = Room.find(params[:id])
    
    if params[:check_in_date].present? && params[:check_out_date].present?
      # Check specific date range
      check_in = Date.parse(params[:check_in_date])
      check_out = Date.parse(params[:check_out_date])
      
      overlapping = @room.bookings
        .where(status: ['confirmed', 'checked_in', 'pending'])
        .where('check_in_date < ? AND check_out_date > ?', check_out, check_in)
      
      render json: {
        available: !overlapping.exists?,
        check_in_date: check_in,
        check_out_date: check_out
      }
    else
      # Return monthly calendar availability
      year = params[:year]&.to_i || Date.today.year
      month = params[:month]&.to_i || Date.today.month
      
      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month
      
      bookings = @room.bookings
        .where(status: ['confirmed', 'checked_in', 'checked_out', 'pending'])
        .where('check_out_date > ? AND check_in_date < ?', start_date, end_date + 1.day)
      
      unavailable_dates = []
      bookings.each do |booking|
        booking_start = [booking.check_in_date, start_date].max
        booking_end = [booking.check_out_date, end_date].min
        
        (booking_start..booking_end).each do |date|
          unavailable_dates << date.to_s unless unavailable_dates.include?(date.to_s)
        end
      end
      
      render json: {
        room_id: @room.id,
        year: year,
        month: month,
        start_date: start_date,
        end_date: end_date,
        unavailable_dates: unavailable_dates.sort
      }
    end
  end
end
