class Api::V1::RoomsController < Api::V1::BaseController
  before_action :set_room, only: [:show, :update, :destroy]

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

  private

  def set_room
    @room = Room.find(params[:id])
  end

  def room_params
    params.require(:room).permit(:number, :room_type_id, :floor, :status, :notes)
  end
end
