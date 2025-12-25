class Api::V1::RoomsController < Api::V1::BaseController
  before_action :set_room, only: [:show, :update, :destroy, :activity]

  def index
    authorize Room
    rooms = Room.includes(:room_type).all
    
    rooms = rooms.where(status: params[:status]) if params[:status].present?
    rooms = rooms.where(room_type_id: params[:room_type_id]) if params[:room_type_id].present?
    rooms = rooms.where(floor: params[:floor]) if params[:floor].present?
    rooms = rooms.where("number ILIKE ?", "%#{params[:number]}%") if params[:number].present?
    
    if params[:check_in_date].present? && params[:check_out_date].present?
      check_in = Date.parse(params[:check_in_date])
      check_out = Date.parse(params[:check_out_date])
      
      unavailable_bookings = Booking
        .where(status: ['confirmed', 'checked_in', 'checked_out', 'pending'])
        .where('check_out_date > ? AND check_in_date < ?', check_in, check_out)

      unavailable_bookings = unavailable_bookings.where.not(id: params[:exclude_booking_id]) if params[:exclude_booking_id].present?
      
      unavailable_room_ids = unavailable_bookings.pluck(:room_id).uniq
      
      rooms = rooms.where.not(id: unavailable_room_ids) if unavailable_room_ids.any?
    end
    
    pagy, @rooms = pagy(rooms, limit: params[:limit] || 50)
    render json: {
      data: @rooms.as_json(include: :room_type),
      pagination: pagy_metadata(pagy)
    }
  end

  def show
    authorize @room
    render json: @room, include: :room_type
  end

  def create
    @room = Room.new(room_params)
    authorize @room

    if @room.save
      render json: @room, status: :created
    else
      render json: { errors: @room.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @room

    if @room.update(room_params)
      render json: @room
    else
      render json: { errors: @room.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @room
    @room.destroy
    head :no_content
  end

  def available
    @rooms = Room.available.includes(:room_type)
    authorize @rooms
    render json: @rooms, include: :room_type
  end

  def activity
    authorize @room
    
    year = params[:year]&.to_i || Date.today.year
    start_date = Date.new(year, 1, 1)
    end_date = Date.new(year, 12, 31)
    
    bookings = @room.bookings
      .where('check_in_date <= ? AND check_out_date >= ?', end_date, start_date)
      .select(:check_in_date, :check_out_date, :status)
    
    activity_map = {}
    (start_date..end_date).each do |date|
      activity_map[date.to_s] = 'available'
    end
    
    bookings.each do |booking|
      booking_start = [booking.check_in_date, start_date].max
      booking_end = [booking.check_out_date, end_date].min
      
      (booking_start..booking_end).each do |date|
        case booking.status
        when 'confirmed', 'checked_in', 'checked_out'
          activity_map[date.to_s] = 'occupied'
        when 'pending'
          activity_map[date.to_s] = 'reserved' if activity_map[date.to_s] == 'available'
        end
      end
    end
    
    if @room.status == 'maintenance'
      today = Date.today
      if today >= start_date && today <= end_date && activity_map[today.to_s] == 'available'
        activity_map[today.to_s] = 'maintenance'
      end
    end
    
    render json: {
      room_id: @room.id,
      room_number: @room.number,
      year: year,
      start_date: start_date,
      end_date: end_date,
      activity: activity_map
    }
  end

  private

  def set_room
    @room = Room.find(params[:id])
  end

  def room_params
    params.require(:room).permit(:number, :room_type_id, :floor, :status, :notes, :capacity, :description, :amenities, :view, :image_url)
  end
end
