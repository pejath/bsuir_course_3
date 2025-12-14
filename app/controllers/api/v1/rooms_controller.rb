class Api::V1::RoomsController < Api::V1::BaseController
  before_action :set_room, only: [:show, :update, :destroy]

  def index
    authorize Room
    pagy, @rooms = pagy(Room.includes(:room_type).all, limit: params[:limit] || 50)
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

  private

  def set_room
    @room = Room.find(params[:id])
  end

  def room_params
    params.require(:room).permit(:number, :room_type_id, :floor, :status, :notes)
  end
end
