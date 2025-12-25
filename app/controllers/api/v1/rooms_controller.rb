class Api::V1::RoomsController < Api::V1::BaseController
  before_action :set_room, only: [:show, :update, :destroy, :activity]

  def index
    authorize Room
    rooms = Room.includes(:room_type).all
    
    rooms = rooms.where(status: params[:status]) if params[:status].present?
    rooms = rooms.where(room_type_id: params[:room_type_id]) if params[:room_type_id].present?
    rooms = rooms.where(floor: params[:floor]) if params[:floor].present?
    rooms = rooms.where("number ILIKE ?", "%#{params[:number]}%") if params[:number].present?
    
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
    
    start_date = 1.year.ago.to_date
    end_date = Date.today
    
    bookings = @room.bookings
      .where('check_in_date <= ? AND check_out_date >= ?', end_date, start_date)
      .select(:check_in_date, :check_out_date, :status)
    
    activity_map = {}
    (start_date..end_date).each do |date|
      activity_map[date.to_s] = 0
    end
    
    bookings.each do |booking|
      booking_start = [booking.check_in_date, start_date].max
      booking_end = [booking.check_out_date, end_date].min
      
      (booking_start..booking_end).each do |date|
        activity_map[date.to_s] = 1 if ['confirmed', 'checked_in', 'checked_out'].include?(booking.status)
      end
    end
    
    render json: {
      room_id: @room.id,
      room_number: @room.number,
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
    params.require(:room).permit(:number, :room_type_id, :floor, :status, :notes)
  end
end
