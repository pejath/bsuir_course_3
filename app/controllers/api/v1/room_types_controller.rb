class Api::V1::RoomTypesController < Api::V1::BaseController
  before_action :set_room_type, only: [ :show, :update, :destroy ]

  def index
    @room_types = RoomType.all
    authorize @room_types
    render json: @room_types
  end

  def show
    authorize @room_type
    render json: @room_type
  end

  def create
    @room_type = RoomType.new(room_type_params)
    authorize @room_type

    if @room_type.save
      render json: @room_type, status: :created
    else
      render json: { errors: @room_type.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @room_type

    if @room_type.update(room_type_params)
      render json: @room_type
    else
      render json: { errors: @room_type.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @room_type
    @room_type.destroy
    head :no_content
  end

  private

  def set_room_type
    @room_type = RoomType.find(params[:id])
  end

  def room_type_params
    params.require(:room_type).permit(:name, :description, :capacity, :base_price, :amenities)
  end
end
